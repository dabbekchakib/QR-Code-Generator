-- Phase 4 - qr_codes table, RLS policies and indexes.
-- Stores the original data + customization needed to regenerate each QR Code.

create table if not exists public.qr_codes (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (length(name) between 1 and 200),
  type text not null
    check (type in ('website', 'wifi', 'phone', 'email', 'whatsapp', 'vcard', 'text')),
  values jsonb not null default '{}'::jsonb,
  customization jsonb not null default '{}'::jsonb,
  favorite boolean not null default false,
  is_dynamic boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists qr_codes_user_id_idx
  on public.qr_codes (user_id);

create index if not exists qr_codes_user_updated_idx
  on public.qr_codes (user_id, updated_at desc);

alter table public.qr_codes enable row level security;

-- Users can only access their own QR codes. user_id always comes from the
-- authenticated session, never trusted from the client.
create policy "qr_codes_select_own"
  on public.qr_codes for select
  using ((select auth.uid()) = user_id);

create policy "qr_codes_insert_own"
  on public.qr_codes for insert
  with check ((select auth.uid()) = user_id);

create policy "qr_codes_update_own"
  on public.qr_codes for update
  using ((select auth.uid()) = user_id);

create policy "qr_codes_delete_own"
  on public.qr_codes for delete
  using ((select auth.uid()) = user_id);

-- Keep updated_at fresh when a QR code changes.
create or replace function public.set_qr_codes_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger qr_codes_set_updated_at
  before update on public.qr_codes
  for each row execute procedure public.set_qr_codes_updated_at();