import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTransactionSchema, insertClothingItemSchema, insertLaundryServiceSchema, insertUserSchema, updateUserSchema, insertCategorySchema, insertBranchSchema, insertCustomerSchema, insertOrderSchema, insertPaymentSchema, insertSecuritySettingsSchema } from "@shared/schema";
import { setupAuth, requireAuth, requireSuperAdmin, requireAdminOrSuperAdmin } from "./auth";
import passport from "passport";
import type { UserWithBranch } from "@shared/schema";
import nodemailer from "nodemailer";

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

  // Category management routes (Admin or Super Admin)
  app.get("/api/categories", requireAdminOrSuperAdmin, async (req, res) => {
    try {
      const type = req.query.type as string;
      const categories = type 
        ? await storage.getCategoriesByType(type)
        : await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", requireAdminOrSuperAdmin, async (req, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const newCategory = await storage.createCategory(validatedData);
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
      const updatedCategory = await storage.updateCategory(id, validatedData);
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
      const deleted = await storage.deleteCategory(id);
      if (!deleted) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

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
  app.get("/api/products", async (req, res) => {
    try {
      const category = req.query.category as string;
      const search = req.query.search as string;

      let items = category
        ? await storage.getProductsByCategory(category)
        : await storage.getProducts();

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
          item.nameAr?.toLowerCase().includes(search.toLowerCase()) ||
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
      const validatedData = insertClothingItemSchema.partial().parse(req.body);
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
          service.nameAr?.toLowerCase().includes(search.toLowerCase()) ||
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
      const validatedData = insertLaundryServiceSchema.partial().parse(req.body);
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

  app.post("/api/receipts/email", async (req, res) => {
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
