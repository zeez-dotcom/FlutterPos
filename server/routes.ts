import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTransactionSchema, insertClothingItemSchema, insertLaundryServiceSchema } from "@shared/schema";

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

  app.post("/api/clothing-items", async (req, res) => {
    try {
      const validatedData = insertClothingItemSchema.parse(req.body);
      const newItem = await storage.createClothingItem(validatedData);
      res.json(newItem);
    } catch (error) {
      console.error("Error creating clothing item:", error);
      res.status(500).json({ message: "Failed to create clothing item" });
    }
  });

  app.put("/api/clothing-items/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertClothingItemSchema.parse(req.body);
      const updatedItem = await storage.updateClothingItem(id, validatedData);
      if (!updatedItem) {
        return res.status(404).json({ message: "Clothing item not found" });
      }
      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating clothing item:", error);
      res.status(500).json({ message: "Failed to update clothing item" });
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

  app.post("/api/laundry-services", async (req, res) => {
    try {
      const validatedData = insertLaundryServiceSchema.parse(req.body);
      const newService = await storage.createLaundryService(validatedData);
      res.json(newService);
    } catch (error) {
      console.error("Error creating laundry service:", error);
      res.status(500).json({ message: "Failed to create laundry service" });
    }
  });

  app.put("/api/laundry-services/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertLaundryServiceSchema.parse(req.body);
      const updatedService = await storage.updateLaundryService(id, validatedData);
      if (!updatedService) {
        return res.status(404).json({ message: "Laundry service not found" });
      }
      res.json(updatedService);
    } catch (error) {
      console.error("Error updating laundry service:", error);
      res.status(500).json({ message: "Failed to update laundry service" });
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
