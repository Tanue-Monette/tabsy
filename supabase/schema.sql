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

