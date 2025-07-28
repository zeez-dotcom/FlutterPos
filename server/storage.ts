import { 
  type ClothingItem, type InsertClothingItem, 
  type LaundryService, type InsertLaundryService,
  type Transaction, type InsertTransaction 
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
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

  constructor() {
    this.clothingItems = new Map();
    this.laundryServices = new Map();
    this.transactions = new Map();
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
}

export const storage = new MemStorage();
