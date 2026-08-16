import { z } from "zod";

// ─── Auth ────────────────────────────────────────────────────────────────────

export const RegisterSchema = z.object({
  shop_name: z.string().min(2, "Shop name must be at least 2 characters").trim(),
  merchant_name: z.string().min(2, "Name must be at least 2 characters").trim(),
  phone: z
    .string()
    .regex(/^6\d{8}$/, "Enter a valid Cameroon number (e.g. 670123456)")
    .trim(),
  pin: z
    .string()
    .length(4, "PIN must be exactly 4 digits")
    .regex(/^\d{4}$/, "PIN must contain only digits"),
});

export const LoginSchema = z.object({
  phone: z.string().trim().min(1, "Phone is required"),
  pin: z.string().length(4, "PIN must be 4 digits"),
});

// ─── Customers ───────────────────────────────────────────────────────────────

export const CustomerSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  phone: z.string().trim().optional(),
});

// ─── Transactions ────────────────────────────────────────────────────────────

export const DebtSchema = z.object({
  customer_id: z.string().uuid("Invalid customer"),
  amount: z.coerce.number().positive("Amount must be positive"),
  description: z.string().trim().optional(),
  date: z.string().optional(),
});

export const PaymentSchema = z.object({
  customer_id: z.string().uuid("Invalid customer"),
  amount: z.coerce.number().positive("Amount must be positive"),
  method: z.enum(["cash", "mtn", "orange"]),
  reference: z.string().trim().optional(),
});

// ─── Stock ───────────────────────────────────────────────────────────────────

export const StockItemSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  unit: z.string().trim().min(1).default("pcs"),
  cost_price: z.coerce.number().min(0, "Cost can't be negative").default(0),
  sell_price: z.coerce.number().min(0, "Price can't be negative").default(0),
  quantity: z.coerce.number().min(0, "Quantity can't be negative").default(0),
  low_stock_threshold: z.coerce.number().min(0).default(5),
});

export const RestockSchema = z.object({
  stock_item_id: z.string().uuid("Invalid item"),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  unit_cost: z.coerce.number().min(0).optional(),
});

// ─── Orders ──────────────────────────────────────────────────────────────────

export const OrderItemSchema = z.object({
  stock_item_id: z.string().uuid(),
  quantity: z.coerce.number().positive(),
  unit_price: z.coerce.number().min(0),
});

export const CreateOrderSchema = z.object({
  customer_id: z.string().uuid("Invalid customer"),
  items: z.array(OrderItemSchema).min(1, "Add at least one item to the order"),
});

// ─── Session ─────────────────────────────────────────────────────────────────

export type SessionPayload = {
  merchantId: string;
  expiresAt: Date;
};

// ─── Action State ────────────────────────────────────────────────────────────

export type ActionState =
  | { errors?: Record<string, string[]>; message?: string }
  | undefined;
