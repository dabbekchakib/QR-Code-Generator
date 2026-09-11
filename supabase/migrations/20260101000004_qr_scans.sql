-- Phase 6 - Scan tracking & analytics.
--
-- Privacy-first: only limited technical categories are stored (device type,
-- operating system, browser). No raw user-agent, no IP address, no location,
-- no cookies, no fingerprinting. Scans are server events: they are never
-- written through the client row API (no INSERT policy), only through the
-- SECURITY DEFINER function record_qr_scan(), which resolves the short code
-- internally and never accepts a client-supplied qr_code_id.

create table if not exists public.qr_scans (
  id uuid primary key default gen_random_uuid(),
  qr_code_id uuid not null references public.qr_codes (id) on delete cascade,
  scanned_at timestamptz not null default now(),
  device_type text not null default 'unknown'
    check (device_type in ('mobile', 'tablet', 'desktop', 'unknown')),
  operating_system text not null default 'Unknown'
    check (operating_system in ('iOS', 'Android', 'Windows', 'macOS', 'Linux', 'ChromeOS', 'Other', 'Unknown')),
  browser text not null default 'Unknown'
    check (browser in ('Chrome', 'Safari', 'Firefox', 'Edge', 'Samsung Internet', 'Other', 'Unknown'))
);

-- Deleting a QR code permanently removes its scans (no orphaned rows).
create index if not exists qr_scans_qr_code_id_idx
  on public.qr_scans (qr_code_id);

create index if not exists qr_scans_scanned_at_idx
  on public.qr_scans (scanned_at);

create index if not exists qr_scans_qr_scanned_idx
  on public.qr_scans (qr_code_id, scanned_at);

alter table public.qr_scans enable row level security;

-- Owners can read only the scans of their own QR codes. There is deliberately
-- no INSERT/UPDATE/DELETE policy: scan creation happens server-side through
-- record_qr_scan(), anonymous visitors keep no read access at all.
create policy "qr_scans_select_own"
  on public.qr_scans for select
  using (exists (
    select 1 from public.qr_codes q
    where q.id = qr_code_id
      and q.user_id = (select auth.uid())
  ));

-- Best-effort scan recording. The visitor only supplies the short code plus
-- audience categories derived server-side from the User-Agent; the QR id is
-- always resolved here, never accepted from the client. Creation is verified
-- for an active, dynamic QR with a destination, then inserted. Any failure is
-- swallowed so tracking can never break the public redirect.
create or replace function public.record_qr_scan(
  p_short_code text,
  p_device_type text default 'unknown',
  p_operating_system text default 'Unknown',
  p_browser text default 'Unknown'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_device text := coalesce(nullif(trim(p_device_type), ''), 'unknown');
  v_os text := coalesce(nullif(trim(p_operating_system), ''), 'Unknown');
  v_browser text := coalesce(nullif(trim(p_browser), ''), 'Unknown');
begin
  begin
    insert into public.qr_scans (qr_code_id, device_type, operating_system, browser)
    select q.id, v_device, v_os, v_browser
    from public.qr_codes q
    where q.short_code = p_short_code
      and q.is_dynamic = true
      and q.status = 'active'
      and q.destination_url is not null
    limit 1;
  exception when others then
    null; -- tracking must never block the redirect
  end;
end;
$$;

-- Aggregated analytics for the authenticated owner. Every query is scoped by
-- auth.uid(); an optional p_qr_id is verified to belong to the caller before
-- any scan row is read. One round trip serves the whole dashboard so all
-- widgets share the exact same period and QR filter.
create or replace function public.get_qr_analytics(
  p_qr_id uuid default null,
  p_start timestamptz default null,
  p_end timestamptz default null,
  p_offset_minutes int default 0
)
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_tz interval := make_interval(mins => p_offset_minutes);
  v_today_start timestamptz := date_trunc('day', now() + v_tz) - v_tz;
  v_week_start timestamptz := date_trunc('week', now() + v_tz) - v_tz;
  v_month_start timestamptz := date_trunc('month', now() + v_tz) - v_tz;
  v_span interval;
  v_granularity text;
  v_total bigint;
  v_today bigint;
  v_week bigint;
  v_month bigint;
begin
  if v_uid is null then
    raise exception 'QRMANAGER_AUTH_REQUIRED';
  end if;

  if p_qr_id is not null
     and not exists (select 1 from public.qr_codes q where q.id = p_qr_id and q.user_id = v_uid) then
    raise exception 'QRMANAGER_QR_NOT_FOUND';
  end if;

  if p_start is not null and p_end is not null and p_end > p_start then
    v_span := p_end - p_start;
    if v_span <= interval '48 hours' then v_granularity := 'hour';
    elsif v_span <= interval '60 days' then v_granularity := 'day';
    elsif v_span <= interval '200 days' then v_granularity := 'week';
    else v_granularity := 'month';
    end if;
  else
    v_granularity := 'month';
  end if;

  select
    count(*),
    count(*) filter (where s.scanned_at >= v_today_start),
    count(*) filter (where s.scanned_at >= v_week_start),
    count(*) filter (where s.scanned_at >= v_month_start)
  into v_total, v_today, v_week, v_month
  from public.qr_scans s
  join public.qr_codes q on q.id = s.qr_code_id
  where q.user_id = v_uid
    and (p_qr_id is null or q.id = p_qr_id)
    and s.scanned_at >= coalesce(p_start, '-infinity'::timestamptz)
    and s.scanned_at < coalesce(p_end, 'infinity'::timestamptz);

  return json_build_object(
    'summary', json_build_object(
      'total', v_total,
      'today', v_today,
      'thisWeek', v_week,
      'thisMonth', v_month
    ),
    'timeseries', coalesce((
      select json_agg(json_build_object('bucket', b.bucket, 'count', b.count) order by b.bucket)
      from (
        select to_char(s.scanned_at at time zone v_tz,
                 case v_granularity
                   when 'hour' then 'YYYY-MM-DD HH24:00'
                   when 'week' then 'IYYY-"W"IW'
                   when 'month' then 'YYYY-MM'
                   else 'YYYY-MM-DD'
                 end) as bucket,
               count(*)::bigint as count
        from public.qr_scans s
        join public.qr_codes q on q.id = s.qr_code_id
        where q.user_id = v_uid
          and (p_qr_id is null or q.id = p_qr_id)
          and s.scanned_at >= coalesce(p_start, '-infinity'::timestamptz)
          and s.scanned_at < coalesce(p_end, 'infinity'::timestamptz)
        group by 1
      ) b
    ), '[]'::json),
    'topQrs', coalesce((
      select json_agg(json_build_object('id', q.id, 'name', q.name, 'count', t.count) order by t.count desc, q.name asc)
      from (
        select s.qr_code_id, count(*)::bigint as count
        from public.qr_scans s
        join public.qr_codes q on q.id = s.qr_code_id
        where q.user_id = v_uid
          and (p_qr_id is null or q.id = p_qr_id)
          and s.scanned_at >= coalesce(p_start, '-infinity'::timestamptz)
          and s.scanned_at < coalesce(p_end, 'infinity'::timestamptz)
        group by s.qr_code_id
      ) t
      join public.qr_codes q on q.id = t.qr_code_id
      limit 5
    ), '[]'::json),
    'devices', coalesce((
      select json_agg(json_build_object('label', x.device_type, 'count', x.count) order by x.count desc)
      from (
        select s.device_type, count(*)::bigint as count
        from public.qr_scans s
        join public.qr_codes q on q.id = s.qr_code_id
        where q.user_id = v_uid
          and (p_qr_id is null or q.id = p_qr_id)
          and s.scanned_at >= coalesce(p_start, '-infinity'::timestamptz)
          and s.scanned_at < coalesce(p_end, 'infinity'::timestamptz)
        group by s.device_type
      ) x
    ), '[]'::json),
    'operatingSystems', coalesce((
      select json_agg(json_build_object('label', x.operating_system, 'count', x.count) order by x.count desc)
      from (
        select s.operating_system, count(*)::bigint as count
        from public.qr_scans s
        join public.qr_codes q on q.id = s.qr_code_id
        where q.user_id = v_uid
          and (p_qr_id is null or q.id = p_qr_id)
          and s.scanned_at >= coalesce(p_start, '-infinity'::timestamptz)
          and s.scanned_at < coalesce(p_end, 'infinity'::timestamptz)
        group by s.operating_system
      ) x
    ), '[]'::json),
    'browsers', coalesce((
      select json_agg(json_build_object('label', x.browser, 'count', x.count) order by x.count desc)
      from (
        select s.browser, count(*)::bigint as count
        from public.qr_scans s
        join public.qr_codes q on q.id = s.qr_code_id
        where q.user_id = v_uid
          and (p_qr_id is null or q.id = p_qr_id)
          and s.scanned_at >= coalesce(p_start, '-infinity'::timestamptz)
          and s.scanned_at < coalesce(p_end, 'infinity'::timestamptz)
        group by s.browser
      ) x
    ), '[]'::json)
  );
end;
$$;

-- The dynamic QR codes the owner can filter by. Used to populate the filters.
create or replace function public.list_dynamic_qrs()
returns table (id uuid, name text)
language sql
stable
security definer
set search_path = public
as $$
  select q.id, q.name
  from public.qr_codes q
  where q.user_id = (select auth.uid())
    and q.is_dynamic = true
  order by q.name asc, q.created_at asc;
$$;

revoke all on function public.record_qr_scan(text, text, text, text) from public;
grant execute on function public.record_qr_scan(text, text, text, text) to anon, authenticated;

-- Analytics reads are owner-only. Supabase default privileges grant EXECUTE to
-- anon as well, so the function-level checks below are defense-in-depth on top
-- of the auth.uid() guard inside get_qr_analytics() / list_dynamic_qrs().
revoke all on function public.get_qr_analytics(uuid, timestamptz, timestamptz, int) from public;
revoke execute on function public.get_qr_analytics(uuid, timestamptz, timestamptz, int) from anon;
grant execute on function public.get_qr_analytics(uuid, timestamptz, timestamptz, int) to authenticated;

revoke all on function public.list_dynamic_qrs() from public;
revoke execute on function public.list_dynamic_qrs() from anon;
grant execute on function public.list_dynamic_qrs() to authenticated;