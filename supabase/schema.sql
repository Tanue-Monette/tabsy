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
  created_at  timestamptz not null default now()
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

-- RPC: increment or decrement a customer's balance atomically
create or replace function increment_balance(p_customer_id uuid, p_amount numeric)
returns void
language sql
as $$
  update customers
  set balance = balance + p_amount
  where id = p_customer_id;
$$;

-- Row Level Security (optional but recommended)
alter table merchants enable row level security;
alter table customers enable row level security;
alter table transactions enable row level security;

-- Since we use the service role key server-side, RLS won't block our actions.
-- These policies are a safety net if you ever use the anon key client-side.
create policy "merchants: own row only"
  on merchants for all
  using (false); -- block all anon/user access; only service role can access

create policy "customers: own rows only"
  on customers for all
  using (false);

create policy "transactions: own rows only"
  on transactions for all
  using (false);
