import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, integer, timestamp, jsonb, boolean, index, unique, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const clothingItems = pgTable("clothing_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  nameAr: text("name_ar"),
  description: text("description"),
  categoryId: varchar("category_id").references(() => categories.id).notNull(),
  imageUrl: text("image_url"),
  userId: varchar("user_id").references(() => users.id).notNull(),
});

export const laundryServices = pgTable("laundry_services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  nameAr: text("name_ar"),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  categoryId: varchar("category_id").references(() => categories.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
});

export const itemServicePrices = pgTable(
  "item_service_prices",
  {
    clothingItemId: varchar("clothing_item_id")
      .references(() => clothingItems.id)
      .notNull(),
    serviceId: varchar("service_id")
      .references(() => laundryServices.id)
      .notNull(),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.clothingItemId, table.serviceId] }),
  }),
);

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  nameAr: text("name_ar"),
  description: text("description"),
  categoryId: varchar("category_id").references(() => categories.id),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  stock: integer("stock").notNull().default(0),
  imageUrl: text("image_url"),
  branchId: varchar("branch_id").references(() => branches.id).notNull(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  items: jsonb("items").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  sellerName: text("seller_name").notNull(),
  branchId: varchar("branch_id").references(() => branches.id).notNull(),
});

// Session storage table.
// (IMPORTANT) This table is mandatory for authentication, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username", { length: 50 }).unique().notNull(),
  email: varchar("email", { length: 255 }).unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  branchId: varchar("branch_id").references(() => branches.id),
  role: text("role").notNull().default('user'), // 'super_admin', 'admin', 'user'
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Categories table for organizing clothing items and services
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  nameAr: text("name_ar"),
  type: text("type").notNull(), // 'clothing' or 'service'
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
}, (table) => ({
  userNameUnique: unique("categories_user_id_name_unique").on(table.userId, table.name),
}));

// Branches table for store locations
export const branches = pgTable("branches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address"),
  phone: text("phone"),
});

// Customers table for customer management and pay-later tracking
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phoneNumber: varchar("phone_number", { length: 20 }).unique().notNull(),
  name: text("name").notNull(),
  nickname: text("nickname").unique(),
  email: varchar("email", { length: 255 }),
  address: text("address"),
  balanceDue: decimal("balance_due", { precision: 10, scale: 2 }).default("0.00").notNull(),
  totalSpent: decimal("total_spent", { precision: 10, scale: 2 }).default("0.00").notNull(),
  loyaltyPoints: integer("loyalty_points").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Orders table for order tracking
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: varchar("order_number", { length: 20 }).unique().notNull(),
  customerId: varchar("customer_id").references(() => customers.id),
  customerName: text("customer_name").notNull(),
  customerPhone: varchar("customer_phone", { length: 20 }).notNull(),
  items: jsonb("items").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(), // 'cash', 'card', 'pay_later'
  status: text("status").default("received").notNull(), // 'received', 'processing', 'washing', 'drying', 'ready', 'completed'
  estimatedPickup: timestamp("estimated_pickup"),
  actualPickup: timestamp("actual_pickup"),
  notes: text("notes"),
  sellerName: varchar("seller_name").notNull(),
  branchId: varchar("branch_id").references(() => branches.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orderPrints = pgTable(
  "order_prints",
  {
    orderId: varchar("order_id")
      .references(() => orders.id)
      .notNull(),
    printedAt: timestamp("printed_at").defaultNow().notNull(),
    printedBy: varchar("printed_by")
      .references(() => users.id)
      .notNull(),
    printNumber: integer("print_number").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.orderId, table.printNumber] }),
  }),
);

// Payment history for tracking customer payments
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  orderId: varchar("order_id").references(() => orders.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(),
  notes: text("notes"),
  receivedBy: varchar("received_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Notification audit trail
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id).notNull(),
  type: text("type").notNull(), // 'sms' or 'email'
  sentAt: timestamp("sent_at").defaultNow().notNull(),
});

// Security settings
export const securitySettings = pgTable("security_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionTimeout: integer("session_timeout").notNull().default(15),
  twoFactorRequired: boolean("two_factor_required").notNull().default(false),
  passwordPolicy: text("password_policy"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Loyalty points history for tracking accrual and redemption
export const loyaltyHistory = pgTable("loyalty_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  change: integer("change").notNull(), // positive for accrual, negative for redemption
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertClothingItemSchema = createInsertSchema(clothingItems).omit({
  id: true,
  userId: true,
});

export const insertLaundryServiceSchema = createInsertSchema(laundryServices)
  .omit({
    id: true,
    userId: true,
  })
  .extend({
    price: z
      .string()
      .regex(/^[0-9]+(\.[0-9]+)?$/, { message: "Price must be a valid number" }),
  });

export const insertItemServicePriceSchema = createInsertSchema(itemServicePrices);

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  branchId: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  orderNumber: true,
  createdAt: true,
  updatedAt: true,
  branchId: true,
});

export const insertOrderPrintSchema = createInsertSchema(orderPrints).omit({
  printedAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  sentAt: true,
});

export const insertSecuritySettingsSchema = createInsertSchema(securitySettings).omit({
  id: true,
  updatedAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  branchId: true,
});

export const insertLoyaltyHistorySchema = createInsertSchema(loyaltyHistory).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Schema for updating users where all fields are optional
export const updateUserSchema = insertUserSchema.partial();

export const insertCategorySchema = createInsertSchema(categories)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    userId: true,
  })
  .extend({
    userId: z.string().optional(),
  });

export const insertBranchSchema = createInsertSchema(branches).omit({
  id: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type UpsertUser = typeof users.$inferInsert;
export type ClothingItem = typeof clothingItems.$inferSelect;
export type InsertClothingItem = z.infer<typeof insertClothingItemSchema>;
export type LaundryService = typeof laundryServices.$inferSelect;
export type InsertLaundryService = z.infer<typeof insertLaundryServiceSchema>;
export type ItemServicePrice = typeof itemServicePrices.$inferSelect;
export type InsertItemServicePrice = z.infer<typeof insertItemServicePriceSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Branch = typeof branches.$inferSelect;
export type InsertBranch = z.infer<typeof insertBranchSchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderPrint = typeof orderPrints.$inferSelect;
export type InsertOrderPrint = z.infer<typeof insertOrderPrintSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type LoyaltyHistory = typeof loyaltyHistory.$inferSelect;
export type InsertLoyaltyHistory = z.infer<typeof insertLoyaltyHistorySchema>;
export type SecuritySettings = typeof securitySettings.$inferSelect;
export type InsertSecuritySettings = z.infer<typeof insertSecuritySettingsSchema>;
export type UserWithBranch = User & { branch: Branch | null };

export const bulkUploadResultSchema = z.object({
  processed: z.number(),
  created: z.number(),
  updated: z.number(),
});

export type BulkUploadResult = z.infer<typeof bulkUploadResultSchema>;

export interface LaundryCartItem {
  id: string;
  clothingItem: ClothingItem;
  service: LaundryService;
  quantity: number;
  total: number;
}

export interface CartItem {
  id: string;
  name: string;
  nameAr?: string;
  price: number;
  quantity: number;
  total: number;
  imageUrl?: string;
}

export interface LaundryCartSummary {
  items: LaundryCartItem[];
  subtotal: number;
  tax: number;
  total: number;
  itemCount: number;
}

export interface CartSummary {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  itemCount: number;
}
