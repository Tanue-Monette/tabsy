-- Run this in your Supabase SQL editor

-- Merchants table
create table if not exists merchants (
  id          uuid primary key default gen_random_uuid(),
  shop_name   text not null,
  merchant_name text not null,
  phone       text not null unique,
  pin_hash    text not null,
  settings    jsonb not null default '{
    "cash_enabled": true,
    "mtn_enabled": true,
    "orange_enabled": false,
    "debt_reminders": true,
    "weekly_reports": true
  }'::jsonb,
  status      text not null default 'active' check (status in ('active', 'suspended')),
  created_at  timestamptz not null default now()
);

-- Admin Users table
create table if not exists admin_users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  password_hash text not null,
  name          text not null default 'Admin',
  role          text not null default 'admin' check (role in ('super_admin', 'admin')),
  created_at    timestamptz not null default now()
);

-- System Logs table
create table if not exists system_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_type  text not null check (actor_type in ('admin', 'merchant', 'system')),
  actor_id    uuid,
  actor_label text,
  action      text not null,
  entity_type text,
  entity_id   uuid,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);

-- System Config table (Key-Value configuration)
create table if not exists system_config (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references admin_users(id)
);

-- Customers table
create table if not exists customers (
  id          uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants(id) on delete cascade,
  name        text not null,
  phone       text,
  balance     numeric(12, 2) not null default 0,
  created_at  timestamptz not null default now()
);

-- Transactions table
create table if not exists transactions (
  id          uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  type        text not null check (type in ('debt', 'payment')),
  amount      numeric(12, 2) not null check (amount > 0),
  description text,
  method      text check (method in ('cash', 'mtn', 'orange')),
  created_at  timestamptz not null default now()
);

-- Indexes
create index if not exists customers_merchant_id_idx on customers(merchant_id);
create index if not exists transactions_customer_id_idx on transactions(customer_id);
create index if not exists transactions_merchant_id_idx on transactions(merchant_id);
create index if not exists system_logs_created_at_idx on system_logs(created_at desc);
create index if not exists system_logs_actor_type_idx on system_logs(actor_type);

-- RPC: increment or decrement a customer's balance atomically
create or replace function increment_balance(p_customer_id uuid, p_amount numeric)
returns void
language sql
as $$
  update customers
  set balance = balance + p_amount
  where id = p_customer_id;
$$;

-- Row Level Security
alter table merchants enable row level security;
alter table customers enable row level security;
alter table transactions enable row level security;
alter table admin_users enable row level security;
alter table system_logs enable row level security;
alter table system_config enable row level security;

-- Policies (blocking direct public client access; server actions with service role key will bypass RLS)
create policy "merchants: service role only" on merchants for all using (false);
create policy "customers: service role only" on customers for all using (false);
create policy "transactions: service role only" on transactions for all using (false);
create policy "admin_users: service role only" on admin_users for all using (false);
create policy "system_logs: service role only" on system_logs for all using (false);
create policy "system_config: service role only" on system_config for all using (false);

-- ─── ADVANCED INVENTORY & REPORTING EXTENSIONS ───────────────────────────────

-- 1. Historical Cost Price Snapshotting on Order Items
alter table order_items add column if not exists cost_price_at_sale numeric(12, 2);

-- 2. Adjustment Reasons for Stock Movements
alter table stock_movements add column if not exists adjustment_reason text 
  check (adjustment_reason in ('recount', 'typo', 'spoilage', 'expiry', 'damage', 'theft', 'personal_use'));

-- 3. Daily Register Closing / EOD Shift Reconciliation
create table if not exists daily_registers (
  id                 uuid primary key default gen_random_uuid(),
  merchant_id        uuid not null references merchants(id) on delete cascade,
  register_date      date not null,
  opening_cash       numeric(12, 2) not null default 0,
  expected_cash      numeric(12, 2) not null default 0,
  actual_cash        numeric(12, 2) not null default 0,
  discrepancy        numeric(12, 2) not null default 0,
  expected_mtn       numeric(12, 2) not null default 0,
  actual_mtn         numeric(12, 2) not null default 0,
  mtn_discrepancy    numeric(12, 2) not null default 0,
  expected_orange    numeric(12, 2) not null default 0,
  actual_orange      numeric(12, 2) not null default 0,
  orange_discrepancy numeric(12, 2) not null default 0,
  notes              text,
  closed_at          timestamptz not null default now(),
  created_at         timestamptz not null default now(),
  unique(merchant_id, register_date)
);

-- 4. Daily Sales Aggregates Table
create table if not exists daily_sales_aggregates (
  id               uuid primary key default gen_random_uuid(),
  merchant_id      uuid not null references merchants(id) on delete cascade,
  summary_date     date not null,
  total_orders     integer not null default 0,
  gross_revenue    numeric(12, 2) not null default 0,
  cogs             numeric(12, 2) not null default 0,
  net_profit       numeric(12, 2) not null default 0,
  cash_revenue     numeric(12, 2) not null default 0,
  mtn_revenue      numeric(12, 2) not null default 0,
  orange_revenue   numeric(12, 2) not null default 0,
  debt_revenue     numeric(12, 2) not null default 0,
  items_sold_count integer not null default 0,
  created_at       timestamptz not null default now(),
  unique(merchant_id, summary_date)
);

-- Indexes for performance
create index if not exists daily_registers_merchant_date_idx on daily_registers(merchant_id, register_date desc);
create index if not exists daily_sales_aggregates_merchant_date_idx on daily_sales_aggregates(merchant_id, summary_date desc);

-- RLS Security Policies
alter table daily_registers enable row level security;
alter table daily_sales_aggregates enable row level security;

create policy "daily_registers: service role only" on daily_registers for all using (false);
create policy "daily_sales_aggregates: service role only" on daily_sales_aggregates for all using (false);


