alter table public.event_source_links enable row level security;

drop policy if exists "Public can read active event source links for published events" on public.event_source_links;
create policy "Public can read active event source links for published events"
on public.event_source_links for select
to anon, authenticated
using (
  import_status = 'active'
  and exists (
    select 1 from public.events
    where events.id = event_source_links.event_id
    and events.status = 'published'
  )
);
