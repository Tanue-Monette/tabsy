# Tabsy (Monette POS) — Project Overview & Developer Guide

Welcome to **Tabsy** (also referred to as Monette POS), a modern, full-stack Point of Sale (POS), Inventory Management, and Debt/Credit Tracking web application tailored for retail merchants in Cameroon and the broader Central African region.

---

## 1. Executive Summary & Core Mission

Tabsy is designed to bridge the gap between simple paper-based credit tracking (informal debt management) and modern digital POS systems. 
Many small merchants sell items on credit (debt) to regular customers or accept multiple payment channels (Cash, MTN Mobile Money, Orange Money). Tabsy enables merchants to:
1. Track inventory in base units and packs.
2. Complete direct sales or credit/debt sales instantly.
3. Manage customer debt balances with payment histories.
4. Access sales, profit, and stock replenishment reports.
5. Operate with a dual-portal setup: a mobile-optimized **Merchant Front Office** and a desktop-optimized **Super Admin Back Office**.

---

## 2. Technology Stack & Key Dependencies

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/) with React 19 and TypeScript.
- **Styling**: Vanilla CSS / Tailwind CSS v4 with custom dark & glassmorphism aesthetic tokens.
- **Database & Backend**: [Supabase (PostgreSQL)](https://supabase.com/).
  - Uses Row Level Security (RLS) policies.
  - Server Actions use Supabase Service Role Key to safely bypass client RLS for authenticated server calls.
- **Authentication & Sessions**:
  - Custom JWT session management built with [`jose`](https://github.com/panva/jose) stored in HTTP-only cookies.
  - Merchant Session cookie: `tabsy_session`.
  - Admin Session cookie: `tabsy_admin_session`.
  - Password & PIN hashing using `@node-rs/bcrypt`.
- **Offline & Sync Engine**: [`Dexie.js`](https://dexie.org/) (IndexedDB wrapper) for client-side offline storage and background synchronization capabilities (`app/lib/syncEngine.ts`).
- **Internationalization (i18n)**: URL-based routing (`/[lang]/...`) supporting English (`en`) and French (`fr`) via dynamic dictionaries.

---

## 3. Architecture & Project Directory Structure

```
my-app/
├── app/
│   ├── [lang]/                 # Merchant Front Office (Localized Routes)
│   │   ├── dashboard/          # Merchant Home & Quick Stats
│   │   ├── new-order/          # POS Cart & Item Selection
│   │   ├── checkout/           # Checkout & Payment Method / Debt Assignment
│   │   ├── stock/              # Inventory Management, Add, Edit, Restock
│   │   ├── customers/          # Customer Directory & Individual Ledgers
│   │   ├── transactions/       # Sales Reports & Inventory Analysis
│   │   ├── add-debt/           # Manual Debt Entry
│   │   └── settings/           # Merchant Shop Configuration
│   │
│   ├── admin/                  # Super Admin Back Office (Unlocalized Route)
│   │   ├── (dashboard)/        # Admin Overview & Analytics
│   │   ├── merchants/          # Create, Suspend, Activate, Delete Merchants
│   │   ├── config/             # Platform Currency & Feature Flags
│   │   ├── logs/               # Real-time System Audit Logs
│   │   └── login/              # Admin Login Portal
│   │
│   ├── actions/                # Server Actions (Backend Logic)
│   │   ├── auth.ts             # Merchant Auth (Register, Login, Logout)
│   │   ├── merchant.ts         # Merchant Profile & Settings
│   │   ├── stock.ts            # Stock CRUD, Restock, Adjustments, Profit Stats
│   │   ├── orders.ts           # Order Creation, Sales Reports, Debt Orders
│   │   ├── customers.ts        # Customer Management & Balance RPCs
│   │   ├── transactions.ts     # Debt & Payment Ledger Operations
│   │   └── admin/              # Admin Actions (auth, merchants, config, logs)
│   │
│   ├── components/             # Reusable UI Components (POS Cart, Nav, Badges)
│   ├── dictionaries/           # i18n Dictionary Files (en.json, fr.json)
│   └── lib/                    # Core Utilities, Schemas, Sessions, Supabase Client
│       ├── definitions.ts      # Zod Schemas & TypeScript Types
│       ├── session.ts          # Merchant JWT Cookie Session
│       ├── admin-session.ts    # Admin JWT Cookie Session
│       ├── supabase.ts         # Server-side Supabase Service Client
│       └── i18n.ts             # Dictionary Loader
│
├── supabase/
│   └── schema.sql              # Database Tables, Indexes, RPC Functions, & RLS Policies
├── middleware.ts               # Subdomain / Route Protection & i18n Routing
└── package.json
```

---

## 4. Key Portals & Features

### A. Merchant Front Office (`/[lang]/*`)
- **POS / Cart System**: Merchants build carts using base units or custom packs. Sales can be completed as **Direct Sales** (Cash, MTN Mobile Money, Orange Money) or **Credit Sales (Debt)** assigned to a customer.
- **Inventory Ledger**: Stock items store `quantity` in base units. Restocking converts pack quantities into base units and logs a `stock_movement`.
- **Customer Debt Ledger**: Each customer has a running balance. When a debt sale is completed, an RPC (`increment_balance`) atomically updates customer balance and logs a transaction.
- **Reporting**: Provides real-time metrics on item sales, payment breakdown (Cash vs Mobile Money), and realized profit margins.

### B. Admin Back Office (`/admin/*`)
- **System Control**: Global platform configuration including default currency (e.g. `FCFA`), registration toggles, and maintenance mode.
- **Merchant Management**: Full merchant lifecycle management (creation, activation, suspension, deletion).
- **Audit Logs**: Platform-wide activity feed tracking actions taken by admins, merchants, or system routines.

---

## 5. Database Entity Structure

1. `merchants`: Shop profile, owner info, phone (login ID), PIN hash, JSONB settings (payment methods, max debt limits), status (`active` | `suspended`).
2. `admin_users`: Platform administrators, email, bcrypt password hash, role (`super_admin` | `admin`).
3. `customers`: Customer profiles linked to a merchant, carrying a current `balance`.
4. `transactions`: Log of all monetary events (`sale`, `debt`, `payment`), including payment method (`cash`, `mtn`, `orange`).
5. `stock_items`: Catalog of inventory items containing `cost_price`, `sell_price`, `quantity`, `low_stock_threshold`, and `unit`.
6. `stock_item_packs`: Pack definitions tied to stock items (e.g. 1 Pack = 12 Units).
7. `stock_movements`: Ledger tracking every quantity change (`restock`, `adjustment`, `sale`).
8. `orders` & `order_items`: Completed sale records containing line items, total amounts, and payment types.
9. `system_logs`: Centralized audit trail.
10. `system_config`: Key-value system configurations.

---

## 6. Development & Deployment Workflow

- **Local Development**: Run `npm run dev` (starts Next.js server on `http://localhost:3000`).
- **Build & Verification**: Run `npm run build` or `npx tsc --noEmit` to verify type safety.
- **Environment Variables**:
  - `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL.
  - `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (for server actions).
  - `SESSION_SECRET`: Secret key for JWT session signing.

---
