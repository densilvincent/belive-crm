-- ============================================================================
-- Belive Holidays CRM — Supabase schema
-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query).
-- Safe to re-run: every statement is guarded with IF NOT EXISTS / OR REPLACE.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Helpers
-- ----------------------------------------------------------------------------

-- Generic "touch updated_at" trigger, reused by every table that has the column.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Atomic per-day counters, used to build human-readable sequential IDs
-- (BEL-BOOK-20260904-001, ...) without a race condition under concurrent inserts.
create table if not exists id_counters (
  counter_key text primary key,
  value integer not null default 0
);

create or replace function next_daily_seq(prefix text, for_date date)
returns integer as $$
declare
  key text := prefix || '-' || to_char(for_date, 'YYYYMMDD');
  v integer;
begin
  insert into id_counters (counter_key, value)
  values (key, 1)
  on conflict (counter_key) do update set value = id_counters.value + 1
  returning value into v;
  return v;
end;
$$ language plpgsql;

-- ----------------------------------------------------------------------------
-- 1. users  (mirrors auth.users, adds role + finance access)
-- ----------------------------------------------------------------------------

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'telecaller' check (role in ('owner', 'partner', 'telecaller')),
  finance_edit_access boolean not null default false,
  created_at timestamptz not null default now()
);

-- Auto-create a public.users row whenever someone signs up via Supabase Auth.
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, role, finance_edit_access)
  values (new.id, new.email, 'telecaller', false)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ----------------------------------------------------------------------------
-- 2. itineraries
-- ----------------------------------------------------------------------------

create table if not exists itineraries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  name text not null,
  destination text,
  duration_days integer,
  description text,
  day_by_day_itinerary jsonb not null default '[]',
  base_price numeric(12, 2) not null default 0,
  is_prebuilt boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_itineraries_user_id on itineraries(user_id);
create index if not exists idx_itineraries_destination on itineraries(destination);
create index if not exists idx_itineraries_is_prebuilt on itineraries(is_prebuilt);

drop trigger if exists trg_itineraries_updated_at on itineraries;
create trigger trg_itineraries_updated_at before update on itineraries
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- 3. hotels_houseboats
-- ----------------------------------------------------------------------------

create table if not exists hotels_houseboats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  name text not null,
  type text not null check (type in ('hotel', 'houseboat')),
  location text,
  check_in_time text,
  check_out_time text,
  contact_phone text,
  contact_email text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_hotels_user_id on hotels_houseboats(user_id);
create index if not exists idx_hotels_type on hotels_houseboats(type);
create index if not exists idx_hotels_location on hotels_houseboats(location);

-- ----------------------------------------------------------------------------
-- 4. drivers
-- ----------------------------------------------------------------------------

create table if not exists drivers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  name text not null,
  phone text,
  vehicle_assigned text,
  status text not null default 'Active' check (status in ('Active', 'Inactive')),
  created_at timestamptz not null default now()
);

create index if not exists idx_drivers_user_id on drivers(user_id);
create index if not exists idx_drivers_name on drivers(name);

-- ----------------------------------------------------------------------------
-- 5. trips
-- ----------------------------------------------------------------------------

create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  created_by uuid references public.users(id),
  date date not null default current_date,
  booking_id text unique,
  quote_id text unique,
  customer_name text not null,
  customer_phone text,
  customer_email text,
  trip_type text not null check (trip_type in ('1-on-1-cab', 'tour-package', 'overflow-referral', 'other')),
  itinerary_id uuid references itineraries(id),
  amount_quoted numeric(12, 2) default 0,
  amount_received numeric(12, 2) default 0,
  payment_status text not null default 'Unpaid' check (payment_status in ('Unpaid', 'Partial', 'Paid', 'Cancelled')),
  trip_status text not null default 'Quote-Generated' check (
    trip_status in ('Quote-Generated', 'Quote-Sent', 'Quote-Confirmed', 'Booked', 'Paid', 'Cancelled')
  ),
  driver_assigned uuid references drivers(id),
  driver_commission numeric(12, 2),
  hotel_assigned uuid references hotels_houseboats(id),
  houseboat_assigned uuid references hotels_houseboats(id),
  cab_rental_charge numeric(12, 2),
  external_driver_charge numeric(12, 2),
  notes text,
  pdf_quote_generated boolean not null default false,
  pdf_quote_sent_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_trips_user_id on trips(user_id);
create index if not exists idx_trips_trip_status on trips(trip_status);
create index if not exists idx_trips_date on trips(date);
create index if not exists idx_trips_itinerary_id on trips(itinerary_id);
create index if not exists idx_trips_driver_assigned on trips(driver_assigned);
create index if not exists idx_trips_payment_status on trips(payment_status);

drop trigger if exists trg_trips_updated_at on trips;
create trigger trg_trips_updated_at before update on trips
  for each row execute function set_updated_at();

create or replace function generate_trip_ids()
returns trigger as $$
begin
  if new.booking_id is null then
    new.booking_id := 'BEL-BOOK-' || to_char(new.date, 'YYYYMMDD') || '-' ||
      lpad(next_daily_seq('BOOK', new.date)::text, 3, '0');
  end if;
  if new.quote_id is null then
    new.quote_id := 'BEL-QUOTE-' || to_char(new.date, 'YYYYMMDD') || '-' ||
      lpad(next_daily_seq('QUOTE', new.date)::text, 3, '0');
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_generate_trip_ids on trips;
create trigger trg_generate_trip_ids before insert on trips
  for each row execute function generate_trip_ids();

-- ----------------------------------------------------------------------------
-- 6. commissions_received
-- ----------------------------------------------------------------------------

create table if not exists commissions_received (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  created_by uuid references public.users(id),
  date date not null default current_date,
  commission_id text unique,
  commission_type text not null check (
    commission_type in ('hotel', 'houseboat', 'overflow-referral', 'airbnb', 'trivago', 'booking.com', 'other-operator', 'other')
  ),
  operator_or_source text,
  commission_amount numeric(12, 2) not null default 0,
  payment_status text not null default 'Pending' check (payment_status in ('Received', 'Pending')),
  trip_id uuid references trips(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_commissions_user_id on commissions_received(user_id);
create index if not exists idx_commissions_date on commissions_received(date);
create index if not exists idx_commissions_type on commissions_received(commission_type);
create index if not exists idx_commissions_payment_status on commissions_received(payment_status);

drop trigger if exists trg_commissions_updated_at on commissions_received;
create trigger trg_commissions_updated_at before update on commissions_received
  for each row execute function set_updated_at();

create or replace function generate_commission_id()
returns trigger as $$
begin
  if new.commission_id is null then
    new.commission_id := 'BEL-COMM-' || to_char(new.date, 'YYYYMMDD') || '-' ||
      lpad(next_daily_seq('COMM', new.date)::text, 3, '0');
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_generate_commission_id on commissions_received;
create trigger trg_generate_commission_id before insert on commissions_received
  for each row execute function generate_commission_id();

-- ----------------------------------------------------------------------------
-- 7. daily_overhead_expenses
-- ----------------------------------------------------------------------------

create table if not exists daily_overhead_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  date date not null default current_date,
  -- A refuel doesn't happen per trip (a full tank covers several short
  -- trips, or 1-2 long ones) - it's billed as liters x price/liter,
  -- matching the pump receipt, on whatever day it actually happens.
  fuel_liters numeric(10, 2),
  fuel_cost_per_liter numeric(10, 2),
  maintenance_cost numeric(12, 2) default 0,
  spare_parts_cost numeric(12, 2) default 0,
  washing_cost numeric(12, 2) default 0,
  insurance_daily_allocation numeric(12, 2) default 0,
  other_overhead numeric(12, 2) default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_overhead_user_id on daily_overhead_expenses(user_id);
create index if not exists idx_overhead_date on daily_overhead_expenses(date);

drop trigger if exists trg_overhead_updated_at on daily_overhead_expenses;
create trigger trg_overhead_updated_at before update on daily_overhead_expenses
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- 8. investment_returns
-- ----------------------------------------------------------------------------

create table if not exists investment_returns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  date date not null default current_date,
  vehicle_name text not null,
  expected_monthly_return numeric(12, 2) default 0,
  actual_amount_received numeric(12, 2) default 0,
  payment_status text not null default 'Pending' check (payment_status in ('Received', 'Pending')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_investments_user_id on investment_returns(user_id);
create index if not exists idx_investments_date on investment_returns(date);
create index if not exists idx_investments_vehicle_name on investment_returns(vehicle_name);

drop trigger if exists trg_investments_updated_at on investment_returns;
create trigger trg_investments_updated_at before update on investment_returns
  for each row execute function set_updated_at();

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.users enable row level security;
alter table itineraries enable row level security;
alter table hotels_houseboats enable row level security;
alter table drivers enable row level security;
alter table trips enable row level security;
alter table commissions_received enable row level security;
alter table daily_overhead_expenses enable row level security;
alter table investment_returns enable row level security;

-- Small helper so policies read cleanly: is the current user the owner?
create or replace function is_owner()
returns boolean as $$
  select exists (
    select 1 from public.users where id = auth.uid() and role = 'owner'
  );
$$ language sql stable security definer set search_path = public;

-- users: everyone can read their own row; the owner can read everyone's.
-- Role/finance_edit_access changes are made via the Supabase dashboard, not the client.
create policy "users_select_own_or_owner" on public.users
  for select using (id = auth.uid() or is_owner());

-- itineraries / drivers / hotels_houseboats: shared across the whole org.
create policy "itineraries_select_all" on itineraries for select using (auth.role() = 'authenticated');
create policy "itineraries_insert_all" on itineraries for insert with check (auth.role() = 'authenticated');
create policy "itineraries_update_owner" on itineraries for update using (is_owner());
create policy "itineraries_delete_owner" on itineraries for delete using (is_owner());

create policy "hotels_select_all" on hotels_houseboats for select using (auth.role() = 'authenticated');
create policy "hotels_insert_all" on hotels_houseboats for insert with check (auth.role() = 'authenticated');
create policy "hotels_update_all" on hotels_houseboats for update using (auth.role() = 'authenticated');
create policy "hotels_delete_owner" on hotels_houseboats for delete using (is_owner());

create policy "drivers_select_all" on drivers for select using (auth.role() = 'authenticated');
create policy "drivers_insert_owner" on drivers for insert with check (is_owner());
create policy "drivers_update_owner" on drivers for update using (is_owner());
create policy "drivers_delete_owner" on drivers for delete using (is_owner());

-- trips / commissions_received / investment_returns: creator or owner.
create policy "trips_select_own_or_owner" on trips
  for select using (created_by = auth.uid() or is_owner());
create policy "trips_insert_self" on trips
  for insert with check (auth.role() = 'authenticated');
create policy "trips_update_own_or_owner" on trips
  for update using (created_by = auth.uid() or is_owner());
create policy "trips_delete_owner" on trips
  for delete using (is_owner());

create policy "commissions_select_own_or_owner" on commissions_received
  for select using (created_by = auth.uid() or is_owner());
create policy "commissions_insert_self" on commissions_received
  for insert with check (auth.role() = 'authenticated');
create policy "commissions_update_own_or_owner" on commissions_received
  for update using (created_by = auth.uid() or is_owner());
create policy "commissions_delete_owner" on commissions_received
  for delete using (is_owner());

create policy "investments_select_own_or_owner" on investment_returns
  for select using (user_id = auth.uid() or is_owner());
create policy "investments_insert_self" on investment_returns
  for insert with check (auth.role() = 'authenticated');
create policy "investments_update_own_or_owner" on investment_returns
  for update using (user_id = auth.uid() or is_owner());
create policy "investments_delete_owner" on investment_returns
  for delete using (is_owner());

-- daily_overhead_expenses: owner-managed, everyone else read-only.
create policy "overhead_select_all" on daily_overhead_expenses
  for select using (auth.role() = 'authenticated');
create policy "overhead_insert_owner" on daily_overhead_expenses
  for insert with check (is_owner());
create policy "overhead_update_owner" on daily_overhead_expenses
  for update using (is_owner());
create policy "overhead_delete_owner" on daily_overhead_expenses
  for delete using (is_owner());

-- ============================================================================
-- Realtime
-- ============================================================================

alter publication supabase_realtime add table trips;
alter publication supabase_realtime add table commissions_received;
alter publication supabase_realtime add table investment_returns;
alter publication supabase_realtime add table daily_overhead_expenses;
alter publication supabase_realtime add table itineraries;
alter publication supabase_realtime add table hotels_houseboats;
alter publication supabase_realtime add table drivers;

-- ============================================================================
-- After running this file:
--   1. Have Dens, Sameer and each telecaller sign up once from the app's
--      login screen (this creates their public.users row automatically).
--   2. In the SQL editor, promote them:
--        update public.users set role = 'owner', finance_edit_access = true
--          where email = 'dens@example.com';
--        update public.users set role = 'partner' where email = 'sameer@example.com';
--      (telecallers keep the 'telecaller' default — no change needed)
-- ============================================================================
