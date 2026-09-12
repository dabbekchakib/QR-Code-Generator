-- Phase 11 - Anti-flood guard for public scan tracking.
--
-- record_qr_scan() is deliberately executable by `anon` (the public redirect
-- records each scan as a server event). Without a guard, an unauthenticated
-- client could hammer the endpoint and inflate a code's analytics or bloat the
-- table. The guard below is privacy-safe: it rates-limit by short code over a
-- rolling window, never by IP (no IP/location is ever stored — Phase 6
-- privacy requirement). Failures are ever still swallowed so tracking can
-- never break the redirect.
--
-- The threshold is generous (1200 scans / 10 minutes per code ≈ 2/s sustained,
-- bursts clipped) so genuine traffic and short viral spikes are never clipped;
-- only true flood attacks are paused until the window rolls out.

alter table public.qr_scans enable row level security;

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
  v_qr_id uuid;
  v_recent bigint;
begin
  select q.id into v_qr_id
  from public.qr_codes q
  where q.short_code = p_short_code
    and q.is_dynamic = true
    and q.status = 'active'
    and q.destination_url is not null
  limit 1;

  if v_qr_id is null then
    return;
  end if;

  select count(*) into v_recent
  from public.qr_scans
  where qr_code_id = v_qr_id
    and scanned_at > now() - interval '10 minutes';

  if v_recent >= 1200 then
    return;
  end if;

  begin
    insert into public.qr_scans (qr_code_id, device_type, operating_system, browser)
    values (v_qr_id, v_device, v_os, v_browser);
  exception when others then
    null; -- tracking must never block the redirect
  end;
end;
$$;

-- Keep the exact same grants: anon needs EXECUTE for visitor tracking,
-- authenticated owners still cannot INSERT outside the function (no table
-- INSERT policy exists, deliberately).
revoke all on function public.record_qr_scan(text, text, text, text) from public;
grant execute on function public.record_qr_scan(text, text, text, text) to anon, authenticated;