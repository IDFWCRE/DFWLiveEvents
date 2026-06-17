-- DFW Live Events Phase 1B seed data
-- Run after supabase/schema.sql.

insert into venues (id, slug, name, city, state, address, latitude, longitude)
values
  ('00000000-0000-4000-8000-000000000001', 'american-airlines-center', 'American Airlines Center', 'Dallas', 'TX', '2500 Victory Ave, Dallas, TX', 32.7905, -96.8103),
  ('00000000-0000-4000-8000-000000000002', 'the-factory-in-deep-ellum', 'The Factory in Deep Ellum', 'Dallas', 'TX', '2713 Canton St, Dallas, TX', 32.7829, -96.7839),
  ('00000000-0000-4000-8000-000000000003', 'dickies-arena', 'Dickies Arena', 'Fort Worth', 'TX', '1911 Montgomery St, Fort Worth, TX', 32.7412, -97.3687),
  ('00000000-0000-4000-8000-000000000004', 'tannahills-music-hall', 'Tannahill''s Music Hall', 'Fort Worth', 'TX', '122 E Exchange Ave, Fort Worth, TX', 32.7881, -97.3477),
  ('00000000-0000-4000-8000-000000000005', 'levitt-pavilion-arlington', 'Levitt Pavilion Arlington', 'Arlington', 'TX', '100 W Abram St, Arlington, TX', 32.7357, -97.1077),
  ('00000000-0000-4000-8000-000000000006', 'rubber-gloves-rehearsal-studios', 'Rubber Gloves Rehearsal Studios', 'Denton', 'TX', '411 E Sycamore St, Denton, TX', 33.2141, -97.1292),
  ('00000000-0000-4000-8000-000000000007', 'toyota-music-factory', 'Toyota Music Factory', 'Irving', 'TX', '316 W Las Colinas Blvd, Irving, TX', 32.8787, -96.9445),
  ('00000000-0000-4000-8000-000000000008', 'texas-trust-cu-theatre', 'Texas Trust CU Theatre', 'Grand Prairie', 'TX', '1001 Performance Pl, Grand Prairie, TX', 32.7657, -97.0076),
  ('00000000-0000-4000-8000-000000000009', 'legacy-hall', 'Legacy Hall', 'Plano', 'TX', '7800 Windrose Ave, Plano, TX', 33.0812, -96.8257),
  ('00000000-0000-4000-8000-000000000010', 'frisco-discovery-center', 'Frisco Discovery Center', 'Frisco', 'TX', '8004 Dallas Pkwy, Frisco, TX', 33.1498, -96.8358),
  ('00000000-0000-4000-8000-000000000011', 'mckinney-performing-arts-center', 'McKinney Performing Arts Center', 'McKinney', 'TX', '111 N Tennessee St, McKinney, TX', 33.1976, -96.6153)
on conflict (id) do update set
  slug = excluded.slug,
  name = excluded.name,
  city = excluded.city,
  state = excluded.state,
  address = excluded.address,
  latitude = excluded.latitude,
  longitude = excluded.longitude;

insert into performers (id, slug, name, category)
values
  ('10000000-0000-4000-8000-000000000001', 'neon-skyline', 'Neon Skyline', 'music'),
  ('10000000-0000-4000-8000-000000000002', 'cowtown-summer-band', 'Cowtown Summer Band', 'music'),
  ('10000000-0000-4000-8000-000000000003', 'deep-ellum-late', 'Deep Ellum Late', 'music'),
  ('10000000-0000-4000-8000-000000000004', 'north-texas-comedy-collective', 'North Texas Comedy Collective', 'comedy'),
  ('10000000-0000-4000-8000-000000000005', 'arlington-acoustic-project', 'Arlington Acoustic Project', 'music'),
  ('10000000-0000-4000-8000-000000000006', 'denton-indie-bill', 'Denton Indie Bill', 'music'),
  ('10000000-0000-4000-8000-000000000007', 'las-colinas-comedy-room', 'Las Colinas Comedy Room', 'comedy'),
  ('10000000-0000-4000-8000-000000000008', 'grand-prairie-arena-rock', 'Grand Prairie Arena Rock', 'music'),
  ('10000000-0000-4000-8000-000000000009', 'plano-patio-band', 'Plano Patio Band', 'music'),
  ('10000000-0000-4000-8000-000000000010', 'frisco-family-comedy-hour', 'Frisco Family Comedy Hour', 'comedy'),
  ('10000000-0000-4000-8000-000000000011', 'mckinney-square-songwriters', 'McKinney Square Songwriters', 'music')
on conflict (id) do update set
  slug = excluded.slug,
  name = excluded.name,
  category = excluded.category;

insert into ticket_sources (id, slug, name, website_url, affiliate_base_url, active)
values
  ('20000000-0000-4000-8000-000000000001', 'seed-box-office', 'Seed Box Office', 'https://example.com', 'https://example.com/affiliate', true)
on conflict (id) do update set
  slug = excluded.slug,
  name = excluded.name,
  website_url = excluded.website_url,
  affiliate_base_url = excluded.affiliate_base_url,
  active = excluded.active;

insert into events (
  id,
  slug,
  title,
  description,
  category,
  event_date,
  event_time,
  image_url,
  status,
  venue_id,
  source_type,
  external_source,
  external_event_id
)
values
  ('30000000-0000-4000-8000-000000000001', 'neon-skyline-festival', 'Neon Skyline Festival', 'A high-energy night of pop, dance, and indie headliners in Victory Park.', 'music', '2026-06-16', '20:00', 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80', 'published', '00000000-0000-4000-8000-000000000001', 'seed', 'seed', 'neon-skyline-festival'),
  ('30000000-0000-4000-8000-000000000002', 'cowtown-summer-sessions', 'Cowtown Summer Sessions', 'Texas songwriters, roots rock, and a packed Stockyards crowd.', 'music', '2026-06-18', '19:30', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80', 'published', '00000000-0000-4000-8000-000000000004', 'seed', 'seed', 'cowtown-summer-sessions'),
  ('30000000-0000-4000-8000-000000000003', 'deep-ellum-late-showcase', 'Deep Ellum Late Showcase', 'Three touring bands and one local opener take over Deep Ellum.', 'music', '2026-06-20', '21:00', 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80', 'published', '00000000-0000-4000-8000-000000000002', 'seed', 'seed', 'deep-ellum-late-showcase'),
  ('30000000-0000-4000-8000-000000000004', 'north-texas-comedy-night', 'North Texas Comedy Night', 'A touring lineup of stand-up comics with sharp local hosts.', 'comedy', '2026-06-22', '19:00', 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?auto=format&fit=crop&w=1200&q=80', 'published', '00000000-0000-4000-8000-000000000003', 'seed', 'seed', 'north-texas-comedy-night'),
  ('30000000-0000-4000-8000-000000000005', 'arlington-acoustic-lawn', 'Arlington Acoustic Lawn', 'Open-air acoustic sets and food trucks in downtown Arlington.', 'music', '2026-06-24', '18:30', 'https://images.unsplash.com/photo-1501612780327-45045538702b?auto=format&fit=crop&w=1200&q=80', 'published', '00000000-0000-4000-8000-000000000005', 'seed', 'seed', 'arlington-acoustic-lawn'),
  ('30000000-0000-4000-8000-000000000006', 'denton-indie-bill', 'Denton Indie Bill', 'Denton''s loud, loose, and lovable indie scene on one bill.', 'music', '2026-06-25', '20:00', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80', 'published', '00000000-0000-4000-8000-000000000006', 'seed', 'seed', 'denton-indie-bill'),
  ('30000000-0000-4000-8000-000000000007', 'las-colinas-laughs', 'Las Colinas Laughs', 'A polished comedy showcase in the heart of Las Colinas.', 'comedy', '2026-06-27', '20:00', 'https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1200&q=80', 'published', '00000000-0000-4000-8000-000000000007', 'seed', 'seed', 'las-colinas-laughs'),
  ('30000000-0000-4000-8000-000000000008', 'grand-prairie-arena-rock', 'Grand Prairie Arena Rock', 'Classic arena hooks, guitar anthems, and a full summer stage show.', 'music', '2026-06-29', '19:30', 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1200&q=80', 'published', '00000000-0000-4000-8000-000000000008', 'seed', 'seed', 'grand-prairie-arena-rock'),
  ('30000000-0000-4000-8000-000000000009', 'plano-patio-concert', 'Plano Patio Concert', 'A relaxed Friday night concert with local food hall energy.', 'music', '2026-07-03', '19:00', 'https://images.unsplash.com/photo-1485579149621-3123dd979885?auto=format&fit=crop&w=1200&q=80', 'published', '00000000-0000-4000-8000-000000000009', 'seed', 'seed', 'plano-patio-concert'),
  ('30000000-0000-4000-8000-000000000010', 'frisco-family-comedy-hour', 'Frisco Family Comedy Hour', 'Clean comedy, early showtime, and an easy family night out.', 'comedy', '2026-07-05', '17:30', 'https://images.unsplash.com/photo-1515168833906-d2a3b82b1a48?auto=format&fit=crop&w=1200&q=80', 'published', '00000000-0000-4000-8000-000000000010', 'seed', 'seed', 'frisco-family-comedy-hour'),
  ('30000000-0000-4000-8000-000000000011', 'mckinney-square-songs', 'McKinney Square Songs', 'Songwriters and storytellers inside McKinney''s historic courthouse theater.', 'music', '2026-07-08', '19:00', 'https://images.unsplash.com/photo-1507874457470-272b3c8d8ee2?auto=format&fit=crop&w=1200&q=80', 'published', '00000000-0000-4000-8000-000000000011', 'seed', 'seed', 'mckinney-square-songs')
on conflict (id) do update set
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  category = excluded.category,
  event_date = excluded.event_date,
  event_time = excluded.event_time,
  image_url = excluded.image_url,
  status = excluded.status,
  venue_id = excluded.venue_id,
  source_type = excluded.source_type,
  external_source = excluded.external_source,
  external_event_id = excluded.external_event_id;

insert into event_performers (event_id, performer_id, billing_order)
values
  ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 1),
  ('30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 1),
  ('30000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000003', 1),
  ('30000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000004', 1),
  ('30000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000005', 1),
  ('30000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000006', 1),
  ('30000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000007', 1),
  ('30000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000008', 1),
  ('30000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000009', 1),
  ('30000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000010', 1),
  ('30000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000011', 1)
on conflict (event_id, performer_id) do update set
  billing_order = excluded.billing_order;

insert into event_offers (
  event_id,
  source_name,
  source_listing_url,
  affiliate_url,
  min_price,
  max_price,
  currency,
  available
)
select
  id,
  'Seed Box Office',
  'https://example.com/events/' || slug,
  'https://example.com/affiliate/events/' || slug,
  25.00,
  125.00,
  'USD',
  true
from events
where source_type = 'seed'
on conflict (event_id, source_name) do update set
  source_listing_url = excluded.source_listing_url,
  affiliate_url = excluded.affiliate_url,
  min_price = excluded.min_price,
  max_price = excluded.max_price,
  currency = excluded.currency,
  available = excluded.available;

insert into admin_settings (key, value)
values
  ('marketplace_phase', '{"phase":"1D.5","supabase_foundation":true,"ticketmaster_enabled":true,"eventbrite_enabled":true,"payments_enabled":false}'::jsonb)
on conflict (key) do update set
  value = excluded.value;

insert into source_import_targets (source_name, target_type, target_value, label, city, category, active, notes)
values
  ('ticketmaster', 'city', 'Dallas', 'Dallas Ticketmaster import', 'Dallas', null, true, 'Seeded city target for future target-driven Ticketmaster imports.'),
  ('ticketmaster', 'city', 'Fort Worth', 'Fort Worth Ticketmaster import', 'Fort Worth', null, true, 'Seeded city target for future target-driven Ticketmaster imports.'),
  ('ticketmaster', 'city', 'Arlington', 'Arlington Ticketmaster import', 'Arlington', null, true, 'Seeded city target for future target-driven Ticketmaster imports.'),
  ('ticketmaster', 'city', 'Denton', 'Denton Ticketmaster import', 'Denton', null, true, 'Seeded city target for future target-driven Ticketmaster imports.'),
  ('ticketmaster', 'city', 'Irving', 'Irving Ticketmaster import', 'Irving', null, true, 'Seeded city target for future target-driven Ticketmaster imports.'),
  ('ticketmaster', 'city', 'Grand Prairie', 'Grand Prairie Ticketmaster import', 'Grand Prairie', null, true, 'Seeded city target for future target-driven Ticketmaster imports.'),
  ('ticketmaster', 'city', 'Plano', 'Plano Ticketmaster import', 'Plano', null, true, 'Seeded city target for future target-driven Ticketmaster imports.'),
  ('ticketmaster', 'city', 'Frisco', 'Frisco Ticketmaster import', 'Frisco', null, true, 'Seeded city target for future target-driven Ticketmaster imports.'),
  ('ticketmaster', 'city', 'McKinney', 'McKinney Ticketmaster import', 'McKinney', null, true, 'Seeded city target for future target-driven Ticketmaster imports.')
on conflict (source_name, target_type, target_value) do update set
  label = excluded.label,
  city = excluded.city,
  category = excluded.category,
  active = excluded.active,
  notes = excluded.notes;
