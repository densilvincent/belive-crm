# Belive Holidays CRM

Mobile-first trip, commission, investment, expense and driver tracker for **Belive Holidays**
(Kerala tourism — airport transfers, houseboat rentals, tour packages). Built for a 3-person
team working mostly from a phone in the field, with itinerary management, branded PDF quote
generation, and role-based access (Owner / Partner / Telecaller).

## Stack

- **React 19** + **Vite** (not Create React App — see note on env vars below)
- **Tailwind CSS** for mobile-first styling
- **Supabase** (Postgres + Auth + Realtime) as the backend
- **React Router 7** for navigation
- **jsPDF** + **jspdf-autotable** for branded quote PDFs
- **Recharts** for the report pie charts
- **react-hot-toast** for lightweight feedback

Route-level code splitting keeps the first mobile paint small: only the login screen and
Dashboard load up front. Every other tab, and the PDF generator itself, load on demand.

## Note on environment variables

The original spec listed `REACT_APP_*` env vars, which is the Create React App convention.
CRA is deprecated and unmaintained, so this app is built with **Vite** instead — the modern,
actively-maintained standard. Vite requires the `VITE_` prefix for client-exposed env vars, so
use `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (see `.env.example`).

## Note on the logo asset

The spec referenced `Be_Live_Circle_logo_BLH.jpeg`, which wasn't present in this workspace. The
circular Belive Holidays logo found in `~/Downloads/BELIVE CIRCLE LOGO.png` was used instead —
cropped square and downsized to 512×512 for a fast mobile load — and lives at
`src/assets/belive-logo.png` / `public/belive-logo.png`. Swap that file for the exact brand
asset whenever you have it; nothing else needs to change.

## Project structure

```
src/
  lib/            Supabase client, PDF generator, formatters, calc helpers, constants
  context/        AuthContext (session, role, finance_edit_access)
  hooks/          One hook per table (useTrips, useCommissions, ...) + generic useSupabaseTable
  components/
    layout/       TopBar, Sidebar (desktop), BottomNav + MoreSheet (mobile), route guards
    common/       Card/Modal/Button-style primitives, Icon set, StatusBadge, etc.
    forms/        One form per entity (TripForm, ConfirmTripForm, CommissionForm, ...)
    reports/      The 7 Accounting Reports sub-tabs
  pages/          One component per tab (Dashboard, QuoteManagement, TripTracker, ...)
supabase/
  schema.sql      Full DDL: tables, indexes, triggers, RLS policies, realtime publication
```

## Setup

### 1. Supabase

1. Open your Supabase project → **SQL Editor** → New query.
2. Paste the entire contents of [`supabase/schema.sql`](supabase/schema.sql) and run it. It's
   idempotent (safe to re-run) and sets up:
   - all 8 tables with indexes and foreign keys
   - triggers that auto-generate `booking_id` / `quote_id` / `commission_id`
     (`BEL-BOOK-YYYYMMDD-001`, etc.) using a race-safe per-day counter
   - a trigger that mirrors new `auth.users` signups into `public.users`
     (defaulting to role `telecaller`)
   - Row Level Security policies for every table
   - realtime publication for live updates across devices
3. Have Dens, Sameer, and each telecaller **sign up once** from the app's login screen — this
   creates their `public.users` row automatically via the trigger.
4. Promote Dens and Sameer from the SQL Editor:
   ```sql
   update public.users set role = 'owner', finance_edit_access = true
     where email = 'dens@example.com';
   update public.users set role = 'partner'
     where email = 'sameer@example.com';
   -- telecallers keep the 'telecaller' default — no change needed
   ```

### 2. Local development

```bash
npm install
cp .env.example .env   # already filled in with the project's credentials
npm run dev
```

### 3. Deploy to Vercel

1. Push this repo to GitHub (`git@github.com:densilvincent/belive-crm.git`).
2. In Vercel, import the GitHub repo (framework preset: **Vite**).
3. Add the two env vars from `.env.example` under Project Settings → Environment Variables.
4. Deploy. Every push to `main` auto-deploys from then on.

## How to use each tab

- **Dashboard** — today's snapshot: revenue/cost/profit stat cards, quick-add Trip/Commission/
  Investment, today's quotes with PDF/WhatsApp/confirm actions, active trips, and (owner only)
  daily overhead entry, ending in the Daily Net Profit summary.
- **Quotes** — Stage 1 (Quote Generated/Sent) and Stage 2 (Quote Confirmed) queues across all
  dates, with PDF generation, WhatsApp deep link, and the Confirm Quote form (driver, hotel/
  houseboat, costs, amount received).
- **Trips** — full trip history with a date-range picker, per-trip drill-down, edit, and CSV
  export.
- **Commissions** — hotel/houseboat/overflow/OTA commissions with a date range, quick toggle
  between Pending/Received, and CSV export.
- **Itineraries** — pre-built itinerary cards, custom itinerary builder with a dynamic
  day-by-day editor, and "Use for Quote" to jump straight into a new trip.
- **Stays** (Accommodations) — hotel/houseboat directory with tap-to-call and swipe-to-delete.
- **Drivers** — performance view: trips this month, total/average commission, tap to see every
  trip assigned to a driver.
- **Investments** — vehicle investment returns (expected vs. actual) with a date range.
- **Expenses** (owner only) — daily overhead (maintenance/parts/washing/insurance/other) with a
  category pie chart.
- **Reports** — 7 sub-reports (Daily Net Profit, Weekly Net Profit, Trip Profitability, Driver
  Commission, Expense Breakdown, Commission Source, Consolidated P&L), each with its own CSV
  export.
- **Settings** (owner only) — account info and driver management (add/edit/remove).

## Profit calculation (kept consistent everywhere)

```
trip_cost   = driver_commission + fuel_cost + cab_rental_charge + external_driver_charge
              (hotel/houseboat commissions are NEVER part of trip_cost)
trip_profit = amount_received − trip_cost

daily_net_profit   = Σ(trip_profit for the day) − daily_overhead_total
monthly_net_profit = Σ(daily_net_profit) + commission_income + investment_income
```

See `src/lib/calc.js` — every page imports these same functions rather than recomputing them.

## Troubleshooting

- **Blank data everywhere / 404s in the console** — the SQL schema hasn't been run yet against
  your Supabase project (step 1 above).
- **"Missing Supabase env vars" in the console** — copy `.env.example` to `.env` (local dev) or
  add the two `VITE_SUPABASE_*` vars in Vercel (production).
- **Signed in but nothing but empty states, and owner tabs are missing** — the signup trigger
  creates the `public.users` row with role `telecaller` by default; promote the account via the
  SQL snippet in step 1.4.
- **PDF has no logo** — the fetch of `src/assets/belive-logo.png` failed (offline dev server
  without the asset, or a very old cached build); the PDF still generates without it.
- **iOS Safari zooms in when tapping a form field** — already handled globally (all inputs are
  set to `font-size: 16px`), but if you add a new input without the shared `.input-field` class,
  match that font size.

## Mobile testing checklist

- [ ] iPhone 12 mini (small) — bottom nav, modals, and stat-card carousel don't clip
- [ ] iPhone 12 Pro Max / Android flagship (large) — layout doesn't look sparse/stretched
- [ ] Landscape orientation on a phone — sticky headers and bottom nav stay usable
- [ ] Add Trip → Confirm Quote → generate PDF → WhatsApp link end to end
- [ ] Owner-only tabs (Expenses, Settings) hidden for partner/telecaller accounts
- [ ] Offline / flaky network — forms show a clear error toast instead of hanging
