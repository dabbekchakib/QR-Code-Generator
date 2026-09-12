-- Phase 7 - Templates & QR Design Presets.
-- Records created from a template keep the template id (metadata only, so the
-- gallery "recently used" can label records and future stats can filter on it).
-- Templates are resolved on the client: the server stores the id, never the
-- template values, so a record is always self-contained and editable.
-- No index is added on purpose: template_id is not queried for aggregation and
-- a partial/full index would buy nothing for a small per-user table.

alter table public.qr_codes
  add column if not exists template_id text;