-- Phase 5 - Dynamic QR Codes.
-- Adds the fields needed to turn a QR Code into a redirect to an editable
-- destination: a public short code, the destination URL and an active/disabled
-- status. Static QR codes are left untouched (nullable columns).

alter table public.qr_codes
  add column if not exists short_code text,
  add column if not exists destination_url text,
  add column if not exists status text not null default 'active';

-- Only one QR can own a given short code. The partial index keeps NULLs
-- (static QR codes) outside the uniqueness scope.
create unique index if not exists qr_codes_short_code_unique
  on public.qr_codes (short_code)
  where short_code is not null;

alter table public.qr_codes
  add constraint qr_codes_status_check
  check (status in ('active', 'disabled'));

-- A dynamic QR must carry both its short code and its destination. Static QR
-- codes keep both columns NULL and are unaffected.
alter table public.qr_codes
  add constraint qr_codes_dynamic_fields_check
  check (
    (is_dynamic = false)
    or (short_code is not null and destination_url is not null)
  );

-- Public resolver used by the /qr/[shortCode] redirect route. Runs as a
-- security definer (as the table owner) so anonymous visitors can resolve an
-- active short code WITHOUT bypassing row level security on the table itself.
-- It only exposes the fields strictly required for the redirect, never the
-- owner, values or customization of a QR code.
create or replace function public.resolve_dynamic_qr(p_short_code text)
returns table (short_code text, destination_url text, status text, is_dynamic boolean)
language sql
stable
security definer
set search_path = public
as $$
  select q.short_code, q.destination_url, q.status, q.is_dynamic
  from public.qr_codes q
  where q.short_code = p_short_code
    and q.is_dynamic = true
  limit 1;
$$;

revoke all on function public.resolve_dynamic_qr(text) from public;
grant execute on function public.resolve_dynamic_qr(text) to anon, authenticated;