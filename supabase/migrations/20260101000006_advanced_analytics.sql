-- Phase 10 - Advanced Analytics & Reports.
--
-- Adds server-side aggregation endpoints for the analytics dashboard:
--   * get_qr_performance  - per Dynamic QR row (total / today / last 7 / last 30 / last scan)
--   * get_qr_comparison   - 2..5 Dynamic QRs compared over the same window
--   * get_qr_scans_export - raw (limited) audit rows for CSV / JSON export
-- and redefines get_qr_analytics() so a 7/30/90 days window is bucketed per DAY
-- (previous thresholds switched to weekly after 60 days).
--
-- Privacy posture is unchanged from Phase 6: only device type, operating system
-- and browser are stored. No IP, no raw User-Agent, no location, no cookies.
-- All functions are SECURITY DEFINER but scope every read to auth.uid() and
-- verify any supplied QR id belongs to the caller before touching scan rows.
--
-- The qr_scans indexes required for these queries already exist from migration
-- 04 (qr_code_id, scanned_at, qr_code_id+scanned_at) and are NOT recreated.

-- ---------------------------------------------------------------------------
-- get_qr_analytics - regenerate with day granularity up to ~200 days.
-- The window buckets adapt to its span: hour (< 48h), day (< 200 days),
-- week (< 800 days), month otherwise. Open-ended ("all time") -> month.
-- ---------------------------------------------------------------------------
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

  -- Week starts on Monday (Postgres date_trunc('week')) for every locale: the
  -- backend stays deterministic and the UI never shifts between locales.
  if p_start is not null and p_end is not null and p_end > p_start then
    v_span := p_end - p_start;
    if v_span <= interval '48 hours' then v_granularity := 'hour';
    elsif v_span <= interval '200 days' then v_granularity := 'day';
    elsif v_span <= interval '800 days' then v_granularity := 'week';
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

-- ---------------------------------------------------------------------------
-- get_qr_performance - per-Dynamic-QR table row.
-- "Total" is the scan count inside the requested window; Today / Last 7 days /
-- Last 30 days are absolute rolling windows (whatever the selected period),
-- and Last scan is the most recent scan ever for that code. Static QR codes
-- are intentionally absent: they are not tracked, so the UI renders "—" for
-- them rather than a misleading 0.
-- ---------------------------------------------------------------------------
create or replace function public.get_qr_performance(
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
  v_last7_start timestamptz := now() - interval '7 days';
  v_last30_start timestamptz := now() - interval '30 days';
begin
  if v_uid is null then
    raise exception 'QRMANAGER_AUTH_REQUIRED';
  end if;

  if p_qr_id is not null
     and not exists (select 1 from public.qr_codes q where q.id = p_qr_id and q.user_id = v_uid) then
    raise exception 'QRMANAGER_QR_NOT_FOUND';
  end if;

  return coalesce((
    select json_agg(
      json_build_object(
        'id', q.id,
        'name', q.name,
        'type', q.type,
        'total', coalesce(t.total, 0),
        'today', coalesce(t.today, 0),
        'last7', coalesce(t.last7, 0),
        'last30', coalesce(t.last30, 0),
        'lastScannedAt', t.last_scanned_at
      ) order by coalesce(t.total, 0) desc, q.name asc
    )
    from public.qr_codes q
    left join lateral (
      select
        count(*) filter (where s2.scanned_at >= coalesce(p_start, '-infinity'::timestamptz)
                              and s2.scanned_at < coalesce(p_end, 'infinity'::timestamptz)) as total,
        count(*) filter (where s2.scanned_at >= v_today_start) as today,
        count(*) filter (where s2.scanned_at >= v_last7_start) as last7,
        count(*) filter (where s2.scanned_at >= v_last30_start) as last30,
        max(s2.scanned_at) as last_scanned_at
      from public.qr_scans s2
      where s2.qr_code_id = q.id
    ) t on true
    where q.user_id = v_uid
      and q.is_dynamic = true
      and (p_qr_id is null or q.id = p_qr_id)
  ), '[]'::json);
end;
$$;

-- ---------------------------------------------------------------------------
-- get_qr_comparison - 2..5 Dynamic QRs over one shared window.
-- Every supplied id must belong to the caller and be dynamic; otherwise the
-- call is rejected (no information leak about which id was foreign). Per-QR
-- totals, last scan and a same-granularity timeseries are returned.
-- ---------------------------------------------------------------------------
create or replace function public.get_qr_comparison(
  p_qr_ids uuid[],
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
  v_span interval;
  v_granularity text;
begin
  if v_uid is null then
    raise exception 'QRMANAGER_AUTH_REQUIRED';
  end if;

  if p_qr_ids is null or array_length(p_qr_ids, 1) is null then
    raise exception 'QRMANAGER_INVALID_PARAMS';
  end if;

  if array_length(p_qr_ids, 1) > 5 then
    raise exception 'QRMANAGER_TOO_MANY_QRS';
  end if;

  if exists (
    select 1 from unnest(p_qr_ids) as x(id)
    where not exists (
      select 1 from public.qr_codes q
      where q.id = x.id and q.user_id = v_uid and q.is_dynamic = true
    )
  ) then
    raise exception 'QRMANAGER_QR_NOT_FOUND';
  end if;

  if p_start is not null and p_end is not null and p_end > p_start then
    v_span := p_end - p_start;
    if v_span <= interval '48 hours' then v_granularity := 'hour';
    elsif v_span <= interval '200 days' then v_granularity := 'day';
    elsif v_span <= interval '800 days' then v_granularity := 'week';
    else v_granularity := 'month';
    end if;
  else
    v_granularity := 'month';
  end if;

  return coalesce((
    select json_agg(x order by x.total desc, x.name asc)
    from (
      select
        q.id,
        q.name,
        q.type,
        count(s.id)::bigint as total,
        max(s.scanned_at) as last_scanned_at,
        coalesce((
          select json_agg(json_build_object('bucket', b.bucket, 'count', b.count) order by b.bucket)
          from (
            select to_char(s2.scanned_at at time zone v_tz,
                     case v_granularity
                       when 'hour' then 'YYYY-MM-DD HH24:00'
                       when 'week' then 'IYYY-"W"IW'
                       when 'month' then 'YYYY-MM'
                       else 'YYYY-MM-DD'
                     end) as bucket,
                   count(*)::bigint as count
            from public.qr_scans s2
            where s2.qr_code_id = q.id
              and s2.scanned_at >= coalesce(p_start, '-infinity'::timestamptz)
              and s2.scanned_at < coalesce(p_end, 'infinity'::timestamptz)
            group by 1
          ) b
        ), '[]'::json) as timeseries
      from public.qr_codes q
      left join public.qr_scans s
        on s.qr_code_id = q.id
       and s.scanned_at >= coalesce(p_start, '-infinity'::timestamptz)
       and s.scanned_at < coalesce(p_end, 'infinity'::timestamptz)
      where q.user_id = v_uid
        and q.is_dynamic = true
        and q.id = any (p_qr_ids)
      group by q.id, q.name, q.type
    ) x
  ), '[]'::json);
end;
$$;

-- ---------------------------------------------------------------------------
-- get_qr_scans_export - raw audit rows for CSV / JSON export.
-- Only the columns the product is allowed to expose are returned (QR name,
-- QR type, local scanned_at, device, OS, browser). Respects the same filters
-- as the dashboard; the row count is capped client-input proof (1..50000).
-- ---------------------------------------------------------------------------
create or replace function public.get_qr_scans_export(
  p_qr_id uuid default null,
  p_start timestamptz default null,
  p_end timestamptz default null,
  p_offset_minutes int default 0,
  p_limit int default 10000
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
  v_limit int := greatest(1, least(coalesce(p_limit, 10000), 50000));
begin
  if v_uid is null then
    raise exception 'QRMANAGER_AUTH_REQUIRED';
  end if;

  if p_qr_id is not null
     and not exists (select 1 from public.qr_codes q where q.id = p_qr_id and q.user_id = v_uid) then
    raise exception 'QRMANAGER_QR_NOT_FOUND';
  end if;

  return json_build_object(
    'total', (select count(*)::bigint
              from public.qr_scans s
              join public.qr_codes q on q.id = s.qr_code_id
              where q.user_id = v_uid
                and (p_qr_id is null or q.id = p_qr_id)
                and s.scanned_at >= coalesce(p_start, '-infinity'::timestamptz)
                and s.scanned_at < coalesce(p_end, 'infinity'::timestamptz)),
    'rows', coalesce((
      select json_agg(json_build_object(
        'qrName', q.name,
        'qrType', q.type,
        'scannedAt', to_char(s.scanned_at at time zone v_tz, 'YYYY-MM-DD HH24:MI'),
        'device', s.device_type,
        'operatingSystem', s.operating_system,
        'browser', s.browser
      ) order by s.scanned_at desc)
      from public.qr_scans s
      join public.qr_codes q on q.id = s.qr_code_id
      where q.user_id = v_uid
        and (p_qr_id is null or q.id = p_qr_id)
        and s.scanned_at >= coalesce(p_start, '-infinity'::timestamptz)
        and s.scanned_at < coalesce(p_end, 'infinity'::timestamptz)
      limit v_limit
    ), '[]'::json)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Privileges (defense-in-depth on top of the auth.uid() guards inside each).
-- ---------------------------------------------------------------------------
revoke all on function public.get_qr_performance(uuid, timestamptz, timestamptz, int) from public;
revoke execute on function public.get_qr_performance(uuid, timestamptz, timestamptz, int) from anon;
grant execute on function public.get_qr_performance(uuid, timestamptz, timestamptz, int) to authenticated;

revoke all on function public.get_qr_comparison(uuid[], timestamptz, timestamptz, int) from public;
revoke execute on function public.get_qr_comparison(uuid[], timestamptz, timestamptz, int) from anon;
grant execute on function public.get_qr_comparison(uuid[], timestamptz, timestamptz, int) to authenticated;

revoke all on function public.get_qr_scans_export(uuid, timestamptz, timestamptz, int, int) from public;
revoke execute on function public.get_qr_scans_export(uuid, timestamptz, timestamptz, int, int) from anon;
grant execute on function public.get_qr_scans_export(uuid, timestamptz, timestamptz, int, int) to authenticated;