# DFW Live Events

Dallas-Fort Worth live events marketplace foundation built with Next.js App Router, TypeScript, and Supabase.

## Required Environment Variables

Create `.env.local` for local development:

```bash
TICKETMASTER_API_KEY=your-ticketmaster-discovery-api-key
IMPORT_WINDOW_DAYS=365
CRON_SECRET=choose-a-long-random-cron-secret
EVENTBRITE_PRIVATE_TOKEN=your-eventbrite-private-token
EVENTBRITE_ORGANIZATION_IDS=comma-separated-organization-ids
EVENTBRITE_VENUE_IDS=comma-separated-venue-ids
EVENTBRITE_EVENT_IDS=comma-separated-event-ids-or-urls
EVENTBRITE_MAX_PAGES_PER_QUERY=3
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
ADMIN_IMPORT_TOKEN=choose-a-long-random-token
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

`NEXT_PUBLIC_*` values are client-safe. `TICKETMASTER_API_KEY`, `EVENTBRITE_PRIVATE_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`, and `ADMIN_IMPORT_TOKEN` are server-only and must not be exposed in client components.

`.env.local` is ignored by git through `.env*` in `.gitignore`.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Production build check:

```bash
npm run build
```

Run the Ticketmaster importer locally:

```bash
npm run import:ticketmaster
```

Run the Eventbrite importer locally:

```bash
npm run import:eventbrite
```

Run both importers locally:

```bash
npm run import:all
```

## Supabase Setup

1. Create a Supabase project.
2. Open the Supabase SQL Editor.
3. Run `supabase/schema.sql`.
4. Run `supabase/seed.sql`.
5. Copy the project URL, anon key, and service role key into `.env.local`.

The schema includes:

- `venues`
- `performers`
- `events`
- `event_performers`
- `ticket_sources`
- `event_offers`
- `affiliate_clicks`
- `admin_settings`
- `source_import_targets`

RLS is enabled. Public anon users can read published events, venues, performers, active ticket sources, and available event offers. Public users can insert affiliate clicks for future tracking. Admin write policies are intentionally left as commented placeholders.

`source_import_targets` is service-role/server-only for now. Public users cannot read or write source targets.

## Rolling Import Window

All importers use a rolling window from the current time through `IMPORT_WINDOW_DAYS` days in the future. The default is:

```bash
IMPORT_WINDOW_DAYS=365
```

Ticketmaster sends the window to the Discovery API using `startDateTime` and `endDateTime`. Eventbrite configured targets are fetched and then filtered locally when endpoint-level date range filtering is not assumed.

## Ticketmaster Import

Phase 1C includes a server-side Ticketmaster Discovery API importer. It fetches upcoming Music and Comedy events within the rolling import window for:

- Dallas
- Fort Worth
- Arlington
- Denton
- Irving
- Grand Prairie
- Plano
- Frisco
- McKinney

Imported events are normalized and cached in Supabase. Existing seed events continue to work.

The importer upserts:

- venues by slug
- performers by slug
- events by `external_source + external_event_id`
- event performer joins
- `Ticketmaster` ticket source
- event offers with Ticketmaster listing URLs

### Local Import

Make sure `.env.local` contains:

```bash
TICKETMASTER_API_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_URL=
```

Then run:

```bash
npm run import:ticketmaster
```

The script prints progress and a JSON summary with fetched, inserted, updated, skipped, and error counts.

### Protected API Import

The protected route is:

```text
POST /api/admin/import/ticketmaster
```

Required header:

```text
x-admin-import-token: your-admin-import-token
```

Example:

```bash
curl -X POST https://your-vercel-domain.vercel.app/api/admin/import/ticketmaster \
  -H "x-admin-import-token: $ADMIN_IMPORT_TOKEN"
```

The route returns:

```json
{
  "fetchedCount": 0,
  "insertedCount": 0,
  "updatedCount": 0,
  "skippedCount": 0,
  "errors": []
}
```

Ticketmaster API keys and Supabase service role keys are used only server-side.

## Eventbrite Import

Phase 1D includes a server-side Eventbrite importer. Eventbrite does not provide a broad city-wide public event search flow for this use case, so imports are built around configured organization IDs, venue IDs, and individual event IDs or URLs.

Supported official-style endpoints:

- `GET /v3/events/{event_id}/`
- `GET /v3/organizations/{organization_id}/events/`
- `GET /v3/venues/{venue_id}/events/`

At least one of these must be configured:

```bash
EVENTBRITE_ORGANIZATION_IDS=
EVENTBRITE_VENUE_IDS=
EVENTBRITE_EVENT_IDS=
```

Use comma-separated values. `EVENTBRITE_EVENT_IDS` may include raw IDs or Eventbrite event URLs when the numeric ID can be extracted.

Imported Eventbrite events are normalized into the same Supabase tables as Ticketmaster:

- venues by slug
- performers by slug, using organizer fallback
- events by `external_source + external_event_id`
- event performer joins
- `Eventbrite` ticket source
- event offers with `source_name = Eventbrite`

`affiliate_url` is intentionally `null` until Eventbrite affiliate setup is ready. Buy Tickets redirects to `affiliate_url` if present, otherwise `source_listing_url`.

### Local Eventbrite Import

Make sure `.env.local` contains:

```bash
EVENTBRITE_PRIVATE_TOKEN=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_URL=
EVENTBRITE_ORGANIZATION_IDS=
EVENTBRITE_VENUE_IDS=
EVENTBRITE_EVENT_IDS=
EVENTBRITE_MAX_PAGES_PER_QUERY=3
```

Then run:

```bash
npm run import:eventbrite
```

The script prints progress for organization IDs, venue IDs, event IDs, page numbers, skipped reasons, and the final JSON summary.

### Protected Eventbrite API Import

The protected route is:

```text
POST /api/admin/import/eventbrite
```

Required header:

```text
x-admin-import-token: your-admin-import-token
```

Example:

```bash
curl -X POST https://your-vercel-domain.vercel.app/api/admin/import/eventbrite \
  -H "x-admin-import-token: $ADMIN_IMPORT_TOKEN"
```

Eventbrite private tokens and Supabase service role keys are used only server-side.

## Source Import Targets

Eventbrite imports can be configured with environment variables or rows in `source_import_targets`.

For Eventbrite targets:

- `source_name = eventbrite`
- `target_type = organization`, `venue`, or `event`
- `target_value = organization ID`, `venue ID`, `event ID`, or Eventbrite event URL
- `active = true`

Ticketmaster city targets are seeded for future target-driven imports, but the Ticketmaster importer still uses the built-in DFW city list.

## Daily Scheduled Import

Vercel cron is configured in `vercel.json`:

```json
{
  "path": "/api/cron/import-events",
  "schedule": "0 9 * * *"
}
```

The cron route accepts `GET` only and returns JSON only.

Manual test with cron secret:

```bash
curl https://your-vercel-domain.vercel.app/api/cron/import-events \
  -H "Authorization: Bearer $CRON_SECRET"
```

Manual test with admin import token:

```bash
curl https://your-vercel-domain.vercel.app/api/cron/import-events \
  -H "x-admin-import-token: $ADMIN_IMPORT_TOKEN"
```

## Outbound Ticket Tracking

Buy Tickets links point to:

```text
/go/[offerId]
```

That route records an `affiliate_clicks` row with the offer id, event id, timestamp, referrer, and user agent, then redirects to `affiliate_url` or `source_listing_url`.

## Deploy To Vercel

1. Push the repo to GitHub.
2. Import the project in Vercel.
3. Add these environment variables in Vercel Project Settings:
   - `TICKETMASTER_API_KEY`
   - `IMPORT_WINDOW_DAYS`
   - `CRON_SECRET`
   - `EVENTBRITE_PRIVATE_TOKEN`
   - `EVENTBRITE_ORGANIZATION_IDS`
   - `EVENTBRITE_VENUE_IDS`
   - `EVENTBRITE_EVENT_IDS`
   - `EVENTBRITE_MAX_PAGES_PER_QUERY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_IMPORT_TOKEN`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Redeploy after adding environment variables.
5. Run the protected import routes manually or let Vercel Cron call `/api/cron/import-events`.

## Phase Notes

Phase 1D.5 uses Supabase seed data plus cached Ticketmaster and Eventbrite imports inside a rolling 365-day default window.

Not included yet:

- Payments
- User resale
- Service role access in frontend code
- Website scraping
- Eventbrite broad public search assumptions
