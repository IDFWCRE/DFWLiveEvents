# DFW Live Events

Dallas-Fort Worth live events marketplace foundation built with Next.js App Router, TypeScript, and Supabase.

## Required Environment Variables

Create `.env.local` for local development:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Only use the public anon key in the app. Do not expose a Supabase service role key in frontend code.

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

## Supabase Setup

1. Create a Supabase project.
2. Open the Supabase SQL Editor.
3. Run `supabase/schema.sql`.
4. Run `supabase/seed.sql`.
5. Copy the project URL and anon key into `.env.local`.

The schema includes:

- `venues`
- `performers`
- `events`
- `event_performers`
- `ticket_sources`
- `event_offers`
- `affiliate_clicks`
- `admin_settings`

RLS is enabled. Public anon users can read published events, venues, performers, active ticket sources, and available event offers. Public users can insert affiliate clicks for future tracking. Admin write policies are intentionally left as commented placeholders.

## Deploy To Vercel

1. Push the repo to GitHub.
2. Import the project in Vercel.
3. Add these environment variables in Vercel Project Settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Redeploy after adding environment variables.

## Phase Notes

Phase 1B uses Supabase seed data only.

Not included yet:

- Ticketmaster API
- Payments
- User resale
- Service role access in frontend code
