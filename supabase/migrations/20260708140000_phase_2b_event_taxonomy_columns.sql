begin;

alter table public.events
add column if not exists category_slug text,
add column if not exists subcategory_slug text;

alter table public.source_import_targets
add column if not exists subcategory text;

update public.events
set category_slug = category::text
where category_slug is null;

create index if not exists idx_events_category_slug
on public.events (category_slug);

create index if not exists idx_events_subcategory_slug
on public.events (subcategory_slug);

create index if not exists idx_events_status_date_category_subcategory
on public.events (status, event_date, event_time, category_slug, subcategory_slug);

create index if not exists idx_source_import_targets_category_subcategory
on public.source_import_targets (source_name, category, subcategory)
where active = true;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'events_category_slug_check'
      and conrelid = 'public.events'::regclass
  ) then
    alter table public.events
    add constraint events_category_slug_check
    check (
      category_slug is null
      or category_slug in ('music', 'comedy', 'sports')
    );
  end if;
end $$;

commit;
