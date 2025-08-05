import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, type ParsedRow } from "./storage";
import { insertTransactionSchema, insertClothingItemSchema, insertLaundryServiceSchema, insertProductSchema, insertUserSchema, updateUserSchema, insertCategorySchema, insertBranchSchema, insertCustomerSchema, insertOrderSchema, insertPaymentSchema, insertSecuritySettingsSchema, insertItemServicePriceSchema } from "@shared/schema";
import { setupAuth, requireAuth, requireSuperAdmin, requireAdminOrSuperAdmin } from "./auth";
import passport from "passport";
import type { UserWithBranch } from "@shared/schema";
import nodemailer from "nodemailer";
import multer from "multer";
import * as XLSX from "xlsx";
import { generateCatalogTemplate } from "./utils/excel";

const upload = multer();

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // Authentication routes
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Login failed" });
      }
      
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        // Don't send password hash to client
        const { passwordHash, ...safeUser } = user;
        return res.json({ user: safeUser, message: "Login successful" });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/auth/user", requireAuth, (req, res) => {
    res.json(req.user);
  });

  app.put("/api/users/:id", requireAuth, async (req, res, next) => {
    const { id } = req.params;
    const user = req.user as UserWithBranch;
    if (user.id !== id) {
      if (user.role === "super_admin") return next();
      return res.status(403).json({ message: "Unauthorized" });
    }
    try {
      const data = insertUserSchema
        .pick({ firstName: true, lastName: true, email: true })
        .partial()
        .parse(req.body);
      const updated = await storage.updateUserProfile(id, data);
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }
      const { passwordHash, ...safeUser } = updated;
      res.json(safeUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.put("/api/users/:id/password", requireAuth, async (req, res) => {
    const { id } = req.params;
    const user = req.user as UserWithBranch;
    if (user.id !== id) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    try {
      const { password } = req.body as { password: string };
      const updated = await storage.updateUserPassword(id, password);
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "Password updated" });
    } catch (error) {
      console.error("Error updating password:", error);
      res.status(500).json({ message: "Failed to update password" });
    }
  });

  // User management routes (Super Admin only)
  app.get("/api/users", requireSuperAdmin, async (req, res) => {
    try {
      const users = await storage.getUsers();
      // Don't send password hashes
      const safeUsers = users.map(({ passwordHash, ...user }) => user);
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", requireSuperAdmin, async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const newUser = await storage.createUser(validatedData);
      // Don't send password hash
      const { passwordHash, ...safeUser } = newUser;
      res.json(safeUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put("/api/users/:id", requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateUserSchema.parse(req.body);
      if (validatedData.passwordHash === "") {
        delete validatedData.passwordHash;
      }
      const updatedUser = await storage.updateUser(id, validatedData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      // Don't send password hash
      const { passwordHash, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.put("/api/users/:id/branch", requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertUserSchema.pick({ branchId: true }).parse(req.body);
      const updatedUser = await storage.updateUserBranch(id, data.branchId ?? null);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const { passwordHash, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error) {
      console.error("Error updating user branch:", error);
      res.status(500).json({ message: "Failed to update user branch" });
    }
  });

  // Category management routes (Admin or Super Admin)
  app.get("/api/categories", requireAdminOrSuperAdmin, async (req, res) => {
    try {
      const type = req.query.type as string;
      const userId = (req.user as UserWithBranch).id;
      const categories = type
        ? await storage.getCategoriesByType(type, userId)
        : await storage.getCategories(userId);
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", requireAdminOrSuperAdmin, async (req, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const currentUser = req.user as UserWithBranch;
      const { userId: bodyUserId, ...categoryData } = validatedData;
      const userId =
        currentUser.role === "super_admin"
          ? bodyUserId ?? currentUser.id
          : currentUser.id;
      const newCategory = await storage.createCategory(categoryData, userId);
      res.json(newCategory);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.put("/api/categories/:id", requireAdminOrSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertCategorySchema.parse(req.body);
      const currentUser = req.user as UserWithBranch;
      const { userId: bodyUserId, ...categoryData } = validatedData;
      const userId =
        currentUser.role === "super_admin"
          ? bodyUserId ?? currentUser.id
          : currentUser.id;
      const updatedCategory = await storage.updateCategory(
        id,
        categoryData,
        userId,
      );
      if (!updatedCategory) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(updatedCategory);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", requireAdminOrSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req.user as UserWithBranch).id;
      const deleted = await storage.deleteCategory(id, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  app.get("/api/catalog/bulk-template", requireSuperAdmin, (_req, res) => {
    const buf = generateCatalogTemplate();
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=catalog_template.xlsx",
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.send(buf);
  });

  app.post(
    "/api/catalog/bulk-upload",
    requireSuperAdmin,
    upload.single("file"),
    async (req, res) => {
      try {
        const branchId = req.body.branchId as string;
        if (!branchId || !req.file) {
          return res.status(400).json({ message: "branchId and file are required" });
        }

        const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json<any>(sheet);
        const rows: ParsedRow[] = data
          .map((r: any) => ({
            itemEn: String(r["Item (English)"] ?? "").trim(),
            itemAr: r["Item (Arabic)"]
              ? String(r["Item (Arabic)"]).trim()
              : undefined,
            normalIron:
              r["Normal Iron"] !== undefined ? Number(r["Normal Iron"]) : undefined,
            normalWash:
              r["Normal Wash"] !== undefined ? Number(r["Normal Wash"]) : undefined,
            normalWashIron:
              r["Normal Wash & Iron"] !== undefined
                ? Number(r["Normal Wash & Iron"])
                : undefined,
            urgentIron:
              r["Urgent Iron"] !== undefined ? Number(r["Urgent Iron"]) : undefined,
            urgentWash:
              r["Urgent Wash"] !== undefined ? Number(r["Urgent Wash"]) : undefined,
            urgentWashIron:
              r["Urgent Wash & Iron"] !== undefined
                ? Number(r["Urgent Wash & Iron"])
                : undefined,
            imageUrl: r["Picture Link"]
              ? String(r["Picture Link"]).trim()
              : undefined,
          }))
          .filter((r) => r.itemEn);

        const result = await storage.bulkUpsertBranchCatalog(branchId, rows);
        res.json(result);
      } catch (error) {
        console.error("Bulk upload failed:", error);
        res.status(500).json({ message: "Bulk upload failed" });
      }
    },
  );

  // Branch management routes (Super Admin only)
  app.get("/api/branches", requireSuperAdmin, async (_req, res) => {
    try {
      const branches = await storage.getBranches();
      res.json(branches);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch branches" });
    }
  });

  app.post("/api/branches", requireSuperAdmin, async (req, res) => {
    try {
      const validatedData = insertBranchSchema.parse(req.body);
      const branch = await storage.createBranch(validatedData);
      res.json(branch);
    } catch (error) {
      console.error("Error creating branch:", error);
      res.status(500).json({ message: "Failed to create branch" });
    }
  });

  app.put("/api/branches/:id", requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertBranchSchema.parse(req.body);
      const branch = await storage.updateBranch(id, validatedData);
      if (!branch) {
        return res.status(404).json({ message: "Branch not found" });
      }
      res.json(branch);
    } catch (error) {
      console.error("Error updating branch:", error);
      res.status(500).json({ message: "Failed to update branch" });
    }
  });

  app.delete("/api/branches/:id", requireSuperAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteBranch(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Branch not found" });
      }
      res.json({ message: "Branch deleted successfully" });
    } catch (error) {
      console.error("Error deleting branch:", error);
      res.status(500).json({ message: "Failed to delete branch" });
    }
  });

  // Security settings (Admin or Super Admin)
  app.get("/api/security-settings", requireAdminOrSuperAdmin, async (_req, res) => {
    try {
      const settings = await storage.getSecuritySettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch security settings" });
    }
  });

  app.put("/api/security-settings", requireAdminOrSuperAdmin, async (req, res) => {
    try {
      const validated = insertSecuritySettingsSchema.parse(req.body);
      const updated = await storage.updateSecuritySettings(validated);
      res.json(updated);
    } catch (error) {
      console.error("Error updating security settings:", error);
      res.status(400).json({ message: "Invalid security settings data" });
    }
  });

  // Products route
  app.get("/api/products", requireAuth, async (req, res) => {
    try {
      const categoryId = req.query.categoryId as string;
      const search = req.query.search as string;
      const user = req.user as UserWithBranch;

      let items = categoryId
        ? await storage.getProductsByCategory(categoryId, user.branchId || undefined)
        : await storage.getProducts(user.branchId || undefined);

      if (search) {
        items = items.filter(product =>
          product.name.toLowerCase().includes(search.toLowerCase()) ||
          product.nameAr?.toLowerCase().includes(search.toLowerCase()) ||
          product.description?.toLowerCase().includes(search.toLowerCase())
        );
      }

      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.post("/api/products", requireAdminOrSuperAdmin, async (req, res) => {
    try {
      const user = req.user as UserWithBranch;
      if (!user.branchId) {
        return res.status(400).json({ message: "User is not assigned to a branch" });
      }
      const validatedData = insertProductSchema.parse(req.body);
      const newProduct = await storage.createProduct({ ...validatedData, branchId: user.branchId });
      res.json(newProduct);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", requireAdminOrSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user as UserWithBranch;
      if (!user.branchId) {
        return res.status(400).json({ message: "User is not assigned to a branch" });
      }
      const validatedData = insertProductSchema.partial().parse(req.body);
      const updatedProduct = await storage.updateProduct(id, validatedData, user.branchId);
      if (!updatedProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(updatedProduct);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });
  // Clothing Items routes
  app.get("/api/clothing-items", requireAuth, async (req, res) => {
    try {
      const categoryId = req.query.categoryId as string;
      const search = req.query.search as string;
      const userId = (req.user as UserWithBranch).id;

      let items = categoryId
        ? await storage.getClothingItemsByCategory(categoryId, userId)
        : await storage.getClothingItems(userId);

      if (search) {
        items = items.filter((item) =>
          item.name.toLowerCase().includes(search.toLowerCase()) ||
          item.nameAr?.toLowerCase().includes(search.toLowerCase()) ||
          item.description?.toLowerCase().includes(search.toLowerCase()),
        );
      }

      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clothing items" });
    }
  });

  app.get("/api/clothing-items/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as UserWithBranch).id;
      const item = await storage.getClothingItem(req.params.id, userId);
      if (!item) {
        return res.status(404).json({ message: "Clothing item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clothing item" });
    }
  });

  app.post("/api/clothing-items", requireAdminOrSuperAdmin, async (req, res) => {
    try {
      const validatedData = insertClothingItemSchema.parse(req.body);
      const userId = (req.user as UserWithBranch).id;
      const category = await storage.getCategory(validatedData.categoryId, userId);
      if (!category) {
        return res.status(400).json({ message: "Invalid category" });
      }
      if (category.type !== 'item') {
        return res.status(400).json({ message: "Invalid category type" });
      }
      const newItem = await storage.createClothingItem({ ...validatedData, userId });
      res.json(newItem);
    } catch (error: any) {
      console.error("Error creating clothing item:", error);
      if (error?.code === "23503") {
        return res.status(400).json({ message: "Invalid category" });
      }
      res.status(500).json({ message: "Failed to create clothing item" });
    }
  });

  app.put("/api/clothing-items/:id", requireAdminOrSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertClothingItemSchema.partial().parse(req.body);
      const userId = (req.user as UserWithBranch).id;
      const updatedItem = await storage.updateClothingItem(id, validatedData, userId);
      if (!updatedItem) {
        return res.status(404).json({ message: "Clothing item not found" });
      }
      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating clothing item:", error);
      res.status(500).json({ message: "Failed to update clothing item" });
    }
  });

  app.delete("/api/clothing-items/:id", requireAdminOrSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req.user as UserWithBranch).id;
      const deleted = await storage.deleteClothingItem(id, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Clothing item not found" });
      }
      res.json({ message: "Clothing item deleted successfully" });
    } catch (error) {
      console.error("Error deleting clothing item:", error);
      res.status(500).json({ message: "Failed to delete clothing item" });
    }
  });

  app.get("/api/clothing-items/:id/services", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as UserWithBranch).id;
      const categoryId = req.query.categoryId as string | undefined;
      const services = await storage.getServicesForClothingItem(
        req.params.id,
        userId,
        categoryId,
      );
      res.json(services);
    } catch (error) {
      console.error("Error fetching item services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  // Laundry Services routes
  app.get("/api/laundry-services", requireAuth, async (req, res) => {
    try {
      const categoryId = req.query.categoryId as string;
      const search = req.query.search as string;
      const userId = (req.user as UserWithBranch).id;

      let services = categoryId
        ? await storage.getLaundryServicesByCategory(categoryId, userId)
        : await storage.getLaundryServices(userId);

      if (search) {
        services = services.filter((service) =>
          service.name.toLowerCase().includes(search.toLowerCase()) ||
          service.nameAr?.toLowerCase().includes(search.toLowerCase()) ||
          service.description?.toLowerCase().includes(search.toLowerCase()),
        );
      }

      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch laundry services" });
    }
  });

  app.get("/api/laundry-services/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as UserWithBranch).id;
      const service = await storage.getLaundryService(req.params.id, userId);
      if (!service) {
        return res.status(404).json({ message: "Laundry service not found" });
      }
      res.json(service);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch laundry service" });
    }
  });

  app.post("/api/laundry-services", requireAdminOrSuperAdmin, async (req, res) => {
    try {
      const validatedData = insertLaundryServiceSchema.parse(req.body);
      const userId = (req.user as UserWithBranch).id;
      const category = await storage.getCategory(validatedData.categoryId, userId);
      if (!category || category.type !== "service") {
        return res.status(400).json({ message: "Invalid category" });
      }
      const newService = await storage.createLaundryService({ ...validatedData, userId });
      res.json(newService);
    } catch (error: any) {
      console.error("Error creating laundry service:", error);
      if (error?.code === "23503") {
        return res.status(400).json({ message: "Invalid category" });
      }
      res.status(500).json({ message: "Failed to create laundry service" });
    }
  });

  app.put("/api/laundry-services/:id", requireAdminOrSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertLaundryServiceSchema.partial().parse(req.body);
      const userId = (req.user as UserWithBranch).id;
      const updatedService = await storage.updateLaundryService(id, validatedData, userId);
      if (!updatedService) {
        return res.status(404).json({ message: "Laundry service not found" });
      }
      res.json(updatedService);
    } catch (error) {
      console.error("Error updating laundry service:", error);
      res.status(500).json({ message: "Failed to update laundry service" });
    }
  });

  app.delete("/api/laundry-services/:id", requireAdminOrSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req.user as UserWithBranch).id;
      const deleted = await storage.deleteLaundryService(id, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Laundry service not found" });
      }
      res.json({ message: "Laundry service deleted successfully" });
    } catch (error) {
      console.error("Error deleting laundry service:", error);
      res.status(500).json({ message: "Failed to delete laundry service" });
    }
  });

  // Item-service price management
  app.post("/api/item-service-prices", requireAdminOrSuperAdmin, async (req, res) => {
    try {
      const data = insertItemServicePriceSchema.parse(req.body);
      const record = await storage.createItemServicePrice(data);
      res.json(record);
    } catch (error) {
      console.error("Error creating item service price:", error);
      res.status(500).json({ message: "Failed to create item service price" });
    }
  });

  app.put("/api/item-service-prices", requireAdminOrSuperAdmin, async (req, res) => {
    try {
      const data = insertItemServicePriceSchema.parse(req.body);
      const updated = await storage.updateItemServicePrice(
        data.clothingItemId,
        data.serviceId,
        data.price,
      );
      if (!updated) {
        return res.status(404).json({ message: "Item service price not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating item service price:", error);
      res.status(500).json({ message: "Failed to update item service price" });
    }
  });

  app.delete("/api/item-service-prices", requireAdminOrSuperAdmin, async (req, res) => {
    try {
      const { clothingItemId, serviceId } = req.body as {
        clothingItemId: string;
        serviceId: string;
      };
      const deleted = await storage.deleteItemServicePrice(clothingItemId, serviceId);
      res.json({ success: deleted });
    } catch (error) {
      console.error("Error deleting item service price:", error);
      res.status(500).json({ message: "Failed to delete item service price" });
    }
  });

  // Transactions routes
  app.post("/api/transactions", requireAuth, async (req, res) => {
    try {
      const user = req.user as UserWithBranch;
      if (!user.branchId) {
        return res.status(400).json({ message: "User branch not set" });
      }

      const { customerId, loyaltyPointsEarned = 0, loyaltyPointsRedeemed = 0 } = req.body;
      const validatedData = insertTransactionSchema.parse(req.body);

      const transaction = await storage.createTransaction({
        ...validatedData,
        branchId: user.branchId,
      });

      if (customerId) {
        const customer = await storage.getCustomer(customerId);
        if (customer) {
          const newPoints = customer.loyaltyPoints + (loyaltyPointsEarned - loyaltyPointsRedeemed);
          await storage.updateCustomer(customerId, { loyaltyPoints: newPoints });
          if (loyaltyPointsEarned > 0) {
            await storage.createLoyaltyHistory({
              customerId,
              change: loyaltyPointsEarned,
              description: `Earned from transaction ${transaction.id}`,
            });
          }
          if (loyaltyPointsRedeemed > 0) {
            await storage.createLoyaltyHistory({
              customerId,
              change: -loyaltyPointsRedeemed,
              description: `Redeemed in transaction ${transaction.id}`,
            });
          }
        }
      }

      res.json(transaction);
    } catch (error) {
      console.error("Transaction creation error:", error);
      res.status(400).json({ message: "Failed to create transaction" });
    }
  });

  app.get("/api/transactions", requireAuth, async (req, res) => {
    try {
      const user = req.user as UserWithBranch;
      const transactions = await storage.getTransactions(user.branchId || undefined);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.get("/api/transactions/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user as UserWithBranch;
      const transaction = await storage.getTransaction(req.params.id, user.branchId || undefined);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transaction" });
    }
  });

  // Customer Management Routes
  app.get("/api/customers", requireAuth, async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get("/api/customers/:id", requireAuth, async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  app.get("/api/customers/phone/:phoneNumber", requireAuth, async (req, res) => {
    try {
      const customer = await storage.getCustomerByPhone(req.params.phoneNumber);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  app.post("/api/customers", requireAuth, async (req, res) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error) {
      res.status(400).json({ message: "Invalid customer data" });
    }
  });

  app.patch("/api/customers/:id", requireAuth, async (req, res) => {
    try {
      const customer = await storage.updateCustomer(req.params.id, req.body);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Failed to update customer" });
    }
  });

  // Order Management Routes
  app.get("/api/orders", requireAuth, async (req, res) => {
    try {
      const { status } = req.query;
      const user = req.user as UserWithBranch;
      let orders;
      if (status && typeof status === 'string') {
        orders = await storage.getOrdersByStatus(status, user.branchId || undefined);
      } else {
        orders = await storage.getOrders(user.branchId || undefined);
      }
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user as UserWithBranch;
      const order = await storage.getOrder(req.params.id, user.branchId || undefined);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.get("/api/customers/:customerId/orders", requireAuth, async (req, res) => {
    try {
      const user = req.user as UserWithBranch;
      const orders = await storage.getOrdersByCustomer(req.params.customerId, user.branchId || undefined);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer orders" });
    }
  });

  app.post("/api/orders", requireAuth, async (req, res) => {
    try {
      const user = req.user as UserWithBranch;
      if (!user.branchId) {
        return res.status(400).json({ message: "User branch not set" });
      }
      const { loyaltyPointsEarned = 0, loyaltyPointsRedeemed = 0 } = req.body;
      const orderData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder({ ...orderData, branchId: user.branchId });

      // If payment method is pay_later, update customer balance
      if (order.paymentMethod === 'pay_later' && order.customerId) {
        const customer = await storage.getCustomer(order.customerId);
        if (customer) {
          const orderAmount = parseFloat(order.total);
          const updatedBalance = parseFloat(customer.balanceDue) + orderAmount;

          await storage.updateCustomer(order.customerId, {
            balanceDue: updatedBalance.toString()
          });
        }
      }

      if (order.customerId) {
        const customer = await storage.getCustomer(order.customerId);
        if (customer) {
          const newPoints = customer.loyaltyPoints + (loyaltyPointsEarned - loyaltyPointsRedeemed);
          await storage.updateCustomer(order.customerId, { loyaltyPoints: newPoints });
          if (loyaltyPointsEarned > 0) {
            await storage.createLoyaltyHistory({
              customerId: order.customerId,
              change: loyaltyPointsEarned,
              description: `Earned from order ${order.id}`,
            });
          }
          if (loyaltyPointsRedeemed > 0) {
            await storage.createLoyaltyHistory({
              customerId: order.customerId,
              change: -loyaltyPointsRedeemed,
              description: `Redeemed in order ${order.id}`,
            });
          }
        }
      }

      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(400).json({ message: "Invalid order data" });
    }
  });

  app.patch("/api/orders/:id", requireAuth, async (req, res) => {
    try {
      const order = await storage.updateOrder(req.params.id, req.body);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  app.patch("/api/orders/:id/status", requireAuth, async (req, res) => {
    try {
      const { status, notify } = req.body as { status: string; notify?: boolean };
      const order = await storage.updateOrderStatus(req.params.id, status);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (notify) {
        const channels: ("sms" | "email")[] = [];
        if (order.customerPhone) {
          console.log(`SMS sent to ${order.customerPhone} for order ${order.orderNumber} status ${status}`);
          channels.push("sms");
        }
        if (order.customerId) {
          const customer = await storage.getCustomer(order.customerId);
          if (customer?.email) {
            console.log(`Email sent to ${customer.email} for order ${order.orderNumber} status ${status}`);
            channels.push("email");
          }
        }
        await Promise.all(
          channels.map((type) => storage.createNotification({ orderId: order.id, type }))
        );
      }

      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Payment Management Routes
  app.get("/api/payments", requireAuth, async (req, res) => {
    try {
      const user = req.user as UserWithBranch;
      const payments = await storage.getPayments(user.branchId || undefined);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.get("/api/customers/:customerId/payments", requireAuth, async (req, res) => {
    try {
      const user = req.user as UserWithBranch;
      const payments = await storage.getPaymentsByCustomer(req.params.customerId, user.branchId || undefined);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer payments" });
    }
  });

  app.post("/api/payments", requireAuth, async (req, res) => {
    try {
      const user = req.user as UserWithBranch;
      const paymentData = insertPaymentSchema.parse(req.body);
      if (paymentData.orderId) {
        const order = await storage.getOrder(paymentData.orderId, user.branchId || undefined);
        if (!order) {
          return res.status(404).json({ message: "Order not found" });
        }
      }
      const payment = await storage.createPayment(paymentData);
      
      // Update customer balance when payment is received
      await storage.updateCustomerBalance(payment.customerId, -parseFloat(payment.amount));
      
      res.status(201).json(payment);
    } catch (error) {
      res.status(400).json({ message: "Invalid payment data" });
    }
  });

  app.post("/api/receipts/email", requireAuth, async (req, res) => {
    try {
      const { email, html } = req.body as { email?: string; html?: string };
      if (!email || !html) {
        return res.status(400).json({ message: "Email and receipt content required" });
      }

      if (!process.env.SMTP_HOST) {
        return res.status(500).json({ message: "Email service not configured" });
      }

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587", 10),
        secure: process.env.SMTP_SECURE === "true",
        auth: process.env.SMTP_USER
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            }
          : undefined,
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject: "Your Receipt",
        html,
      });

      res.json({ message: "Receipt emailed successfully" });
    } catch (error) {
      console.error("Error sending receipt email:", error);
      res.status(500).json({ message: "Failed to send receipt email" });
    }
  });

  // Reports routes
  app.get("/api/reports/orders", requireAdminOrSuperAdmin, async (req, res) => {
    try {
      const range = (req.query.range as string) || "daily";
      const user = req.user as UserWithBranch;
      const summary = await storage.getSalesSummary(range, user.branchId || undefined);
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order reports" });
    }
  });

  app.get("/api/reports/top-services", requireAdminOrSuperAdmin, async (req, res) => {
    try {
      const range = (req.query.range as string) || "daily";
      const user = req.user as UserWithBranch;
      const services = await storage.getTopServices(range, user.branchId || undefined);
      res.json({ services });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch top services" });
    }
  });

  app.get("/api/reports/top-products", requireAdminOrSuperAdmin, async (req, res) => {
    try {
      const range = (req.query.range as string) || "daily";
      const user = req.user as UserWithBranch;
      const products = await storage.getTopProducts(range, user.branchId || undefined);
      res.json({ products });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch top products" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
