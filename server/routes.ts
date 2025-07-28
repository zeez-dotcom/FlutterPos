import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTransactionSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Clothing Items routes
  app.get("/api/clothing-items", async (req, res) => {
    try {
      const category = req.query.category as string;
      const search = req.query.search as string;
      
      let items = category 
        ? await storage.getClothingItemsByCategory(category)
        : await storage.getClothingItems();
      
      if (search) {
        items = items.filter(item => 
          item.name.toLowerCase().includes(search.toLowerCase()) ||
          item.description?.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clothing items" });
    }
  });

  app.get("/api/clothing-items/:id", async (req, res) => {
    try {
      const item = await storage.getClothingItem(req.params.id);
      if (!item) {
        return res.status(404).json({ message: "Clothing item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clothing item" });
    }
  });

  // Laundry Services routes
  app.get("/api/laundry-services", async (req, res) => {
    try {
      const category = req.query.category as string;
      const search = req.query.search as string;
      
      let services = category 
        ? await storage.getLaundryServicesByCategory(category)
        : await storage.getLaundryServices();
      
      if (search) {
        services = services.filter(service => 
          service.name.toLowerCase().includes(search.toLowerCase()) ||
          service.description?.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch laundry services" });
    }
  });

  app.get("/api/laundry-services/:id", async (req, res) => {
    try {
      const service = await storage.getLaundryService(req.params.id);
      if (!service) {
        return res.status(404).json({ message: "Laundry service not found" });
      }
      res.json(service);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch laundry service" });
    }
  });

  // Transactions routes
  app.post("/api/transactions", async (req, res) => {
    try {
      const validatedData = insertTransactionSchema.parse(req.body);
      
      // For laundry system, we don't need to update stock like traditional POS
      // Laundry services are unlimited capacity services
      
      const transaction = await storage.createTransaction(validatedData);
      res.json(transaction);
    } catch (error) {
      console.error("Transaction creation error:", error);
      res.status(400).json({ message: "Failed to create transaction" });
    }
  });

  app.get("/api/transactions", async (req, res) => {
    try {
      const transactions = await storage.getTransactions();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.get("/api/transactions/:id", async (req, res) => {
    try {
      const transaction = await storage.getTransaction(req.params.id);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transaction" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
