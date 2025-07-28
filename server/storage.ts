import { 
  type ClothingItem, type InsertClothingItem, 
  type LaundryService, type InsertLaundryService,
  type Transaction, type InsertTransaction,
  type User, type InsertUser, type UpsertUser,
  type Category, type InsertCategory,
  clothingItems, laundryServices, transactions, users, categories
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  
  // Category operations
  getCategories(): Promise<Category[]>;
  getCategoriesByType(type: string): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;
  
  // Clothing Items
  getClothingItems(): Promise<ClothingItem[]>;
  getClothingItemsByCategory(category: string): Promise<ClothingItem[]>;
  getClothingItem(id: string): Promise<ClothingItem | undefined>;
  createClothingItem(item: InsertClothingItem): Promise<ClothingItem>;
  updateClothingItem(id: string, item: Partial<InsertClothingItem>): Promise<ClothingItem | undefined>;
  
  // Laundry Services  
  getLaundryServices(): Promise<LaundryService[]>;
  getLaundryServicesByCategory(category: string): Promise<LaundryService[]>;
  getLaundryService(id: string): Promise<LaundryService | undefined>;
  createLaundryService(service: InsertLaundryService): Promise<LaundryService>;
  updateLaundryService(id: string, service: Partial<InsertLaundryService>): Promise<LaundryService | undefined>;
  
  // Transactions
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactions(): Promise<Transaction[]>;
  getTransaction(id: string): Promise<Transaction | undefined>;
}

export class MemStorage implements IStorage {
  private clothingItems: Map<string, ClothingItem>;
  private laundryServices: Map<string, LaundryService>;
  private transactions: Map<string, Transaction>;
  private users: Map<string, User>;
  private categories: Map<string, Category>;

  constructor() {
    this.clothingItems = new Map();
    this.laundryServices = new Map();
    this.transactions = new Map();
    this.users = new Map();
    this.categories = new Map();
    this.initializeData();
  }

  private initializeData() {
    // Initialize clothing items
    const initialClothingItems: InsertClothingItem[] = [
      {
        name: "Pants",
        description: "Regular trousers",
        category: "pants",
        imageUrl: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200"
      },
      {
        name: "Dishdasha",
        description: "Traditional long robe",
        category: "traditional",
        imageUrl: "https://images.unsplash.com/photo-1594069037019-f3ab4b0e6a21?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200"
      },
      {
        name: "Shirt",
        description: "Dress shirt or casual shirt",
        category: "shirts",
        imageUrl: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200"
      },
      {
        name: "Dress",
        description: "Ladies dress",
        category: "dresses",
        imageUrl: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200"
      },
      {
        name: "Suit Jacket",
        description: "Formal jacket",
        category: "formal",
        imageUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200"
      },
      {
        name: "Bed Sheets",
        description: "Full set of bed linens",
        category: "linens",
        imageUrl: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200"
      }
    ];

    // Initialize laundry services
    const initialLaundryServices: InsertLaundryService[] = [
      {
        name: "Wash & Fold",
        description: "Basic washing and folding service",
        price: "3.00",
        category: "basic"
      },
      {
        name: "Dry Cleaning",
        description: "Professional dry cleaning",
        price: "8.00",
        category: "premium"
      },
      {
        name: "Iron & Press",
        description: "Professional ironing and pressing",
        price: "4.50",
        category: "basic"
      },
      {
        name: "Stain Removal",
        description: "Specialized stain treatment",
        price: "6.00",
        category: "specialty"
      },
      {
        name: "Express Service",
        description: "Same day service",
        price: "12.00",
        category: "express"
      },
      {
        name: "Delicate Care",
        description: "Special care for delicate items",
        price: "10.00",
        category: "specialty"
      }
    ];

    initialClothingItems.forEach(item => {
      this.createClothingItem(item);
    });

    initialLaundryServices.forEach(service => {
      this.createLaundryService(service);
    });
  }

  // Clothing Items methods
  async getClothingItems(): Promise<ClothingItem[]> {
    return Array.from(this.clothingItems.values());
  }

  async getClothingItemsByCategory(category: string): Promise<ClothingItem[]> {
    if (category === "all") {
      return this.getClothingItems();
    }
    return Array.from(this.clothingItems.values()).filter(item => item.category === category);
  }

  async getClothingItem(id: string): Promise<ClothingItem | undefined> {
    return this.clothingItems.get(id);
  }

  async createClothingItem(item: InsertClothingItem): Promise<ClothingItem> {
    const id = randomUUID();
    const newItem: ClothingItem = { 
      id, 
      name: item.name,
      description: item.description || null,
      category: item.category,
      imageUrl: item.imageUrl || null
    };
    this.clothingItems.set(id, newItem);
    return newItem;
  }

  async updateClothingItem(id: string, item: Partial<InsertClothingItem>): Promise<ClothingItem | undefined> {
    const existing = this.clothingItems.get(id);
    if (!existing) return undefined;
    
    const updated: ClothingItem = { 
      ...existing, 
      name: item.name ?? existing.name,
      description: item.description ?? existing.description,
      category: item.category ?? existing.category,
      imageUrl: item.imageUrl ?? existing.imageUrl
    };
    this.clothingItems.set(id, updated);
    return updated;
  }

  // Laundry Services methods
  async getLaundryServices(): Promise<LaundryService[]> {
    return Array.from(this.laundryServices.values());
  }

  async getLaundryServicesByCategory(category: string): Promise<LaundryService[]> {
    if (category === "all") {
      return this.getLaundryServices();
    }
    return Array.from(this.laundryServices.values()).filter(service => service.category === category);
  }

  async getLaundryService(id: string): Promise<LaundryService | undefined> {
    return this.laundryServices.get(id);
  }

  async createLaundryService(service: InsertLaundryService): Promise<LaundryService> {
    const id = randomUUID();
    const newService: LaundryService = { 
      id, 
      name: service.name,
      description: service.description || null,
      price: service.price,
      category: service.category
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
      description: service.description ?? existing.description,
      price: service.price ?? existing.price,
      category: service.category ?? existing.category
    };
    this.laundryServices.set(id, updated);
    return updated;
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const transaction: Transaction = { 
      ...insertTransaction, 
      id, 
      createdAt: new Date()
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async getTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values());
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  // User methods (stub for MemStorage - not used in production)
  async getUser(id: string): Promise<User | undefined> { return undefined; }
  async getUserByUsername(username: string): Promise<User | undefined> { return undefined; }
  async createUser(user: InsertUser): Promise<User> { throw new Error("Not implemented in MemStorage"); }
  async upsertUser(user: UpsertUser): Promise<User> { throw new Error("Not implemented in MemStorage"); }
  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> { return undefined; }
  async getUsers(): Promise<User[]> { return []; }

  // Category methods (stub for MemStorage - not used in production)
  async getCategories(): Promise<Category[]> { return []; }
  async getCategoriesByType(type: string): Promise<Category[]> { return []; }
  async getCategory(id: string): Promise<Category | undefined> { return undefined; }
  async createCategory(category: InsertCategory): Promise<Category> { throw new Error("Not implemented in MemStorage"); }
  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined> { return undefined; }
  async deleteCategory(id: string): Promise<boolean> { return false; }
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(userData.passwordHash, saltRounds);
    
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        passwordHash: hashedPassword,
      })
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User | undefined> {
    const updateData = { ...userData };
    if (updateData.passwordHash) {
      const saltRounds = 10;
      updateData.passwordHash = await bcrypt.hash(updateData.passwordHash, saltRounds);
    }
    
    const [updated] = await db
      .update(users)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated || undefined;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async getCategoriesByType(type: string): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.type, type));
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  async createCategory(categoryData: InsertCategory): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values(categoryData)
      .returning();
    return category;
  }

  async updateCategory(id: string, categoryData: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updated] = await db
      .update(categories)
      .set({ ...categoryData, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Clothing Items methods
  async getClothingItems(): Promise<ClothingItem[]> {
    return await db.select().from(clothingItems);
  }

  async getClothingItemsByCategory(category: string): Promise<ClothingItem[]> {
    if (category === "all") {
      return this.getClothingItems();
    }
    return await db.select().from(clothingItems).where(eq(clothingItems.category, category));
  }

  async getClothingItem(id: string): Promise<ClothingItem | undefined> {
    const [item] = await db.select().from(clothingItems).where(eq(clothingItems.id, id));
    return item || undefined;
  }

  async createClothingItem(item: InsertClothingItem): Promise<ClothingItem> {
    const [newItem] = await db
      .insert(clothingItems)
      .values(item)
      .returning();
    return newItem;
  }

  async updateClothingItem(id: string, item: Partial<InsertClothingItem>): Promise<ClothingItem | undefined> {
    const [updated] = await db
      .update(clothingItems)
      .set(item)
      .where(eq(clothingItems.id, id))
      .returning();
    return updated || undefined;
  }

  // Laundry Services methods
  async getLaundryServices(): Promise<LaundryService[]> {
    return await db.select().from(laundryServices);
  }

  async getLaundryServicesByCategory(category: string): Promise<LaundryService[]> {
    if (category === "all") {
      return this.getLaundryServices();
    }
    return await db.select().from(laundryServices).where(eq(laundryServices.category, category));
  }

  async getLaundryService(id: string): Promise<LaundryService | undefined> {
    const [service] = await db.select().from(laundryServices).where(eq(laundryServices.id, id));
    return service || undefined;
  }

  async createLaundryService(service: InsertLaundryService): Promise<LaundryService> {
    const [newService] = await db
      .insert(laundryServices)
      .values(service)
      .returning();
    return newService;
  }

  async updateLaundryService(id: string, service: Partial<InsertLaundryService>): Promise<LaundryService | undefined> {
    const [updated] = await db
      .update(laundryServices)
      .set(service)
      .where(eq(laundryServices.id, id))
      .returning();
    return updated || undefined;
  }

  // Transactions methods
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(transactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async getTransactions(): Promise<Transaction[]> {
    return await db.select().from(transactions);
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction || undefined;
  }
}

export const storage = new DatabaseStorage();
