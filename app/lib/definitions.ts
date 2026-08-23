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

// A pack is just a named shortcut for "N base units" (e.g. "Crate" = 24
// bottles). Stock is always stored/deducted in base units — packs never
// carry their own price or their own stock count.
export const StockItemPackSchema = z.object({
  name: z.string().min(1, "Pack name is required").trim(),
  size: z.coerce.number().positive("Pack size must be greater than 0"),
});

export const StockItemPacksSchema = z
  .array(StockItemPackSchema)
  .max(10, "Too many packs")
  .refine(
    (packs) => new Set(packs.map((p) => p.name.toLowerCase())).size === packs.length,
    { message: "Pack names must be unique" }
  );

// Editing an item never touches quantity directly — quantity only ever
// changes through a stock_movements row (restock/sale/adjustment), so the
// audit trail stays intact. Use restockItem or an adjustment for quantity.
export const EditStockItemSchema = z.object({
  stock_item_id: z.string().uuid(),
  name: z.string().min(1, "Name is required").trim(),
  unit: z.string().trim().min(1).default("pcs"),
  cost_price: z.coerce.number().min(0, "Cost can't be negative").default(0),
  sell_price: z.coerce.number().min(0, "Price can't be negative").default(0),
  low_stock_threshold: z.coerce.number().min(0).default(5),
});

export const RestockSchema = z.object({
  stock_item_id: z.string().uuid("Invalid item"),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  unit_cost: z.coerce.number().min(0).optional(),
  pack_id: z.string().uuid().optional().nullable(),
});

// Corrects a mistake in stock quantity (typo, miscount, damage, loss) —
// distinct from restockItem (receiving new stock) and updateStockItem
// (editing item details). Still only ever writes a stock_movements row,
// never stock_items.quantity directly, so the audit trail stays intact.
// mode "set": merchant types the correct final quantity.
// mode "delta": merchant types a +/- amount to add or remove.
export const AdjustStockSchema = z.object({
  stock_item_id: z.string().uuid("Invalid item"),
  mode: z.enum(["set", "delta"]),
  value: z.coerce.number().min(0, "Enter a valid quantity"),
  direction: z.enum(["add", "remove"]).default("add"),
  note: z
    .string()
    .trim()
    .min(3, "Please explain the reason for this adjustment")
    .max(280, "Keep the reason under 280 characters"),
});

// ─── Orders ──────────────────────────────────────────────────────────────────

export const OrderItemSchema = z.object({
  stock_item_id: z.string().uuid(),
  quantity: z.coerce.number().positive(),
  unit_price: z.coerce.number().min(0),
});

export const CreateOrderSchema = z.object({
  customer_id: z.string().uuid().optional().nullable(),
  new_customer_name: z.string().trim().min(1).optional(),
  new_customer_phone: z.string().trim().optional(),
  sale_type: z.enum(["sale", "debt"]).default("sale"),
  payment_method: z.enum(["cash", "mtn", "orange"]).optional().nullable(),
  items: z.array(OrderItemSchema).min(1, "Add at least one item to the order"),
});

// ─── Session ─────────────────────────────────────────────────────────────────

export type SessionPayload = {
  merchantId: string;
  expiresAt: Date;
};

// ─── Admin Schemas ───────────────────────────────────────────────────────────

export const AdminLoginSchema = z.object({
  email: z.string().email("Invalid email address").trim(),
  password: z.string().min(6, "Password is too short").trim(),
});

export const AdminMerchantCreateSchema = RegisterSchema.extend({
  status: z.enum(["active", "suspended"]).default("active"),
});

export const SystemConfigSchema = z.object({
  default_currency: z.string().min(1).default("FCFA"),
  registration_open: z.boolean().default(true),
  maintenance_mode: z.boolean().default(false),
});

export type AdminSessionPayload = {
  adminId: string;
  role: "super_admin" | "admin";
  expiresAt: Date;
};

// ─── Action State ────────────────────────────────────────────────────────────

export type ActionState =
  | { errors?: Record<string, string[]>; message?: string }
  | undefined;

