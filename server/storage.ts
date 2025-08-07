import { 
  type ClothingItem, type InsertClothingItem, 
  type LaundryService, type InsertLaundryService,
  type Transaction, type InsertTransaction,
  type User, type InsertUser, type UpsertUser, type UserWithBranch,
  type Category, type InsertCategory,
  type Branch, type InsertBranch,
  type Customer, type InsertCustomer,
  type Order, type InsertOrder,
  type OrderPrint,
  type Payment, type InsertPayment,
  type Product, type InsertProduct,
  type LoyaltyHistory, type InsertLoyaltyHistory,
  type Notification, type InsertNotification,
  type SecuritySettings, type InsertSecuritySettings,
  type ItemServicePrice, type InsertItemServicePrice,
  type BulkUploadResult,
  clothingItems, laundryServices, itemServicePrices,
  transactions, users, categories, branches, customers, orders, orderPrints, payments, products, loyaltyHistory, notifications, securitySettings
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, sql, and, inArray, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";
import {
  CATEGORY_SEEDS,
  mapClothingItemSeeds,
  mapLaundryServiceSeeds,
} from "./seed-data";
import { PRICE_MATRIX } from "./seed-prices";

const PAY_LATER_AGGREGATE = `
  SELECT order_id, SUM(amount::numeric) AS amount
  FROM payments
  GROUP BY order_id
`;

export interface ParsedRow {
  itemEn: string;
  itemAr?: string;
  normalIron?: number;
  normalWash?: number;
  normalWashIron?: number;
  urgentIron?: number;
  urgentWash?: number;
  urgentWashIron?: number;
  imageUrl?: string;
}

export interface IStorage {
  // User operations
  getUser(id: string): Promise<UserWithBranch | undefined>;
  getUserByUsername(username: string): Promise<UserWithBranch | undefined>;
  createUser(user: InsertUser): Promise<UserWithBranch>;
  upsertUser(user: UpsertUser): Promise<UserWithBranch>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<UserWithBranch | undefined>;
  updateUserProfile(
    id: string,
    user: Partial<Pick<InsertUser, "firstName" | "lastName" | "email">>,
  ): Promise<UserWithBranch | undefined>;
  updateUserPassword(id: string, password: string): Promise<UserWithBranch | undefined>;
  updateUserBranch(id: string, branchId: string | null): Promise<UserWithBranch | undefined>;
  getUsers(): Promise<UserWithBranch[]>;
  
  // Category operations
  getCategories(userId: string): Promise<Category[]>;
  getCategoriesByType(type: string, userId: string): Promise<Category[]>;
  getCategory(id: string, userId: string): Promise<Category | undefined>;
  createCategory(
    category: Omit<InsertCategory, "userId">,
    userId: string,
  ): Promise<Category>;
  updateCategory(
    id: string,
    category: Partial<Omit<InsertCategory, "userId">>,
    userId: string,
  ): Promise<Category | undefined>;
  deleteCategory(id: string, userId: string): Promise<boolean>;

  // Branch operations
  getBranches(): Promise<Branch[]>;
  getBranch(id: string): Promise<Branch | undefined>;
  createBranch(branch: InsertBranch): Promise<Branch>;
  updateBranch(id: string, branch: Partial<InsertBranch>): Promise<Branch | undefined>;
  deleteBranch(id: string): Promise<boolean>;

  // Products
  getProducts(branchId?: string): Promise<Product[]>;
  getProductsByCategory(categoryId: string, branchId?: string): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct & { branchId: string }): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>, branchId: string): Promise<Product | undefined>;

  // Clothing Items
  getClothingItems(userId: string): Promise<ClothingItem[]>;
  getClothingItemsByCategory(categoryId: string, userId: string): Promise<ClothingItem[]>;
  getClothingItem(id: string, userId: string): Promise<ClothingItem | undefined>;
  createClothingItem(item: InsertClothingItem & { userId: string }): Promise<ClothingItem>;
  updateClothingItem(id: string, item: Partial<InsertClothingItem>, userId: string): Promise<ClothingItem | undefined>;
  deleteClothingItem(id: string, userId: string): Promise<boolean>;

  // Laundry Services
  getLaundryServices(userId: string): Promise<LaundryService[]>;
  getLaundryServicesByCategory(categoryId: string, userId: string): Promise<LaundryService[]>;
  getLaundryService(id: string, userId: string): Promise<LaundryService | undefined>;
  createLaundryService(service: InsertLaundryService & { userId: string }): Promise<LaundryService>;
  updateLaundryService(id: string, service: Partial<InsertLaundryService>, userId: string): Promise<LaundryService | undefined>;
  deleteLaundryService(id: string, userId: string): Promise<boolean>;

  // Item-service prices
  getServicesForClothingItem(
    clothingItemId: string,
    userId: string,
    categoryId?: string,
  ): Promise<(LaundryService & { itemPrice: string })[]>;
  createItemServicePrice(data: InsertItemServicePrice): Promise<ItemServicePrice>;
  updateItemServicePrice(
    clothingItemId: string,
    serviceId: string,
    price: string,
  ): Promise<ItemServicePrice | undefined>;
  deleteItemServicePrice(clothingItemId: string, serviceId: string): Promise<boolean>;

  // Bulk catalog
  bulkUpsertUserCatalog(
    userId: string,
    rows: ParsedRow[],
  ): Promise<BulkUploadResult>;
  bulkUpsertBranchCatalog(branchId: string, rows: ParsedRow[]): Promise<BulkUploadResult>;
  
  // Transactions
  createTransaction(transaction: InsertTransaction & { branchId: string }): Promise<Transaction>;
  getTransactions(branchId?: string): Promise<Transaction[]>;
  getTransaction(id: string, branchId?: string): Promise<Transaction | undefined>;
  
  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomerByPhone(phoneNumber: string): Promise<Customer | undefined>;
  getCustomerByNickname(nickname: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  updateCustomerBalance(id: string, balanceChange: number): Promise<Customer | undefined>;
  
  // Orders
  getOrders(branchId?: string): Promise<Order[]>;
  getOrder(id: string, branchId?: string): Promise<Order | undefined>;
  getOrdersByCustomer(customerId: string, branchId?: string): Promise<Order[]>;
  getOrdersByStatus(status: string, branchId?: string): Promise<Order[]>;
  createOrder(order: InsertOrder & { branchId: string }): Promise<Order>;
  updateOrder(id: string, order: Partial<Omit<Order, 'id' | 'orderNumber' | 'createdAt'>>): Promise<Order | undefined>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;

  // Order print history
  recordOrderPrint(orderId: string, printedBy: string): Promise<OrderPrint>;
  getOrderPrintHistory(orderId: string): Promise<OrderPrint[]>;

  // Payments
  getPayments(branchId?: string): Promise<Payment[]>;
  getPayment(id: string): Promise<Payment | undefined>;
  getPaymentsByCustomer(customerId: string, branchId?: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;

  // Notifications
  createNotification(notification: InsertNotification): Promise<Notification>;

  // Security settings
  getSecuritySettings(): Promise<SecuritySettings | undefined>;
  updateSecuritySettings(settings: InsertSecuritySettings): Promise<SecuritySettings>;

  // Loyalty history
  getLoyaltyHistory(customerId: string): Promise<LoyaltyHistory[]>;
  createLoyaltyHistory(entry: InsertLoyaltyHistory): Promise<LoyaltyHistory>;

  // Reports
  getOrderStats(range: string, branchId?: string): Promise<{ period: string; count: number; revenue: number }[]>;
  getTopServices(range: string, branchId?: string): Promise<{ service: string; count: number; revenue: number }[]>;
  getTopProducts(range: string, branchId?: string): Promise<{ product: string; count: number; revenue: number }[]>;
  getSalesSummary(range: string, branchId?: string): Promise<{
    totalOrders: number;
    totalRevenue: number;
    stats: { period: string; count: number; revenue: number }[];
  }>;
}

export class MemStorage {
  private products: Map<string, Product>;
  private clothingItems: Map<string, ClothingItem>;
  private laundryServices: Map<string, LaundryService>;
  private itemServicePrices: Map<string, Map<string, ItemServicePrice>>;
  private transactions: Map<string, Transaction>;
  private users: Map<string, User>;
  private categories: Map<string, Category>;
   private branches: Map<string, Branch>;
  private loyaltyHistory: LoyaltyHistory[];
  private notifications: Notification[];
  private orderPrints: OrderPrint[];
  private securitySettings: SecuritySettings;

  constructor() {
    this.products = new Map();
    this.clothingItems = new Map();
    this.laundryServices = new Map();
    this.itemServicePrices = new Map();
    this.transactions = new Map();
    this.users = new Map();
    this.categories = new Map();
    this.branches = new Map();
    this.loyaltyHistory = [];
    this.notifications = [];
    this.orderPrints = [];
    this.securitySettings = {
      id: "default",
      sessionTimeout: 15,
      twoFactorRequired: false,
      passwordPolicy: "",
      updatedAt: new Date(),
    };
    this.initializeData();
  }

  private initializeData() {
    // Initialize products
    const initialProducts: InsertProduct[] = [
      {
        name: "Cola",
        description: "Refreshing soda drink",
        categoryId: "beverages",
        price: "1.99",
        stock: 50,
        imageUrl: "https://images.unsplash.com/photo-1580910051074-7bc38a51a79f?auto=format&fit=crop&w=300&h=200"
      },
      {
        name: "Potato Chips",
        description: "Crispy salted chips",
        categoryId: "snacks",
        price: "2.49",
        stock: 40,
        imageUrl: "https://images.unsplash.com/photo-1585238342029-5a9b9e8e7044?auto=format&fit=crop&w=300&h=200"
      },
      {
        name: "Wireless Earbuds",
        description: "Bluetooth in-ear headphones",
        categoryId: "electronics",
        price: "59.99",
        stock: 25,
        imageUrl: "https://images.unsplash.com/photo-1585386959984-a41552231685?auto=format&fit=crop&w=300&h=200"
      },
      {
        name: "Instant Noodles",
        description: "Quick and tasty meal",
        categoryId: "food",
        price: "0.99",
        stock: 80,
        imageUrl: "https://images.unsplash.com/photo-1617196033361-c2d0cf79ab8f?auto=format&fit=crop&w=300&h=200"
      },
      {
        name: "Dish Soap",
        description: "Lemon scented detergent",
        categoryId: "household",
        price: "3.49",
        stock: 60,
        imageUrl: "https://images.unsplash.com/photo-1602161414263-5a8d5449475a?auto=format&fit=crop&w=300&h=200"
      }
    ];

    initialProducts.forEach(product => {
      this.createProduct({ ...product, branchId: "default" });
    });

    // Initialize clothing items
    const initialClothingItems: InsertClothingItem[] = [
      {
        name: "Pants",
        description: "Regular trousers",
        categoryId: "pants",
        imageUrl: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200"
      },
      {
        name: "Dishdasha",
        description: "Traditional long robe",
        categoryId: "traditional",
        imageUrl: "https://images.unsplash.com/photo-1594069037019-f3ab4b0e6a21?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200"
      },
      {
        name: "Shirt",
        description: "Dress shirt or casual shirt",
        categoryId: "shirts",
        imageUrl: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200"
      },
      {
        name: "Dress",
        description: "Ladies dress",
        categoryId: "dresses",
        imageUrl: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200"
      },
      {
        name: "Suit Jacket",
        description: "Formal jacket",
        categoryId: "formal",
        imageUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200"
      },
      {
        name: "Bed Sheets",
        description: "Full set of bed linens",
        categoryId: "linens",
        imageUrl: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200"
      }
    ];

    // Initialize laundry services
    const initialLaundryServices: InsertLaundryService[] = [
      {
        name: "Wash & Fold",
        description: "Basic washing and folding service",
        price: "3.00",
        categoryId: "basic"
      },
      {
        name: "Dry Cleaning",
        description: "Professional dry cleaning",
        price: "8.00",
        categoryId: "premium"
      },
      {
        name: "Iron & Press",
        description: "Professional ironing and pressing",
        price: "4.50",
        categoryId: "basic"
      },
      {
        name: "Stain Removal",
        description: "Specialized stain treatment",
        price: "6.00",
        categoryId: "specialty"
      },
      {
        name: "Express Service",
        description: "Same day service",
        price: "12.00",
        categoryId: "express"
      },
      {
        name: "Delicate Care",
        description: "Special care for delicate items",
        price: "10.00",
        categoryId: "specialty"
      }
    ];

    const defaultUser = "mem-user";
    initialClothingItems.forEach(item => {
      this.createClothingItem({ ...item, userId: defaultUser });
    });

    initialLaundryServices.forEach(service => {
      this.createLaundryService({ ...service, userId: defaultUser });
    });
  }

  // Product methods
  async getProducts(branchId?: string): Promise<Product[]> {
    return Array.from(this.products.values()).filter(p => !branchId || p.branchId === branchId);
  }

  async getProductsByCategory(categoryId: string, branchId?: string): Promise<Product[]> {
    return Array.from(this.products.values()).filter(product => {
      if (categoryId !== "all" && product.categoryId !== categoryId) return false;
      if (branchId && product.branchId !== branchId) return false;
      return true;
    });
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(product: InsertProduct & { branchId: string }): Promise<Product> {
    const id = randomUUID();
    const newProduct: Product = {
      id,
      name: product.name,
      nameAr: product.nameAr || null,
      description: product.description || null,
      categoryId: product.categoryId || null,
      price: product.price,
      stock: product.stock ?? 0,
      imageUrl: product.imageUrl || null,
      branchId: product.branchId,
    };
    this.products.set(id, newProduct);
    return newProduct;
  }

  async updateProduct(
    id: string,
    product: Partial<InsertProduct>,
    branchId: string,
  ): Promise<Product | undefined> {
    const existing = this.products.get(id);
    if (!existing || existing.branchId !== branchId) return undefined;

    const updated: Product = {
      ...existing,
      name: product.name ?? existing.name,
      nameAr: product.nameAr ?? existing.nameAr,
      description: product.description ?? existing.description,
      categoryId: product.categoryId ?? existing.categoryId,
      price: product.price ?? existing.price,
      stock: product.stock ?? existing.stock,
      imageUrl: product.imageUrl ?? existing.imageUrl,
      branchId: existing.branchId,
    };
    this.products.set(id, updated);
    return updated;
  }

  // Clothing Items methods
  async getClothingItems(): Promise<ClothingItem[]> {
    return Array.from(this.clothingItems.values());
  }

  async getClothingItemsByCategory(categoryId: string): Promise<ClothingItem[]> {
    if (categoryId === "all") {
      return this.getClothingItems();
    }
    return Array.from(this.clothingItems.values()).filter(item => item.categoryId === categoryId);
  }

  async getClothingItem(id: string): Promise<ClothingItem | undefined> {
    return this.clothingItems.get(id);
  }

  async createClothingItem(item: InsertClothingItem & { userId: string }): Promise<ClothingItem> {
    const id = randomUUID();
    const newItem: ClothingItem = {
      id,
      name: item.name,
      nameAr: item.nameAr || null,
      description: item.description || null,
      categoryId: item.categoryId,
      imageUrl: item.imageUrl || null,
      userId: item.userId,
    };
    this.clothingItems.set(id, newItem);

    // Initialize item-service prices with default values for all existing services
    const map = new Map<string, ItemServicePrice>();
    for (const service of this.laundryServices.values()) {
      map.set(service.id, {
        clothingItemId: id,
        serviceId: service.id,
        price: "0.00",
      });
    }
    if (map.size > 0) {
      this.itemServicePrices.set(id, map);
    }

    return newItem;
  }

  async updateClothingItem(id: string, item: Partial<InsertClothingItem>): Promise<ClothingItem | undefined> {
    const existing = this.clothingItems.get(id);
    if (!existing) return undefined;

    const updated: ClothingItem = {
      ...existing,
      name: item.name ?? existing.name,
      nameAr: item.nameAr ?? existing.nameAr,
      description: item.description ?? existing.description,
      categoryId: item.categoryId ?? existing.categoryId,
      imageUrl: item.imageUrl ?? existing.imageUrl
    };
    this.clothingItems.set(id, updated);
    return updated;
  }

  async deleteClothingItem(id: string): Promise<boolean> {
    return this.clothingItems.delete(id);
  }

  // Laundry Services methods
  async getLaundryServices(): Promise<LaundryService[]> {
    return Array.from(this.laundryServices.values());
  }

  async getLaundryServicesByCategory(categoryId: string): Promise<LaundryService[]> {
    if (categoryId === "all") {
      return this.getLaundryServices();
    }
    return Array.from(this.laundryServices.values()).filter(service => service.categoryId === categoryId);
  }

  async getLaundryService(id: string): Promise<LaundryService | undefined> {
    return this.laundryServices.get(id);
  }

  async createLaundryService(service: InsertLaundryService & { userId: string }): Promise<LaundryService> {
    const id = randomUUID();
    const newService: LaundryService = {
      id,
      name: service.name,
      nameAr: service.nameAr || null,
      description: service.description || null,
      price: service.price,
      categoryId: service.categoryId,
      userId: service.userId,
    };
    this.laundryServices.set(id, newService);
    return newService;
  }

  async updateLaundryService(id: string, service: Partial<InsertLaundryService>): Promise<LaundryService | undefined> {
    const existing = this.laundryServices.get(id);
    if (!existing) return undefined;

    const updated: LaundryService = {
      ...existing,
      name: service.name ?? existing.name,
      nameAr: service.nameAr ?? existing.nameAr,
      description: service.description ?? existing.description,
      price: service.price ?? existing.price,
      categoryId: service.categoryId ?? existing.categoryId
    };
    this.laundryServices.set(id, updated);
    return updated;
  }

  async deleteLaundryService(id: string): Promise<boolean> {
    return this.laundryServices.delete(id);
  }

  async getServicesForClothingItem(
    clothingItemId: string,
    _userId: string,
    categoryId?: string,
  ): Promise<(LaundryService & { itemPrice: string })[]> {
    const serviceMap = this.itemServicePrices.get(clothingItemId);
    const services: (LaundryService & { itemPrice: string })[] = [];
    for (const service of this.laundryServices.values()) {
      if (categoryId && service.categoryId !== categoryId) continue;
      const itemPrice = serviceMap?.get(service.id)?.price ?? service.price;
      services.push({ ...service, itemPrice });
    }
    return services;
  }

  async createItemServicePrice(data: InsertItemServicePrice): Promise<ItemServicePrice> {
    const map = this.itemServicePrices.get(data.clothingItemId) ?? new Map();
    const record: ItemServicePrice = { ...data };
    map.set(data.serviceId, record);
    this.itemServicePrices.set(data.clothingItemId, map);
    return record;
  }

  async updateItemServicePrice(
    clothingItemId: string,
    serviceId: string,
    price: string,
  ): Promise<ItemServicePrice | undefined> {
    const map = this.itemServicePrices.get(clothingItemId);
    if (!map) return undefined;
    const existing = map.get(serviceId);
    if (!existing) return undefined;
    const updated = { ...existing, price };
    map.set(serviceId, updated);
    return updated;
  }

  async deleteItemServicePrice(clothingItemId: string, serviceId: string): Promise<boolean> {
    const map = this.itemServicePrices.get(clothingItemId);
    if (!map) return false;
    const deleted = map.delete(serviceId);
    if (map.size === 0) this.itemServicePrices.delete(clothingItemId);
    return deleted;
  }

  async createTransaction(insertTransaction: InsertTransaction & { branchId: string }): Promise<Transaction> {
    const id = randomUUID();
    const transaction: Transaction = {
      ...insertTransaction,
      id,
      createdAt: new Date()
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async getTransactions(branchId?: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(t => !branchId || t.branchId === branchId);
  }

  async getTransaction(id: string, branchId?: string): Promise<Transaction | undefined> {
    const tx = this.transactions.get(id);
    if (!tx) return undefined;
    if (branchId && tx.branchId !== branchId) return undefined;
    return tx;
  }

  async recordOrderPrint(orderId: string, printedBy: string): Promise<OrderPrint> {
    const next = this.orderPrints.filter(p => p.orderId === orderId).length + 1;
    const record: OrderPrint = {
      orderId,
      printedAt: new Date(),
      printedBy,
      printNumber: next,
    };
    this.orderPrints.push(record);
    return record;
  }

  async getOrderPrintHistory(orderId: string): Promise<OrderPrint[]> {
    return this.orderPrints.filter(p => p.orderId === orderId);
  }

  async getLoyaltyHistory(customerId: string): Promise<LoyaltyHistory[]> {
    return this.loyaltyHistory.filter(h => h.customerId === customerId);
  }

  async createLoyaltyHistory(entry: InsertLoyaltyHistory): Promise<LoyaltyHistory> {
    const record: LoyaltyHistory = {
      ...entry,
      id: randomUUID(),
      description: entry.description ?? null,
      createdAt: new Date(),
    };
    this.loyaltyHistory.push(record);
    return record;
  }

  async createNotification(entry: InsertNotification): Promise<Notification> {
    const record: Notification = {
      ...entry,
      id: randomUUID(),
      sentAt: new Date(),
    };
    this.notifications.push(record);
    return record;
  }

  async getSecuritySettings(): Promise<SecuritySettings | undefined> {
    return this.securitySettings;
  }

  async updateSecuritySettings(settings: InsertSecuritySettings): Promise<SecuritySettings> {
    this.securitySettings = {
      ...this.securitySettings,
      ...settings,
      updatedAt: new Date(),
    };
    return this.securitySettings;
  }

  // User methods (stub for MemStorage - not used in production)
  async getUser(id: string): Promise<UserWithBranch | undefined> { return undefined; }
  async getUserByUsername(username: string): Promise<UserWithBranch | undefined> { return undefined; }
  async createUser(user: InsertUser): Promise<UserWithBranch> { throw new Error("Not implemented in MemStorage"); }
  async upsertUser(user: UpsertUser): Promise<UserWithBranch> { throw new Error("Not implemented in MemStorage"); }
  async updateUser(id: string, user: Partial<InsertUser>): Promise<UserWithBranch | undefined> { return undefined; }
  async updateUserProfile(id: string, user: Partial<Pick<InsertUser, "firstName" | "lastName" | "email">>): Promise<UserWithBranch | undefined> { return undefined; }
  async updateUserPassword(id: string, password: string): Promise<UserWithBranch | undefined> { return undefined; }
  async updateUserBranch(id: string, branchId: string | null): Promise<UserWithBranch | undefined> { return undefined; }
  async getUsers(): Promise<UserWithBranch[]> { return []; }

  // Category methods (stub for MemStorage - not used in production)
  async getCategories(_userId: string): Promise<Category[]> { return []; }
  async getCategoriesByType(_type: string, _userId: string): Promise<Category[]> { return []; }
  async getCategory(_id: string, _userId: string): Promise<Category | undefined> { return undefined; }
  async createCategory(
    _category: Omit<InsertCategory, "userId">,
    _userId: string,
  ): Promise<Category> {
    throw new Error("Not implemented in MemStorage");
  }
  async updateCategory(
    _id: string,
    _category: Partial<Omit<InsertCategory, "userId">>,
    _userId: string,
  ): Promise<Category | undefined> {
    return undefined;
  }
  async deleteCategory(_id: string, _userId: string): Promise<boolean> { return false; }

  // Branch methods (stub for MemStorage - not used in production)
  async getBranches(): Promise<Branch[]> { return []; }
  async getBranch(id: string): Promise<Branch | undefined> { return undefined; }
  async createBranch(branch: InsertBranch): Promise<Branch> { throw new Error("Not implemented in MemStorage"); }
  async updateBranch(id: string, branch: Partial<InsertBranch>): Promise<Branch | undefined> { return undefined; }
  async deleteBranch(id: string): Promise<boolean> { return false; }
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<UserWithBranch | undefined> {
    const [result] = await db
      .select({ user: users, branch: branches })
      .from(users)
      .leftJoin(branches, eq(users.branchId, branches.id))
      .where(eq(users.id, id));
    if (!result) return undefined;
    return { ...result.user, branch: result.branch };
  }

  async getUserByUsername(username: string): Promise<UserWithBranch | undefined> {
    const [result] = await db
      .select({ user: users, branch: branches })
      .from(users)
      .leftJoin(branches, eq(users.branchId, branches.id))
      .where(eq(users.username, username));
    if (!result) return undefined;
    return { ...result.user, branch: result.branch };
  }

  private async initializeUserCatalog(userId: string): Promise<void> {
    await db.transaction(async (tx) => {
      const allCategories = CATEGORY_SEEDS.map((c) => ({ ...c, userId }));
      await tx.insert(categories).values(allCategories).onConflictDoNothing();

      const categoryRows = await tx
        .select()
        .from(categories)
        .where(
          and(
            eq(categories.userId, userId),
            inArray(
              categories.name,
              CATEGORY_SEEDS.map((c) => c.name),
            ),
          ),
        );
      const categoryMap = Object.fromEntries(categoryRows.map((c) => [c.name, c.id]));

      const clothingSeeds = mapClothingItemSeeds(categoryMap).map((i) => ({
        ...i,
        userId,
      }));
      await tx
        .insert(clothingItems)
        .values(clothingSeeds as (InsertClothingItem & { userId: string })[])
        .onConflictDoNothing();

      const serviceSeeds = mapLaundryServiceSeeds(categoryMap).map((s) => ({
        ...s,
        userId,
      }));
      await tx.insert(laundryServices).values(serviceSeeds).onConflictDoNothing();

      const clothingRows = await tx
        .select()
        .from(clothingItems)
        .where(eq(clothingItems.userId, userId));
      const serviceRowsDb = await tx
        .select()
        .from(laundryServices)
        .where(eq(laundryServices.userId, userId));
      const clothingMap = Object.fromEntries(clothingRows.map((c) => [c.name, c.id]));
      const serviceMap = Object.fromEntries(serviceRowsDb.map((s) => [s.name, s.id]));

      const priceRows = PRICE_MATRIX.flatMap((item) =>
        Object.entries(item.prices).map(([serviceName, price]) => ({
          clothingItemId: clothingMap[item.name],
          serviceId: serviceMap[serviceName],
          price: price.toFixed(2),
        })),
      );

      await tx.insert(itemServicePrices).values(priceRows).onConflictDoNothing();
    });
  }

  async createUser(userData: InsertUser): Promise<UserWithBranch> {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(userData.passwordHash, saltRounds);

    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        passwordHash: hashedPassword,
      })
      .returning();
    await this.initializeUserCatalog(user.id);
    return (await this.getUser(user.id))!;
  }

  async upsertUser(userData: UpsertUser): Promise<UserWithBranch> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.username,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return (await this.getUser(user.id))!;
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<UserWithBranch | undefined> {
    const updateData = { ...userData } as Partial<InsertUser>;

    if ("passwordHash" in updateData) {
      if (typeof updateData.passwordHash !== "string") {
        throw new Error("passwordHash must be a non-empty string");
      }
      if (updateData.passwordHash) {
        const saltRounds = 10;
        updateData.passwordHash = await bcrypt.hash(updateData.passwordHash, saltRounds);
      } else {
        delete updateData.passwordHash;
      }
    }

    const [updated] = await db
      .update(users)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    if (!updated) return undefined;
    return await this.getUser(updated.id);
  }

  async updateUserProfile(
    id: string,
    data: Partial<Pick<InsertUser, "firstName" | "lastName" | "email">>,
  ): Promise<UserWithBranch | undefined> {
    const [updated] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    if (!updated) return undefined;
    return await this.getUser(updated.id);
  }

  async updateUserPassword(id: string, password: string): Promise<UserWithBranch | undefined> {
    const hashed = await bcrypt.hash(password, 10);
    const [updated] = await db
      .update(users)
      .set({ passwordHash: hashed, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    if (!updated) return undefined;
    return await this.getUser(updated.id);
  }

  async updateUserBranch(id: string, branchId: string | null): Promise<UserWithBranch | undefined> {
    const [updated] = await db
      .update(users)
      .set({ branchId, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    if (!updated) return undefined;
    return await this.getUser(updated.id);
  }

  async getUsers(): Promise<UserWithBranch[]> {
    const results = await db
      .select({ user: users, branch: branches })
      .from(users)
      .leftJoin(branches, eq(users.branchId, branches.id));
    return results.map((r) => ({ ...r.user, branch: r.branch }));
  }

  // Category methods
  async getCategories(userId: string): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.userId, userId));
  }

  async getCategoriesByType(type: string, userId: string): Promise<Category[]> {
    return await db
      .select()
      .from(categories)
      .where(and(eq(categories.type, type), eq(categories.userId, userId)));
  }

  async getCategory(id: string, userId: string): Promise<Category | undefined> {
    const [category] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)));
    return category || undefined;
  }

  async createCategory(
    categoryData: Omit<InsertCategory, "userId">,
    userId: string,
  ): Promise<Category> {
    const { name, nameAr, type, description, isActive } = categoryData;
    const [category] = await db
      .insert(categories)
      .values({ name, nameAr, type, description, isActive, userId })
      .returning();
    return category;
  }

  async updateCategory(
    id: string,
    categoryData: Partial<Omit<InsertCategory, "userId">>,
    userId: string,
  ): Promise<Category | undefined> {
    const { name, nameAr, type, description, isActive } = categoryData;
    const [updated] = await db
      .update(categories)
      .set({ name, nameAr, type, description, isActive, updatedAt: new Date() })
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .returning();
    return updated || undefined;
  }

  async deleteCategory(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Branch methods
  async getBranches(): Promise<Branch[]> {
    return await db.select().from(branches);
  }

  async getBranch(id: string): Promise<Branch | undefined> {
    const [branch] = await db.select().from(branches).where(eq(branches.id, id));
    return branch || undefined;
  }

  async createBranch(branchData: InsertBranch): Promise<Branch> {
    const [branch] = await db.insert(branches).values(branchData).returning();
    return branch;
  }

  async updateBranch(id: string, branchData: Partial<InsertBranch>): Promise<Branch | undefined> {
    const [updated] = await db
      .update(branches)
      .set(branchData)
      .where(eq(branches.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteBranch(id: string): Promise<boolean> {
    const result = await db.delete(branches).where(eq(branches.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Product methods
  async getProducts(branchId?: string): Promise<Product[]> {
    if (branchId) {
      return await db.select().from(products).where(eq(products.branchId, branchId));
    }
    return await db.select().from(products);
  }

  async getProductsByCategory(categoryId: string, branchId?: string): Promise<Product[]> {
    if (categoryId === "all") {
      return this.getProducts(branchId);
    }
    const conditions = [eq(products.categoryId, categoryId)];
    if (branchId) conditions.push(eq(products.branchId, branchId));
    return await db.select().from(products).where(and(...conditions));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async createProduct(productData: InsertProduct & { branchId: string }): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values(productData)
      .returning();
    return product;
  }

  async updateProduct(
    id: string,
    productData: Partial<InsertProduct>,
    branchId: string,
  ): Promise<Product | undefined> {
    const [updated] = await db
      .update(products)
      .set(productData)
      .where(and(eq(products.id, id), eq(products.branchId, branchId)))
      .returning();
    return updated || undefined;
  }

  // Clothing Items methods
  async getClothingItems(userId: string): Promise<ClothingItem[]> {
    return await db.select().from(clothingItems).where(eq(clothingItems.userId, userId));
  }

  async getClothingItemsByCategory(categoryId: string, userId: string): Promise<ClothingItem[]> {
    if (categoryId === "all") {
      return this.getClothingItems(userId);
    }
    return await db
      .select()
      .from(clothingItems)
      .where(and(eq(clothingItems.categoryId, categoryId), eq(clothingItems.userId, userId)));
  }

  async getClothingItem(id: string, userId: string): Promise<ClothingItem | undefined> {
    const [item] = await db
      .select()
      .from(clothingItems)
      .where(and(eq(clothingItems.id, id), eq(clothingItems.userId, userId)));
    return item || undefined;
  }

  async createClothingItem(item: InsertClothingItem & { userId: string }): Promise<ClothingItem> {
    return await db.transaction(async (tx) => {
      const [newItem] = await tx.insert(clothingItems).values(item).returning();
      const services = await tx
        .select()
        .from(laundryServices)
        .where(eq(laundryServices.userId, item.userId));
      if (services.length > 0) {
        const priceRows = services.map((s) => ({
          clothingItemId: newItem.id,
          serviceId: s.id,
          price: "0.00",
        }));
        await tx.insert(itemServicePrices).values(priceRows).onConflictDoNothing();
      }
      return newItem;
    });
  }

  async updateClothingItem(
    id: string,
    item: Partial<InsertClothingItem>,
    userId: string,
  ): Promise<ClothingItem | undefined> {
    const [updated] = await db
      .update(clothingItems)
      .set(item)
      .where(and(eq(clothingItems.id, id), eq(clothingItems.userId, userId)))
      .returning();
    return updated || undefined;
  }

  async deleteClothingItem(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(clothingItems)
      .where(and(eq(clothingItems.id, id), eq(clothingItems.userId, userId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Laundry Services methods
  async getLaundryServices(userId: string): Promise<LaundryService[]> {
    return await db.select().from(laundryServices).where(eq(laundryServices.userId, userId));
  }

  async getLaundryServicesByCategory(categoryId: string, userId: string): Promise<LaundryService[]> {
    if (categoryId === "all") {
      return this.getLaundryServices(userId);
    }
    return await db
      .select()
      .from(laundryServices)
      .where(and(eq(laundryServices.categoryId, categoryId), eq(laundryServices.userId, userId)));
  }

  async getLaundryService(id: string, userId: string): Promise<LaundryService | undefined> {
    const [service] = await db
      .select()
      .from(laundryServices)
      .where(and(eq(laundryServices.id, id), eq(laundryServices.userId, userId)));
    return service || undefined;
  }

  async createLaundryService(service: InsertLaundryService & { userId: string }): Promise<LaundryService> {
    const [newService] = await db.insert(laundryServices).values(service).returning();
    return newService;
  }

  async updateLaundryService(
    id: string,
    service: Partial<InsertLaundryService>,
    userId: string,
  ): Promise<LaundryService | undefined> {
    const [updated] = await db
      .update(laundryServices)
      .set(service)
      .where(and(eq(laundryServices.id, id), eq(laundryServices.userId, userId)))
      .returning();
    return updated || undefined;
  }

  async deleteLaundryService(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(laundryServices)
      .where(and(eq(laundryServices.id, id), eq(laundryServices.userId, userId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getServicesForClothingItem(
    clothingItemId: string,
    userId: string,
    categoryId?: string,
  ): Promise<(LaundryService & { itemPrice: string })[]> {
    const conditions: any[] = [
      eq(laundryServices.userId, userId),
      eq(clothingItems.userId, userId),
    ];
    if (categoryId && categoryId !== "all") {
      conditions.push(eq(laundryServices.categoryId, categoryId));
    }

    const rows = await db
      .select({
        id: laundryServices.id,
        name: laundryServices.name,
        nameAr: laundryServices.nameAr,
        description: laundryServices.description,
        categoryId: laundryServices.categoryId,
        price: laundryServices.price,
        userId: laundryServices.userId,
        itemPrice: sql`COALESCE(${itemServicePrices.price}, ${laundryServices.price})`,
      })
      .from(laundryServices)
      .leftJoin(
        itemServicePrices,
        and(
          eq(itemServicePrices.serviceId, laundryServices.id),
          eq(itemServicePrices.clothingItemId, clothingItemId),
        ),
      )
      .innerJoin(clothingItems, eq(clothingItems.id, clothingItemId))
      .where(and(...conditions));

    return rows;
  }

  async createItemServicePrice(data: InsertItemServicePrice): Promise<ItemServicePrice> {
    const [row] = await db.insert(itemServicePrices).values(data).returning();
    return row;
  }

  async updateItemServicePrice(
    clothingItemId: string,
    serviceId: string,
    price: string,
  ): Promise<ItemServicePrice | undefined> {
    const [row] = await db
      .update(itemServicePrices)
      .set({ price })
      .where(
        and(
          eq(itemServicePrices.clothingItemId, clothingItemId),
          eq(itemServicePrices.serviceId, serviceId),
        ),
      )
      .returning();
    return row || undefined;
  }

  async deleteItemServicePrice(clothingItemId: string, serviceId: string): Promise<boolean> {
    const result = await db
      .delete(itemServicePrices)
      .where(
        and(
          eq(itemServicePrices.clothingItemId, clothingItemId),
          eq(itemServicePrices.serviceId, serviceId),
        ),
      );
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async bulkUpsertUserCatalog(
    userId: string,
    rows: ParsedRow[],
  ): Promise<BulkUploadResult> {
    let created = 0;
    let updated = 0;

    await db.transaction(async (tx) => {
      const existingCategories = await tx
        .select()
        .from(categories)
        .where(eq(categories.userId, userId));
      const catMap = new Map(existingCategories.map((c) => [c.name, c.id]));

      const requiredCategories = [
        { name: "Normal Iron", type: "service" },
        { name: "Normal Wash", type: "service" },
        { name: "Normal Wash & Iron", type: "service" },
        { name: "Urgent Iron", type: "service" },
        { name: "Urgent Wash", type: "service" },
        { name: "Urgent Wash & Iron", type: "service" },
        { name: "Clothing Items", type: "clothing" },
      ];

      for (const cat of requiredCategories) {
        if (!catMap.has(cat.name)) {
          const [inserted] = await tx
            .insert(categories)
            .values({
              name: cat.name,
              type: cat.type,
              isActive: true,
              userId,
            })
            .returning();
          catMap.set(cat.name, inserted.id);
        }
      }

      // Ensure base laundry services exist and capture their IDs
      const serviceNames = [
        "Normal Iron",
        "Normal Wash",
        "Normal Wash & Iron",
        "Urgent Iron",
        "Urgent Wash",
        "Urgent Wash & Iron",
      ];
      const serviceIdMap = new Map<string, string>();
      for (const name of serviceNames) {
        const categoryId = catMap.get(name)!;
        const [existing] = await tx
          .select()
          .from(laundryServices)
          .where(
            and(
              eq(laundryServices.userId, userId),
              eq(laundryServices.categoryId, categoryId),
              eq(laundryServices.name, name),
            ),
          );
        if (existing) {
          serviceIdMap.set(name, existing.id);
        } else {
          const [inserted] = await tx
            .insert(laundryServices)
            .values({
              name,
              price: "0.00",
              categoryId,
              userId,
            })
            .returning();
          serviceIdMap.set(name, inserted.id);
        }
      }

      for (const row of rows) {
        const clothingCategoryId = catMap.get("Clothing Items")!;
        const [existingItem] = await tx
          .select()
          .from(clothingItems)
          .where(
            and(
              eq(clothingItems.userId, userId),
              eq(clothingItems.name, row.itemEn),
            ),
          );
        let clothingItemId: string;
        if (existingItem) {
          clothingItemId = existingItem.id;
          await tx
            .update(clothingItems)
            .set({ nameAr: row.itemAr, imageUrl: row.imageUrl })
            .where(eq(clothingItems.id, existingItem.id));
        } else {
          const [insertedItem] = await tx
            .insert(clothingItems)
            .values({
              name: row.itemEn,
              nameAr: row.itemAr,
              imageUrl: row.imageUrl,
              categoryId: clothingCategoryId,
              userId,
            })
            .returning();
          clothingItemId = insertedItem.id;
        }

        const services: Record<string, number | undefined> = {
          "Normal Iron": row.normalIron,
          "Normal Wash": row.normalWash,
          "Normal Wash & Iron": row.normalWashIron,
          "Urgent Iron": row.urgentIron,
          "Urgent Wash": row.urgentWash,
          "Urgent Wash & Iron": row.urgentWashIron,
        };

        for (const [serviceName, serviceId] of serviceIdMap.entries()) {
          const price = services[serviceName];
          const priceStr =
            price != null && !isNaN(price) ? price.toFixed(2) : "0.00";
          const [existingPrice] = await tx
            .select()
            .from(itemServicePrices)
            .where(
              and(
                eq(itemServicePrices.clothingItemId, clothingItemId),
                eq(itemServicePrices.serviceId, serviceId),
              ),
            );
          if (existingPrice) {
            if (price != null && !isNaN(price)) {
              await tx
                .update(itemServicePrices)
                .set({ price: priceStr })
                .where(
                  and(
                    eq(itemServicePrices.clothingItemId, clothingItemId),
                    eq(itemServicePrices.serviceId, serviceId),
                  ),
                );
              updated++;
            }
          } else {
            await tx
              .insert(itemServicePrices)
              .values({
                clothingItemId,
                serviceId,
                price: priceStr,
              });
            created++;
          }
        }
      }
    });

    return { processed: rows.length, created, updated };
  }

  async bulkUpsertBranchCatalog(
    branchId: string,
    rows: ParsedRow[],
  ): Promise<BulkUploadResult> {
    const branchUsers = await db
      .select()
      .from(users)
      .where(eq(users.branchId, branchId));
    if (branchUsers.length === 0) {
      return { processed: 0, created: 0, updated: 0 };
    }

    let created = 0;
    let updated = 0;
    for (const user of branchUsers) {
      const result = await this.bulkUpsertUserCatalog(user.id, rows);
      created += result.created;
      updated += result.updated;
    }
    return { processed: rows.length, created, updated };
  }

  // Transactions methods
  async createTransaction(transaction: InsertTransaction & { branchId: string }): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(transactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async getTransactions(branchId?: string): Promise<Transaction[]> {
    if (branchId) {
      return await db.select().from(transactions).where(eq(transactions.branchId, branchId));
    }
    return await db.select().from(transactions);
  }

  async getTransaction(id: string, branchId?: string): Promise<Transaction | undefined> {
    const conditions = [eq(transactions.id, id)];
    if (branchId) conditions.push(eq(transactions.branchId, branchId));
    const [transaction] = await db.select().from(transactions).where(and(...conditions));
    return transaction || undefined;
  }

  // Customer methods
  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers);
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async getCustomerByPhone(phoneNumber: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.phoneNumber, phoneNumber));
    return customer || undefined;
  }

  async getCustomerByNickname(nickname: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.nickname, nickname));
    return customer || undefined;
  }

  async createCustomer(customerData: InsertCustomer): Promise<Customer> {
    const [customer] = await db
      .insert(customers)
      .values(customerData)
      .returning();
    return customer;
  }

  async updateCustomer(id: string, customerData: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [updated] = await db
      .update(customers)
      .set({ ...customerData, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return updated || undefined;
  }

  async updateCustomerBalance(id: string, balanceChange: number): Promise<Customer | undefined> {
    const customer = await this.getCustomer(id);
    if (!customer) return undefined;
    
    const newBalance = parseFloat(customer.balanceDue) + balanceChange;
    return await this.updateCustomer(id, { balanceDue: newBalance.toFixed(2) });
  }

  // Order methods
  async getOrders(branchId?: string): Promise<Order[]> {
    if (branchId) {
      return await db.select().from(orders).where(eq(orders.branchId, branchId));
    }
    return await db.select().from(orders);
  }

  async getOrder(id: string, branchId?: string): Promise<Order | undefined> {
    const conditions = [eq(orders.id, id)];
    if (branchId) conditions.push(eq(orders.branchId, branchId));
    const [order] = await db.select().from(orders).where(and(...conditions));
    return order || undefined;
  }

  async getOrdersByCustomer(customerId: string, branchId?: string): Promise<Order[]> {
    const conditions = [eq(orders.customerId, customerId)];
    if (branchId) conditions.push(eq(orders.branchId, branchId));
    return await db.select().from(orders).where(and(...conditions));
  }

  async getOrdersByStatus(status: string, branchId?: string): Promise<Order[]> {
    const conditions = [eq(orders.status, status)];
    if (branchId) conditions.push(eq(orders.branchId, branchId));
    return await db.select().from(orders).where(and(...conditions));
  }

  async createOrder(orderData: InsertOrder & { branchId: string }): Promise<Order> {
    return await db.transaction(async (tx) => {
      const [branch] = await tx
        .select({ code: branches.code, next: branches.nextOrderNumber })
        .from(branches)
        .where(eq(branches.id, orderData.branchId))
        .for("update");

      if (!branch) throw new Error("Branch not found");

      const orderNumber = `${branch.code}-${String(branch.next).padStart(4, "0")}`;

      await tx
        .update(branches)
        .set({ nextOrderNumber: branch.next + 1 })
        .where(eq(branches.id, orderData.branchId));

      const [order] = await tx
        .insert(orders)
        .values({
          ...orderData,
          orderNumber,
        })
        .returning();
      return order;
    });
  }

  async updateOrder(id: string, orderData: Partial<Omit<Order, 'id' | 'orderNumber' | 'createdAt'>>): Promise<Order | undefined> {
    const [updated] = await db
      .update(orders)
      .set({ ...orderData, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return updated || undefined;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    return await this.updateOrder(id, { status });
  }

  async recordOrderPrint(orderId: string, printedBy: string): Promise<OrderPrint> {
    const [last] = await db
      .select({ printNumber: orderPrints.printNumber })
      .from(orderPrints)
      .where(eq(orderPrints.orderId, orderId))
      .orderBy(desc(orderPrints.printNumber))
      .limit(1);
    const next = last ? last.printNumber + 1 : 1;
    const [record] = await db
      .insert(orderPrints)
      .values({ orderId, printedBy, printNumber: next })
      .returning();
    return record;
  }

  async getOrderPrintHistory(orderId: string): Promise<OrderPrint[]> {
    return await db
      .select()
      .from(orderPrints)
      .where(eq(orderPrints.orderId, orderId))
      .orderBy(orderPrints.printNumber);
  }

  // Payment methods
  async getPayments(branchId?: string): Promise<Payment[]> {
    if (branchId) {
      const rows = await db
        .select({ payment: payments })
        .from(payments)
        .leftJoin(orders, eq(payments.orderId, orders.id))
        .where(eq(orders.branchId, branchId));
      return rows.map(r => r.payment);
    }
    return await db.select().from(payments);
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment || undefined;
  }

  async getPaymentsByCustomer(customerId: string, branchId?: string): Promise<Payment[]> {
    if (branchId) {
      const rows = await db
        .select({ payment: payments })
        .from(payments)
        .leftJoin(orders, eq(payments.orderId, orders.id))
        .where(and(eq(payments.customerId, customerId), eq(orders.branchId, branchId)));
      return rows.map(r => r.payment);
    }
    return await db.select().from(payments).where(eq(payments.customerId, customerId));
  }

  async createPayment(paymentData: InsertPayment): Promise<Payment> {
    const [payment] = await db
      .insert(payments)
      .values(paymentData)
      .returning();
    return payment;
  }

  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const [record] = await db
      .insert(notifications)
      .values(notificationData)
      .returning();
    return record;
  }

  async getSecuritySettings(): Promise<SecuritySettings | undefined> {
    const [settings] = await db.select().from(securitySettings).limit(1);
    return settings || undefined;
  }

  async updateSecuritySettings(settingsData: InsertSecuritySettings): Promise<SecuritySettings> {
    const existing = await this.getSecuritySettings();
    if (existing) {
      const [updated] = await db
        .update(securitySettings)
        .set({ ...settingsData, updatedAt: new Date() })
        .where(eq(securitySettings.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db
      .insert(securitySettings)
      .values(settingsData)
      .returning();
    return created;
  }

  async getLoyaltyHistory(customerId: string): Promise<LoyaltyHistory[]> {
    return await db
      .select()
      .from(loyaltyHistory)
      .where(eq(loyaltyHistory.customerId, customerId));
  }

  async createLoyaltyHistory(entry: InsertLoyaltyHistory): Promise<LoyaltyHistory> {
    const [record] = await db
      .insert(loyaltyHistory)
      .values(entry)
      .returning();
    return record;
  }

  // Report methods
  async getOrderStats(range: string, branchId?: string): Promise<{ period: string; count: number; revenue: number }[]> {
    const truncMap: Record<string, string> = {
      daily: "day",
      weekly: "week",
      monthly: "month",
      yearly: "year",
    };
    const intervalMap: Record<string, string> = {
      daily: "1 day",
      weekly: "7 days",
      monthly: "1 month",
      yearly: "1 year",
    };
    const trunc = truncMap[range] ?? "day";
    const interval = intervalMap[range] ?? "1 day";

    const branchFilter = branchId ? `AND o.branch_id = '${branchId}'` : "";
    const { rows } = await db.execute<any>(sql.raw(`
      SELECT period,
             SUM(count)::int AS count,
             SUM(revenue)::float AS revenue
      FROM (
        SELECT
          date_trunc('${trunc}', o.created_at)::date AS period,
          1 AS count,
          o.total::numeric AS revenue
        FROM orders o
        WHERE o.created_at >= NOW() - INTERVAL '${interval}' ${branchFilter}
          AND o.payment_method <> 'pay_later'

        UNION ALL

        SELECT
          date_trunc('${trunc}', o.created_at)::date AS period,
          1 AS count,
          p.amount AS revenue
        FROM orders o
        JOIN (${PAY_LATER_AGGREGATE}) p ON p.order_id = o.id
        WHERE o.created_at >= NOW() - INTERVAL '${interval}' ${branchFilter}
          AND o.payment_method = 'pay_later'
      ) s
      GROUP BY period
      ORDER BY period;
    `));

    return rows.map((r: any) => ({
      period: r.period,
      count: Number(r.count),
      revenue: Number(r.revenue),
    }));
  }

  async getTopServices(range: string, branchId?: string): Promise<{ service: string; count: number; revenue: number }[]> {
    const intervalMap: Record<string, string> = {
      daily: "1 day",
      weekly: "7 days",
      monthly: "1 month",
      yearly: "1 year",
    };
    const interval = intervalMap[range] ?? "1 day";

    const branchFilter = branchId ? `AND o.branch_id = '${branchId}'` : "";
    const { rows } = await db.execute<any>(sql.raw(`
      SELECT service,
             SUM(count)::int AS count,
             SUM(revenue)::float AS revenue
      FROM (
        SELECT
          item->>'service' AS service,
          (item->>'quantity')::int AS count,
          (item->>'total')::numeric AS revenue
        FROM orders o
        CROSS JOIN LATERAL jsonb_array_elements(o.items) AS item
        WHERE o.created_at >= NOW() - INTERVAL '${interval}' ${branchFilter}
          AND o.payment_method <> 'pay_later'

        UNION ALL

        SELECT
          item->>'service' AS service,
          (item->>'quantity')::int AS count,
          (item->>'total')::numeric AS revenue
        FROM orders o
        JOIN (${PAY_LATER_AGGREGATE}) p ON p.order_id = o.id
        CROSS JOIN LATERAL jsonb_array_elements(o.items) AS item
        WHERE o.created_at >= NOW() - INTERVAL '${interval}' ${branchFilter}
          AND o.payment_method = 'pay_later'
      ) s
      GROUP BY service
      ORDER BY revenue DESC
      LIMIT 10;
    `));

    return rows.map((r: any) => ({
      service: r.service,
      count: Number(r.count),
      revenue: Number(r.revenue),
    }));
  }

  async getTopProducts(range: string, branchId?: string): Promise<{ product: string; count: number; revenue: number }[]> {
    const intervalMap: Record<string, string> = {
      daily: "1 day",
      weekly: "7 days",
      monthly: "1 month",
      yearly: "1 year",
    };
    const interval = intervalMap[range] ?? "1 day";

    const branchFilter = branchId ? `AND o.branch_id = '${branchId}'` : "";
    const { rows } = await db.execute<any>(sql.raw(`
      SELECT product,
             SUM(count)::int AS count,
             SUM(revenue)::float AS revenue
      FROM (
        SELECT
          item->>'clothingItem' AS product,
          (item->>'quantity')::int AS count,
          (item->>'total')::numeric AS revenue
        FROM orders o
        CROSS JOIN LATERAL jsonb_array_elements(o.items) AS item
        WHERE o.created_at >= NOW() - INTERVAL '${interval}' ${branchFilter}
          AND o.payment_method <> 'pay_later'

        UNION ALL

        SELECT
          item->>'clothingItem' AS product,
          (item->>'quantity')::int AS count,
          (item->>'total')::numeric AS revenue
        FROM orders o
        JOIN (${PAY_LATER_AGGREGATE}) p ON p.order_id = o.id
        CROSS JOIN LATERAL jsonb_array_elements(o.items) AS item
        WHERE o.created_at >= NOW() - INTERVAL '${interval}' ${branchFilter}
          AND o.payment_method = 'pay_later'
      ) s
      GROUP BY product
      ORDER BY count DESC
      LIMIT 10;
    `));

    return rows.map((r: any) => ({
      product: r.product,
      count: Number(r.count),
      revenue: Number(r.revenue),
    }));
  }

  async getSalesSummary(range: string, branchId?: string): Promise<{
    totalOrders: number;
    totalRevenue: number;
    stats: { period: string; count: number; revenue: number }[];
  }> {
    const stats = await this.getOrderStats(range, branchId);
    const totalOrders = stats.reduce((acc, r) => acc + r.count, 0);
    const totalRevenue = stats.reduce((acc, r) => acc + r.revenue, 0);
    return { totalOrders, totalRevenue, stats };
  }
}

export const storage = new DatabaseStorage();
