alter table public.events add column if not exists source_provider text;
alter table public.events add column if not exists source_event_id text;
alter table public.events add column if not exists source_url text;
alter table public.events add column if not exists ticket_url text;
alter table public.events add column if not exists raw_payload jsonb;
alter table public.events add column if not exists source_updated_at timestamptz;
alter table public.events add column if not exists last_seen_at timestamptz;
alter table public.events add column if not exists import_status text not null default 'active';

update public.events
set
  source_provider = coalesce(source_provider, lower(external_source)),
  source_event_id = coalesce(source_event_id, external_event_id),
  last_seen_at = coalesce(last_seen_at, updated_at),
  import_status = coalesce(import_status, 'active')
where external_event_id is not null;

update public.events
set source_provider = 'manual'
where source_provider is null and source_type = 'manual';

create unique index if not exists unique_events_source_provider_event_id
on public.events (source_provider, source_event_id)
where source_provider is not null and source_event_id is not null;

create index if not exists idx_events_source_provider on public.events(source_provider);
create index if not exists idx_events_last_seen_at on public.events(last_seen_at desc);
create index if not exists idx_events_import_status on public.events(import_status);

create table if not exists public.event_source_links (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  source_provider text not null,
  source_event_id text not null,
  source_url text,
  ticket_url text,
  raw_payload jsonb,
  source_updated_at timestamptz,
  last_seen_at timestamptz not null default now(),
  import_status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists unique_event_source_link_provider_event
on public.event_source_links (source_provider, source_event_id);

create index if not exists idx_event_source_links_event_id on public.event_source_links(event_id);
create index if not exists idx_event_source_links_last_seen_at on public.event_source_links(last_seen_at desc);
create index if not exists idx_event_source_links_import_status on public.event_source_links(import_status);
