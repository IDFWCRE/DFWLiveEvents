-- DFW Live Events Phase 1B Supabase schema
-- Run this in the Supabase SQL editor before supabase/seed.sql.

create extension if not exists pgcrypto;

do $$
begin
  create type event_category as enum ('music', 'comedy');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type event_status as enum ('draft', 'published', 'cancelled');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type event_source_type as enum ('seed', 'partner', 'manual', 'api');
exception
  when duplicate_object then null;
end $$;

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists venues (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  city text not null,
  state text not null default 'TX',
  address text not null,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists performers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category event_category,
  image_url text,
  website_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  category event_category not null,
  event_date date not null,
  event_time time,
  image_url text,
  status event_status not null default 'draft',
  venue_id uuid not null references venues(id) on delete restrict,
  source_type event_source_type not null default 'manual',
  external_source text,
  external_event_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unique_external_event unique (external_source, external_event_id)
);

create table if not exists event_performers (
  event_id uuid not null references events(id) on delete cascade,
  performer_id uuid not null references performers(id) on delete cascade,
  billing_order integer not null default 1,
  created_at timestamptz not null default now(),
  primary key (event_id, performer_id)
);

create table if not exists ticket_sources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  website_url text,
  affiliate_base_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists event_offers (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  source_name text not null,
  source_listing_url text not null,
  affiliate_url text,
  min_price numeric(10, 2),
  max_price numeric(10, 2),
  currency text not null default 'USD',
  available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unique_event_offer_source unique (event_id, source_name)
);

create table if not exists affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete set null,
  event_offer_id uuid references event_offers(id) on delete set null,
  source_name text,
  destination_url text,
  referrer text,
  user_agent text,
  clicked_at timestamptz not null default now()
);

create table if not exists admin_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists source_import_targets (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  target_type text not null,
  target_value text not null,
  label text,
  city text,
  category text,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unique_source_import_target unique (source_name, target_type, target_value)
);

create index if not exists idx_events_status_date on events(status, event_date, event_time);
create index if not exists idx_events_category on events(category);
create index if not exists idx_events_venue_id on events(venue_id);
create index if not exists idx_venues_city on venues(city);
create index if not exists idx_event_offers_event_available on event_offers(event_id, available);
create index if not exists idx_affiliate_clicks_clicked_at on affiliate_clicks(clicked_at);
create index if not exists idx_source_import_targets_active_source on source_import_targets(active, source_name);
create index if not exists idx_source_import_targets_type on source_import_targets(source_name, target_type);

do $$
begin
  alter table event_offers
  add constraint unique_event_offer_source unique (event_id, source_name);
exception
  when duplicate_object then null;
end $$;

drop trigger if exists set_venues_updated_at on venues;
create trigger set_venues_updated_at before update on venues
for each row execute function set_updated_at();

drop trigger if exists set_performers_updated_at on performers;
create trigger set_performers_updated_at before update on performers
for each row execute function set_updated_at();

drop trigger if exists set_events_updated_at on events;
create trigger set_events_updated_at before update on events
for each row execute function set_updated_at();

drop trigger if exists set_ticket_sources_updated_at on ticket_sources;
create trigger set_ticket_sources_updated_at before update on ticket_sources
for each row execute function set_updated_at();

drop trigger if exists set_event_offers_updated_at on event_offers;
create trigger set_event_offers_updated_at before update on event_offers
for each row execute function set_updated_at();

drop trigger if exists set_admin_settings_updated_at on admin_settings;
create trigger set_admin_settings_updated_at before update on admin_settings
for each row execute function set_updated_at();

drop trigger if exists set_source_import_targets_updated_at on source_import_targets;
create trigger set_source_import_targets_updated_at before update on source_import_targets
for each row execute function set_updated_at();

alter table venues enable row level security;
alter table performers enable row level security;
alter table events enable row level security;
alter table event_performers enable row level security;
alter table ticket_sources enable row level security;
alter table event_offers enable row level security;
alter table affiliate_clicks enable row level security;
alter table admin_settings enable row level security;
alter table source_import_targets enable row level security;

drop policy if exists "Public can read venues" on venues;
create policy "Public can read venues"
on venues for select
to anon, authenticated
using (true);

drop policy if exists "Public can read performers" on performers;
create policy "Public can read performers"
on performers for select
to anon, authenticated
using (true);

drop policy if exists "Public can read published events" on events;
create policy "Public can read published events"
on events for select
to anon, authenticated
using (status = 'published');

drop policy if exists "Public can read event performers for published events" on event_performers;
create policy "Public can read event performers for published events"
on event_performers for select
to anon, authenticated
using (
  exists (
    select 1 from events
    where events.id = event_performers.event_id
    and events.status = 'published'
  )
);

drop policy if exists "Public can read active ticket sources" on ticket_sources;
create policy "Public can read active ticket sources"
on ticket_sources for select
to anon, authenticated
using (active = true);

drop policy if exists "Public can read available event offers" on event_offers;
create policy "Public can read available event offers"
on event_offers for select
to anon, authenticated
using (
  available = true
  and exists (
    select 1 from events
    where events.id = event_offers.event_id
    and events.status = 'published'
  )
);

drop policy if exists "Public can insert affiliate clicks" on affiliate_clicks;
create policy "Public can insert affiliate clicks"
on affiliate_clicks for insert
to anon, authenticated
with check (true);

-- No public update/delete policies are defined. Public writes remain blocked by RLS.
-- source_import_targets intentionally has no public read/write policy.
-- It is managed through service-role/server-side import tooling for now.
-- Future admin policies should be scoped to authenticated admin roles, for example:
-- create policy "Admins can manage events" on events for all
-- to authenticated using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
-- with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
