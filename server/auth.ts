import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import type { User } from "@shared/schema";

// Hardcoded super admin credentials for development/testing
const hardcodedAdmin: User = {
  id: "superadmin",
  username: "superadmin",
  email: null,
  passwordHash: "",
  firstName: "Super",
  lastName: "Admin",
  role: "super_admin",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  const sessionSecret = process.env.SESSION_SECRET || 'fallback-secret-for-development';
  
  return session({
    secret: sessionSecret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Local strategy for username/password authentication
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Check hardcoded credentials first
        if (username === hardcodedAdmin.username && password === "admin123") {
          return done(null, hardcodedAdmin);
        }

        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Invalid username or password" });
        }

        if (!user.isActive) {
          return done(null, false, { message: "Account is disabled" });
        }

        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        if (!isValidPassword) {
          return done(null, false, { message: "Invalid username or password" });
        }

        return done(null, user);
      } catch (error) {
        console.error(`Login error:`, error);
        return done(error);
      }
    })
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      if (id === hardcodedAdmin.id) {
        return done(null, hardcodedAdmin);
      }
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
}

export const requireAuth: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Authentication required" });
};

export const requireSuperAdmin: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated() && (req.user as User)?.role === 'super_admin') {
    return next();
  }
  res.status(403).json({ message: "Super admin access required" });
};

export const requireAdminOrSuperAdmin: RequestHandler = (req, res, next) => {
  const user = req.user as User;
  if (req.isAuthenticated() && (user?.role === 'admin' || user?.role === 'super_admin')) {
    return next();
  }
  res.status(403).json({ message: "Admin access required" });
};