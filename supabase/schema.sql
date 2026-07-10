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
  source_provider text,
  source_event_id text,
  source_url text,
  ticket_url text,
  raw_payload jsonb,
  source_updated_at timestamptz,
  last_seen_at timestamptz,
  import_status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unique_external_event unique (external_source, external_event_id)
);

create table if not exists event_source_links (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
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

create table if not exists source_import_runs (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  provider text,
  run_type text not null,
  trigger_type text,
  status text not null,
  success boolean not null default false,
  import_window_start timestamptz,
  import_window_end timestamptz,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  duration_ms integer,
  fetched_count integer not null default 0,
  inserted_count integer not null default 0,
  updated_count integer not null default 0,
  skipped_count integer not null default 0,
  error_count integer not null default 0,
  error_message text,
  errors jsonb not null default '[]'::jsonb,
  summary jsonb,
  triggered_by text,
  created_at timestamptz not null default now()
);

create table if not exists user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  role text not null default 'buyer',
  reseller_status text not null default 'none',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists seller_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_name text,
  display_name text,
  contact_email text,
  contact_phone text,
  website_url text,
  verification_status text not null default 'not_started',
  terms_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists owned_ticket_listings (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  title text,
  description text,
  quantity_total integer not null default 0,
  quantity_available integer not null default 0,
  section text,
  row_name text,
  seat_numbers text,
  price_per_ticket numeric(10, 2) not null,
  currency text not null default 'USD',
  delivery_method text not null default 'mobile_transfer',
  listing_status text not null default 'draft',
  public_notes text,
  private_notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists owned_ticket_requests (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references owned_ticket_listings(id) on delete cascade,
  event_id uuid not null references events(id) on delete cascade,
  buyer_user_id uuid references auth.users(id) on delete set null,
  buyer_email text,
  buyer_name text,
  buyer_phone text,
  quantity_requested integer not null default 1,
  status text not null default 'pending',
  buyer_message text,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table affiliate_clicks add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table affiliate_clicks add column if not exists user_email text;
alter table events add column if not exists source_provider text;
alter table events add column if not exists source_event_id text;
alter table events add column if not exists source_url text;
alter table events add column if not exists ticket_url text;
alter table events add column if not exists raw_payload jsonb;
alter table events add column if not exists source_updated_at timestamptz;
alter table events add column if not exists last_seen_at timestamptz;
alter table events add column if not exists import_status text not null default 'active';
alter table source_import_runs add column if not exists provider text;
alter table source_import_runs add column if not exists trigger_type text;
alter table source_import_runs add column if not exists duration_ms integer;
alter table source_import_runs add column if not exists success boolean not null default false;
alter table source_import_runs add column if not exists errors jsonb not null default '[]'::jsonb;

create index if not exists idx_events_status_date on events(status, event_date, event_time);
create index if not exists idx_events_category on events(category);
create index if not exists idx_events_venue_id on events(venue_id);
create index if not exists idx_events_source_provider on events(source_provider);
create index if not exists idx_events_last_seen_at on events(last_seen_at desc);
create index if not exists idx_events_import_status on events(import_status);
create index if not exists idx_venues_city on venues(city);
create index if not exists idx_event_offers_event_available on event_offers(event_id, available);
create index if not exists idx_event_source_links_event_id on event_source_links(event_id);
create index if not exists idx_event_source_links_last_seen_at on event_source_links(last_seen_at desc);
create index if not exists idx_event_source_links_import_status on event_source_links(import_status);
create index if not exists idx_affiliate_clicks_clicked_at on affiliate_clicks(clicked_at);
create index if not exists idx_source_import_targets_active_source on source_import_targets(active, source_name);
create index if not exists idx_source_import_targets_type on source_import_targets(source_name, target_type);
create index if not exists idx_source_import_runs_source_name on source_import_runs(source_name);
create index if not exists idx_source_import_runs_provider on source_import_runs(provider);
create index if not exists idx_source_import_runs_trigger_type on source_import_runs(trigger_type);
create index if not exists idx_source_import_runs_status on source_import_runs(status);
create index if not exists idx_source_import_runs_success on source_import_runs(success);
create index if not exists idx_source_import_runs_started_at on source_import_runs(started_at desc);
create index if not exists idx_user_profiles_role on user_profiles(role);
create index if not exists idx_user_profiles_reseller_status on user_profiles(reseller_status);
create index if not exists idx_seller_profiles_user_id on seller_profiles(user_id);
create index if not exists idx_seller_profiles_verification_status on seller_profiles(verification_status);
create index if not exists idx_affiliate_clicks_user_id on affiliate_clicks(user_id);
create index if not exists idx_owned_ticket_listings_event_id on owned_ticket_listings(event_id);
create index if not exists idx_owned_ticket_listings_listing_status on owned_ticket_listings(listing_status);
create index if not exists idx_owned_ticket_requests_listing_id on owned_ticket_requests(listing_id);
create index if not exists idx_owned_ticket_requests_buyer_user_id on owned_ticket_requests(buyer_user_id);
create index if not exists idx_owned_ticket_requests_status on owned_ticket_requests(status);
create index if not exists idx_owned_ticket_requests_created_at on owned_ticket_requests(created_at desc);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'unique_external_event'
      and conrelid = 'public.events'::regclass
  )
  and to_regclass('public.unique_external_event') is null then
    create unique index unique_external_event
    on public.events (external_source, external_event_id);
  end if;
end $$;

create unique index if not exists unique_events_source_provider_event_id
on public.events (source_provider, source_event_id)
where source_provider is not null and source_event_id is not null;

create unique index if not exists unique_event_source_link_provider_event
on public.event_source_links (source_provider, source_event_id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'unique_event_offer_source'
      and conrelid = 'public.event_offers'::regclass
  )
  and to_regclass('public.unique_event_offer_source') is null then
    create unique index unique_event_offer_source
    on public.event_offers (event_id, source_name);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'unique_source_import_target'
      and conrelid = 'public.source_import_targets'::regclass
  )
  and to_regclass('public.unique_source_import_target') is null then
    create unique index unique_source_import_target
    on public.source_import_targets (source_name, target_type, target_value);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_profiles_role_check'
      and conrelid = 'public.user_profiles'::regclass
  ) then
    alter table public.user_profiles
    add constraint user_profiles_role_check check (role in ('buyer', 'reseller', 'admin'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_profiles_reseller_status_check'
      and conrelid = 'public.user_profiles'::regclass
  ) then
    alter table public.user_profiles
    add constraint user_profiles_reseller_status_check check (reseller_status in ('none', 'pending', 'approved', 'rejected', 'suspended'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'seller_profiles_verification_status_check'
      and conrelid = 'public.seller_profiles'::regclass
  ) then
    alter table public.seller_profiles
    add constraint seller_profiles_verification_status_check check (verification_status in ('not_started', 'pending', 'approved', 'rejected'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'seller_profiles_user_id_key'
      and conrelid = 'public.seller_profiles'::regclass
  )
  and to_regclass('public.seller_profiles_user_id_key') is null then
    create unique index seller_profiles_user_id_key
    on public.seller_profiles (user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'owned_ticket_listings_quantity_total_check'
      and conrelid = 'public.owned_ticket_listings'::regclass
  ) then
    alter table public.owned_ticket_listings
    add constraint owned_ticket_listings_quantity_total_check check (quantity_total >= 0);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'owned_ticket_listings_quantity_available_check'
      and conrelid = 'public.owned_ticket_listings'::regclass
  ) then
    alter table public.owned_ticket_listings
    add constraint owned_ticket_listings_quantity_available_check check (quantity_available >= 0);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'owned_ticket_listings_price_check'
      and conrelid = 'public.owned_ticket_listings'::regclass
  ) then
    alter table public.owned_ticket_listings
    add constraint owned_ticket_listings_price_check check (price_per_ticket >= 0);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'owned_ticket_listings_delivery_method_check'
      and conrelid = 'public.owned_ticket_listings'::regclass
  ) then
    alter table public.owned_ticket_listings
    add constraint owned_ticket_listings_delivery_method_check check (delivery_method in ('mobile_transfer', 'pdf', 'will_call', 'physical', 'tbd'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'owned_ticket_listings_status_check'
      and conrelid = 'public.owned_ticket_listings'::regclass
  ) then
    alter table public.owned_ticket_listings
    add constraint owned_ticket_listings_status_check check (listing_status in ('draft', 'active', 'inactive', 'sold_out'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'owned_ticket_requests_quantity_check'
      and conrelid = 'public.owned_ticket_requests'::regclass
  ) then
    alter table public.owned_ticket_requests
    add constraint owned_ticket_requests_quantity_check check (quantity_requested >= 1);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'owned_ticket_requests_status_check'
      and conrelid = 'public.owned_ticket_requests'::regclass
  ) then
    alter table public.owned_ticket_requests
    add constraint owned_ticket_requests_status_check check (status in ('pending', 'contacted', 'approved', 'rejected', 'cancelled', 'fulfilled'));
  end if;
end $$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_account_type text;
begin
  requested_account_type := coalesce(new.raw_user_meta_data ->> 'account_type', 'buyer');

  insert into public.user_profiles (id, email, full_name, role, reseller_status)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    'buyer',
    case when requested_account_type = 'reseller' then 'pending' else 'none' end
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.user_profiles.full_name),
    reseller_status = case
      when public.user_profiles.reseller_status = 'none' and requested_account_type = 'reseller' then 'pending'
      else public.user_profiles.reseller_status
    end;

  if requested_account_type = 'reseller' then
    insert into public.seller_profiles (
      user_id,
      display_name,
      contact_email,
      verification_status
    )
    values (
      new.id,
      new.raw_user_meta_data ->> 'full_name',
      new.email,
      'pending'
    )
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

create or replace function public.protect_user_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'authenticated' then
    new.id = old.id;
    new.role = old.role;
    new.reseller_status = old.reseller_status;
  end if;
  return new;
end;
$$;

create or replace function public.protect_seller_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'authenticated' then
    new.id = old.id;
    new.user_id = old.user_id;
    new.verification_status = old.verification_status;
  end if;
  return new;
end;
$$;

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

drop trigger if exists set_user_profiles_updated_at on user_profiles;
create trigger set_user_profiles_updated_at before update on user_profiles
for each row execute function set_updated_at();

drop trigger if exists protect_user_profiles_fields on user_profiles;
create trigger protect_user_profiles_fields before update on user_profiles
for each row execute function public.protect_user_profile_fields();

drop trigger if exists set_seller_profiles_updated_at on seller_profiles;
create trigger set_seller_profiles_updated_at before update on seller_profiles
for each row execute function set_updated_at();

drop trigger if exists set_owned_ticket_listings_updated_at on owned_ticket_listings;
create trigger set_owned_ticket_listings_updated_at before update on owned_ticket_listings
for each row execute function set_updated_at();

drop trigger if exists set_owned_ticket_requests_updated_at on owned_ticket_requests;
create trigger set_owned_ticket_requests_updated_at before update on owned_ticket_requests
for each row execute function set_updated_at();

drop trigger if exists protect_seller_profiles_fields on seller_profiles;
create trigger protect_seller_profiles_fields before update on seller_profiles
for each row execute function public.protect_seller_profile_fields();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_auth_user();

alter table venues enable row level security;
alter table performers enable row level security;
alter table events enable row level security;
alter table event_performers enable row level security;
alter table ticket_sources enable row level security;
alter table event_offers enable row level security;
alter table affiliate_clicks enable row level security;
alter table admin_settings enable row level security;
alter table source_import_targets enable row level security;
alter table source_import_runs enable row level security;
alter table user_profiles enable row level security;
alter table seller_profiles enable row level security;
alter table owned_ticket_listings enable row level security;
alter table owned_ticket_requests enable row level security;

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

drop policy if exists "Users can read own profile" on user_profiles;
create policy "Users can read own profile"
on user_profiles for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Users can update own profile" on user_profiles;
create policy "Users can update own profile"
on user_profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Users can read own seller profile" on seller_profiles;
create policy "Users can read own seller profile"
on seller_profiles for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own seller profile" on seller_profiles;
create policy "Users can insert own seller profile"
on seller_profiles for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own seller profile" on seller_profiles;
create policy "Users can update own seller profile"
on seller_profiles for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Public can read active owned ticket listings" on owned_ticket_listings;
create policy "Public can read active owned ticket listings"
on owned_ticket_listings for select
to anon, authenticated
using (listing_status = 'active' and quantity_available > 0);

drop policy if exists "Users can insert own owned ticket requests" on owned_ticket_requests;
create policy "Users can insert own owned ticket requests"
on owned_ticket_requests for insert
to authenticated
with check (auth.uid() = buyer_user_id);

drop policy if exists "Users can read own owned ticket requests" on owned_ticket_requests;
create policy "Users can read own owned ticket requests"
on owned_ticket_requests for select
to authenticated
using (auth.uid() = buyer_user_id);

-- No public update/delete policies are defined. Public writes remain blocked by RLS.
-- source_import_targets intentionally has no public read/write policy.
-- source_import_runs intentionally has no public read/write policy.
-- It is managed through service-role/server-side import tooling for now.
-- Future admin policies should be scoped to authenticated admin roles, for example:
-- create policy "Admins can manage events" on events for all
-- to authenticated using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
-- with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
