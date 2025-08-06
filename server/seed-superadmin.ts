import bcrypt from "bcryptjs";
import { storage } from "./storage";

export async function seedSuperAdmin() {
  const existing = await storage.getUser("superadmin");
  if (!existing) {
    const passwordHash = await bcrypt.hash("admin123", 10);
    await storage.upsertUser({
      id: "superadmin",
      username: "superadmin",
      email: null,
      passwordHash,
      firstName: "Super",
      lastName: "Admin",
      role: "super_admin",
      isActive: true,
      branchId: null,
    });
  }
}
