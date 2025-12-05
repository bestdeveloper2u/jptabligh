import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import { z } from "zod";
import {
  insertUserSchema,
  loginSchema,
  insertMosqueSchema,
  insertHalqaSchema,
  insertTakajaSchema,
  type User,
} from "@shared/schema";
import { fromError } from "zod-validation-error";

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

// Authentication middleware
async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const user = await storage.getUser(req.session.userId);
  if (!user) {
    req.session.destroy(() => {});
    return res.status(401).json({ error: "User not found" });
  }

  (req as any).user = user;
  next();
}

// Role-based access middleware
function requireRole(...roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as User;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "jamalpur-tabligh-secret-key-2024",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      },
    })
  );

  // ===== Authentication Routes =====
  
  // Register
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if this is an authenticated request (manager adding a member)
      let authenticatedUser: User | undefined;
      if (req.session.userId) {
        authenticatedUser = await storage.getUser(req.session.userId);
      }
      
      // If authenticated as manager, force thana to manager's thana
      let effectiveThanaId = validatedData.thanaId;
      if (authenticatedUser?.role === "manager") {
        if (!authenticatedUser.thanaId) {
          return res.status(403).json({ error: "ম্যানেজারের থানা নির্ধারিত নেই" });
        }
        // Force thanaId to manager's thana (ignore any supplied thanaId)
        effectiveThanaId = authenticatedUser.thanaId;
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByPhone(validatedData.phone);
      if (existingUser) {
        return res.status(400).json({ error: "ইতিমধ্যে এই নাম্বার দিয়ে রেজিস্ট্রেশন করা হয়েছে" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);

      // Create user - force role to "member" and use effective thanaId for registration
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
        role: "member", // Always set role to member for registration
        thanaId: effectiveThanaId, // Use effective thanaId (forced for managers)
      });

      // Update halqa members count if user is a member and has a halqaId
      if (user.role === "member" && user.halqaId) {
        await storage.updateHalqaMembersCount(user.halqaId);
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      // Only create session for unauthenticated (self-registration)
      if (!authenticatedUser) {
        req.session.userId = user.id;
      }

      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromError(error);
        return res.status(400).json({ error: validationError.toString() });
      }
      console.error("Registration error:", error);
      res.status(500).json({ error: "রেজিস্ট্রেশন ব্যর্থ হয়েছে" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { phone, password } = loginSchema.parse(req.body);

      const user = await storage.getUserByPhone(phone);
      if (!user) {
        return res.status(401).json({ error: "ফোন নাম্বার বা পাসওয়ার্ড ভুল" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "ফোন নাম্বার বা পাসওয়ার্ড ভুল" });
      }

      // Create session
      req.session.userId = user.id;

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromError(error);
        return res.status(400).json({ error: validationError.toString() });
      }
      console.error("Login error:", error);
      res.status(500).json({ error: "লগইন ব্যর্থ হয়েছে" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "লগআউট ব্যর্থ হয়েছে" });
      }
      res.json({ success: true });
    });
  });

  // Get current user
  app.get("/api/auth/me", requireAuth, (req, res) => {
    const user = (req as any).user;
    const { password, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  });

  // Helper function to get manager's thanaId restriction
  function getManagerThanaRestriction(user: User): string | null {
    if (user.role === "manager" && user.thanaId) {
      return user.thanaId;
    }
    return null;
  }

  // ===== Thana Routes =====
  
  app.get("/api/thanas", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user as User;
      const managerThanaId = getManagerThanaRestriction(user);
      
      if (managerThanaId) {
        const thana = await storage.getThana(managerThanaId);
        res.json({ thanas: thana ? [thana] : [] });
      } else {
        const thanas = await storage.getAllThanas();
        res.json({ thanas });
      }
    } catch (error) {
      console.error("Get thanas error:", error);
      res.status(500).json({ error: "থানা তালিকা লোড করতে ব্যর্থ হয়েছে" });
    }
  });

  // ===== Union Routes =====
  
  app.get("/api/unions", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user as User;
      const managerThanaId = getManagerThanaRestriction(user);
      const { thanaId } = req.query;
      
      const effectiveThanaId = managerThanaId || (thanaId && thanaId !== "all" ? thanaId as string : null);
      
      const unions = effectiveThanaId
        ? await storage.getUnionsByThana(effectiveThanaId)
        : await storage.getAllUnions();
        
      res.json({ unions });
    } catch (error) {
      console.error("Get unions error:", error);
      res.status(500).json({ error: "ইউনিয়ন তালিকা লোড করতে ব্যর্থ হয়েছে" });
    }
  });

  // ===== Mosque Routes =====
  
  app.get("/api/mosques", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user as User;
      const managerThanaId = getManagerThanaRestriction(user);
      const { search, thanaId, unionId, halqaId } = req.query;

      const effectiveThanaId = managerThanaId || (thanaId && thanaId !== "all" ? thanaId as string : undefined);

      let mosques;
      if (search || effectiveThanaId || (unionId && unionId !== "all") || (halqaId && halqaId !== "all")) {
        mosques = await storage.filterMosques(
          search as string,
          effectiveThanaId,
          unionId as string,
          halqaId as string
        );
      } else {
        mosques = await storage.getAllMosques();
      }

      res.json({ mosques });
    } catch (error) {
      console.error("Get mosques error:", error);
      res.status(500).json({ error: "মসজিদ তালিকা লোড করতে ব্যর্থ হয়েছে" });
    }
  });

  app.post("/api/mosques", requireAuth, requireRole("super_admin", "manager"), async (req, res) => {
    try {
      const user = (req as any).user as User;
      const managerThanaId = getManagerThanaRestriction(user);
      
      const validatedData = insertMosqueSchema.parse(req.body);
      
      // Manager restriction: only allow creating mosques in their thana
      if (managerThanaId && validatedData.thanaId !== managerThanaId) {
        return res.status(403).json({ error: "শুধুমাত্র আপনার থানার মসজিদ যোগ করতে পারবেন" });
      }
      
      const mosque = await storage.createMosque(validatedData);
      res.json({ mosque });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromError(error);
        return res.status(400).json({ error: validationError.toString() });
      }
      console.error("Create mosque error:", error);
      res.status(500).json({ error: "মসজিদ যোগ করতে ব্যর্থ হয়েছে" });
    }
  });

  app.put("/api/mosques/:id", requireAuth, requireRole("super_admin", "manager"), async (req, res) => {
    try {
      const user = (req as any).user as User;
      const managerThanaId = getManagerThanaRestriction(user);
      
      // First get the existing mosque to check thana
      const existingMosque = await storage.getMosque(req.params.id);
      if (!existingMosque) {
        return res.status(404).json({ error: "মসজিদ পাওয়া যায়নি" });
      }
      
      // Manager restriction: only allow updating mosques in their thana
      if (managerThanaId && existingMosque.thanaId !== managerThanaId) {
        return res.status(403).json({ error: "শুধুমাত্র আপনার থানার মসজিদ আপডেট করতে পারবেন" });
      }
      
      // Also check if trying to move to a different thana
      if (managerThanaId && req.body.thanaId && req.body.thanaId !== managerThanaId) {
        return res.status(403).json({ error: "মসজিদ অন্য থানায় স্থানান্তর করতে পারবেন না" });
      }
      
      const mosque = await storage.updateMosque(req.params.id, req.body);
      res.json({ mosque });
    } catch (error) {
      console.error("Update mosque error:", error);
      res.status(500).json({ error: "মসজিদ আপডেট করতে ব্যর্থ হয়েছে" });
    }
  });

  app.delete("/api/mosques/:id", requireAuth, requireRole("super_admin", "manager"), async (req, res) => {
    try {
      const user = (req as any).user as User;
      const managerThanaId = getManagerThanaRestriction(user);
      
      // First get the existing mosque to check thana
      const existingMosque = await storage.getMosque(req.params.id);
      if (!existingMosque) {
        return res.status(404).json({ error: "মসজিদ পাওয়া যায়নি" });
      }
      
      // Manager restriction: only allow deleting mosques in their thana
      if (managerThanaId && existingMosque.thanaId !== managerThanaId) {
        return res.status(403).json({ error: "শুধুমাত্র আপনার থানার মসজিদ মুছে ফেলতে পারবেন" });
      }
      
      const deleted = await storage.deleteMosque(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete mosque error:", error);
      res.status(500).json({ error: "মসজিদ মুছে ফেলতে ব্যর্থ হয়েছে" });
    }
  });

  // ===== Halqa Routes =====
  
  app.get("/api/halqas", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user as User;
      const managerThanaId = getManagerThanaRestriction(user);
      const { search, thanaId, unionId } = req.query;

      const effectiveThanaId = managerThanaId || (thanaId && thanaId !== "all" ? thanaId as string : undefined);

      let halqas;
      if (search || effectiveThanaId || (unionId && unionId !== "all")) {
        halqas = await storage.filterHalqas(
          search as string,
          effectiveThanaId,
          unionId as string
        );
      } else {
        halqas = await storage.getAllHalqas();
      }

      res.json({ halqas });
    } catch (error) {
      console.error("Get halqas error:", error);
      res.status(500).json({ error: "হালকা তালিকা লোড করতে ব্যর্থ হয়েছে" });
    }
  });

  app.post("/api/halqas", requireAuth, requireRole("super_admin", "manager"), async (req, res) => {
    try {
      const user = (req as any).user as User;
      const managerThanaId = getManagerThanaRestriction(user);
      
      const validatedData = insertHalqaSchema.parse(req.body);
      
      // Manager restriction: only allow creating halqas in their thana
      if (managerThanaId && validatedData.thanaId !== managerThanaId) {
        return res.status(403).json({ error: "শুধুমাত্র আপনার থানার হালকা যোগ করতে পারবেন" });
      }
      
      const halqa = await storage.createHalqa(validatedData);
      res.json({ halqa });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromError(error);
        return res.status(400).json({ error: validationError.toString() });
      }
      console.error("Create halqa error:", error);
      res.status(500).json({ error: "হালকা যোগ করতে ব্যর্থ হয়েছে" });
    }
  });

  app.put("/api/halqas/:id", requireAuth, requireRole("super_admin", "manager"), async (req, res) => {
    try {
      const user = (req as any).user as User;
      const managerThanaId = getManagerThanaRestriction(user);
      
      // First get the existing halqa to check thana
      const existingHalqa = await storage.getHalqa(req.params.id);
      if (!existingHalqa) {
        return res.status(404).json({ error: "হালকা পাওয়া যায়নি" });
      }
      
      // Manager restriction: only allow updating halqas in their thana
      if (managerThanaId && existingHalqa.thanaId !== managerThanaId) {
        return res.status(403).json({ error: "শুধুমাত্র আপনার থানার হালকা আপডেট করতে পারবেন" });
      }
      
      // Also check if trying to move to a different thana
      if (managerThanaId && req.body.thanaId && req.body.thanaId !== managerThanaId) {
        return res.status(403).json({ error: "হালকা অন্য থানায় স্থানান্তর করতে পারবেন না" });
      }
      
      const halqa = await storage.updateHalqa(req.params.id, req.body);
      res.json({ halqa });
    } catch (error) {
      console.error("Update halqa error:", error);
      res.status(500).json({ error: "হালকা আপডেট করতে ব্যর্থ হয়েছে" });
    }
  });

  app.delete("/api/halqas/:id", requireAuth, requireRole("super_admin", "manager"), async (req, res) => {
    try {
      const user = (req as any).user as User;
      const managerThanaId = getManagerThanaRestriction(user);
      
      // First get the existing halqa to check thana
      const existingHalqa = await storage.getHalqa(req.params.id);
      if (!existingHalqa) {
        return res.status(404).json({ error: "হালকা পাওয়া যায়নি" });
      }
      
      // Manager restriction: only allow deleting halqas in their thana
      if (managerThanaId && existingHalqa.thanaId !== managerThanaId) {
        return res.status(403).json({ error: "শুধুমাত্র আপনার থানার হালকা মুছে ফেলতে পারবেন" });
      }
      
      const deleted = await storage.deleteHalqa(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete halqa error:", error);
      res.status(500).json({ error: "হালকা মুছে ফেলতে ব্যর্থ হয়েছে" });
    }
  });

  // ===== Member/User Routes =====
  
  app.get("/api/members", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user as User;
      const managerThanaId = getManagerThanaRestriction(user);
      const { search, thanaId, unionId, role, halqaId, mosqueId } = req.query;

      // Determine target role - default to "member" if not provided or empty
      const roleString = typeof role === "string" && role.trim() !== "" ? role.trim() : "member";
      
      // Restrict manager queries to super_admin only
      if (roleString === "manager" && user.role !== "super_admin") {
        return res.status(403).json({ error: "আপনার এই অপারেশন করার অনুমতি নেই" });
      }
      
      // Apply manager thana restriction
      const effectiveThanaId = managerThanaId || (thanaId && thanaId !== "all" ? thanaId as string : undefined);
      
      // Always use searchUsers which handles all filtering including role
      const members = await storage.searchUsers(
        (search as string) || "",
        effectiveThanaId,
        unionId as string,
        roleString,
        halqaId as string,
        mosqueId as string
      );

      // Remove passwords
      const membersWithoutPasswords = members.map(({ password, ...member }) => member);

      res.json({ members: membersWithoutPasswords });
    } catch (error) {
      console.error("Get members error:", error);
      res.status(500).json({ error: "সাথী তালিকা লোড করতে ব্যর্থ হয়েছে" });
    }
  });

  app.put("/api/members/:id", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user as User;
      const targetId = req.params.id;
      const managerThanaId = getManagerThanaRestriction(user);

      // Users can only update their own profile unless they're admin/manager
      if (user.id !== targetId && !["super_admin", "manager"].includes(user.role)) {
        return res.status(403).json({ error: "অনুমতি নেই" });
      }

      // Get old member data to check halqaId change and thana restriction
      const oldMember = await storage.getUser(targetId);
      if (!oldMember) {
        return res.status(404).json({ error: "সাথী পাওয়া যায়নি" });
      }
      
      const oldHalqaId = oldMember.halqaId;
      
      // Manager restriction: only allow updating members in their thana
      if (managerThanaId && user.id !== targetId && oldMember.thanaId !== managerThanaId) {
        return res.status(403).json({ error: "শুধুমাত্র আপনার থানার সাথী আপডেট করতে পারবেন" });
      }
      
      // Also check if trying to move to a different thana
      if (managerThanaId && req.body.thanaId && req.body.thanaId !== managerThanaId) {
        return res.status(403).json({ error: "সাথী অন্য থানায় স্থানান্তর করতে পারবেন না" });
      }

      const member = await storage.updateUser(targetId, req.body);
      if (!member) {
        return res.status(404).json({ error: "সাথী পাওয়া যায়নি" });
      }

      // Update halqa members count if halqaId changed
      if (member.role === "member") {
        if (oldHalqaId && oldHalqaId !== member.halqaId) {
          await storage.updateHalqaMembersCount(oldHalqaId);
        }
        if (member.halqaId && member.halqaId !== oldHalqaId) {
          await storage.updateHalqaMembersCount(member.halqaId);
        }
      }

      const { password, ...memberWithoutPassword } = member;
      res.json({ member: memberWithoutPassword });
    } catch (error) {
      console.error("Update member error:", error);
      res.status(500).json({ error: "সাথী আপডেট করতে ব্যর্থ হয়েছে" });
    }
  });

  app.delete("/api/members/:id", requireAuth, requireRole("super_admin"), async (req, res) => {
    try {
      // Get member data before deletion to get halqaId
      const member = await storage.getUser(req.params.id);
      const halqaId = member?.halqaId;
      const isMember = member?.role === "member";

      const deleted = await storage.deleteUser(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "সাথী পাওয়া যায়নি" });
      }

      // Update halqa members count after deletion
      if (isMember && halqaId) {
        await storage.updateHalqaMembersCount(halqaId);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Delete member error:", error);
      res.status(500).json({ error: "সাথী মুছে ফেলতে ব্যর্থ হয়েছে" });
    }
  });

  // ===== Manager Routes (Super Admin Only) =====
  
  app.get("/api/managers", requireAuth, requireRole("super_admin"), async (req, res) => {
    try {
      const managers = await storage.getUsersByRole("manager");
      const managersWithoutPasswords = managers.map(({ password, ...manager }) => manager);
      res.json({ managers: managersWithoutPasswords });
    } catch (error) {
      console.error("Get managers error:", error);
      res.status(500).json({ error: "ম্যানেজার তালিকা লোড করতে ব্যর্থ হয়েছে" });
    }
  });

  app.post("/api/managers", requireAuth, requireRole("super_admin"), async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse({
        ...req.body,
        role: "manager",
      });

      // Check if manager already exists
      const existingUser = await storage.getUserByPhone(validatedData.phone);
      if (existingUser) {
        return res.status(400).json({ error: "ইতিমধ্যে এই নাম্বার দিয়ে রেজিস্ট্রেশন করা হয়েছে" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);

      const manager = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
      });

      const { password, ...managerWithoutPassword } = manager;
      res.json({ manager: managerWithoutPassword });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromError(error);
        return res.status(400).json({ error: validationError.toString() });
      }
      console.error("Create manager error:", error);
      res.status(500).json({ error: "ম্যানেজার যোগ করতে ব্যর্থ হয়েছে" });
    }
  });

  app.delete("/api/managers/:id", requireAuth, requireRole("super_admin"), async (req, res) => {
    try {
      const deleted = await storage.deleteUser(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "ম্যানেজার পাওয়া যায়নি" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete manager error:", error);
      res.status(500).json({ error: "ম্যানেজার মুছে ফেলতে ব্যর্থ হয়েছে" });
    }
  });

  // ===== CSV Import Routes =====

  // CSV row validation schemas
  const csvMemberSchema = z.object({
    name: z.string().min(2, "নাম কমপক্ষে ২ অক্ষর হতে হবে"),
    phone: z.string().min(11, "ফোন নাম্বার কমপক্ষে ১১ সংখ্যার হতে হবে"),
    email: z.string().email().optional().or(z.literal('')),
    thana: z.string().min(1, "থানার নাম প্রয়োজন"),
    union: z.string().min(1, "ইউনিয়নের নাম প্রয়োজন"),
    tabligActivities: z.array(z.string()).optional(),
  });

  const csvMosqueSchema = z.object({
    name: z.string().min(2, "মসজিদের নাম কমপক্ষে ২ অক্ষর হতে হবে"),
    address: z.string().optional(),
    imamPhone: z.string().optional(),
    muazzinPhone: z.string().optional(),
    thana: z.string().min(1, "থানার নাম প্রয়োজন"),
    union: z.string().min(1, "ইউনিয়নের নাম প্রয়োজন"),
  });

  const csvHalqaSchema = z.object({
    name: z.string().min(2, "হালকার নাম কমপক্ষে ২ অক্ষর হতে হবে"),
    thana: z.string().min(1, "থানার নাম প্রয়োজন"),
    union: z.string().min(1, "ইউনিয়নের নাম প্রয়োজন"),
  });

  // Import members from CSV
  app.post("/api/import/members", requireAuth, requireRole("super_admin", "manager"), async (req, res) => {
    try {
      const user = (req as any).user as User;
      const managerThanaId = getManagerThanaRestriction(user);
      
      const { members } = req.body;
      if (!Array.isArray(members) || members.length === 0) {
        return res.status(400).json({ error: "কোন ডেটা পাওয়া যায়নি" });
      }

      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[],
      };

      for (let i = 0; i < members.length; i++) {
        const member = members[i];
        const rowNum = i + 2; // +2 because row 1 is header
        
        try {
          // Validate row with Zod
          const validationResult = csvMemberSchema.safeParse(member);
          if (!validationResult.success) {
            results.failed++;
            results.errors.push(`সারি ${rowNum}: ${validationResult.error.errors[0]?.message}`);
            continue;
          }

          const validatedMember = validationResult.data;

          // Find thana by name
          const thana = await storage.getThanaByName(validatedMember.thana);
          if (!thana) {
            results.failed++;
            results.errors.push(`সারি ${rowNum}: থানা পাওয়া যায়নি - ${validatedMember.thana}`);
            continue;
          }

          // Manager restriction: only allow importing to their own thana
          if (managerThanaId && thana.id !== managerThanaId) {
            results.failed++;
            results.errors.push(`সারি ${rowNum}: শুধুমাত্র আপনার থানার ডেটা ইমপোর্ট করতে পারবেন`);
            continue;
          }

          // Find union by name
          const union = await storage.getUnionByName(validatedMember.union, thana.id);
          if (!union) {
            results.failed++;
            results.errors.push(`সারি ${rowNum}: ইউনিয়ন পাওয়া যায়নি - ${validatedMember.union}`);
            continue;
          }

          // Check if user already exists
          const existingUser = await storage.getUserByPhone(validatedMember.phone);
          if (existingUser) {
            results.failed++;
            results.errors.push(`সারি ${rowNum}: ফোন নাম্বার আছে - ${validatedMember.phone}`);
            continue;
          }

          // Hash password (use phone as default password)
          const hashedPassword = await bcrypt.hash(validatedMember.phone, 10);

          // Create user
          await storage.createUser({
            name: validatedMember.name,
            phone: validatedMember.phone,
            email: validatedMember.email || undefined,
            password: hashedPassword,
            thanaId: thana.id,
            unionId: union.id,
            role: "member",
            tabligActivities: validatedMember.tabligActivities || [],
          });

          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push(`সারি ${rowNum}: ত্রুটি - ${member.name || 'অজানা'}`);
        }
      }

      res.json({
        message: `${results.success} সাথী যোগ করা হয়েছে, ${results.failed} ব্যর্থ`,
        results,
      });
    } catch (error) {
      console.error("Import members error:", error);
      res.status(500).json({ error: "সাথী ইমপোর্ট করতে ব্যর্থ হয়েছে" });
    }
  });

  // Import mosques from CSV
  app.post("/api/import/mosques", requireAuth, requireRole("super_admin", "manager"), async (req, res) => {
    try {
      const user = (req as any).user as User;
      const managerThanaId = getManagerThanaRestriction(user);
      
      const { mosques: mosquesList } = req.body;
      if (!Array.isArray(mosquesList) || mosquesList.length === 0) {
        return res.status(400).json({ error: "কোন ডেটা পাওয়া যায়নি" });
      }

      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[],
      };

      for (let i = 0; i < mosquesList.length; i++) {
        const mosque = mosquesList[i];
        const rowNum = i + 2;
        
        try {
          // Validate row with Zod
          const validationResult = csvMosqueSchema.safeParse(mosque);
          if (!validationResult.success) {
            results.failed++;
            results.errors.push(`সারি ${rowNum}: ${validationResult.error.errors[0]?.message}`);
            continue;
          }

          const validatedMosque = validationResult.data;

          // Find thana by name
          const thana = await storage.getThanaByName(validatedMosque.thana);
          if (!thana) {
            results.failed++;
            results.errors.push(`সারি ${rowNum}: থানা পাওয়া যায়নি - ${validatedMosque.thana}`);
            continue;
          }

          // Manager restriction: only allow importing to their own thana
          if (managerThanaId && thana.id !== managerThanaId) {
            results.failed++;
            results.errors.push(`সারি ${rowNum}: শুধুমাত্র আপনার থানার ডেটা ইমপোর্ট করতে পারবেন`);
            continue;
          }

          // Find union by name
          const union = await storage.getUnionByName(validatedMosque.union, thana.id);
          if (!union) {
            results.failed++;
            results.errors.push(`সারি ${rowNum}: ইউনিয়ন পাওয়া যায়নি - ${validatedMosque.union}`);
            continue;
          }

          // Create mosque
          await storage.createMosque({
            name: validatedMosque.name,
            address: validatedMosque.address || "",
            thanaId: thana.id,
            unionId: union.id,
            imamPhone: validatedMosque.imamPhone || undefined,
            muazzinPhone: validatedMosque.muazzinPhone || undefined,
          });

          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push(`সারি ${rowNum}: ত্রুটি - ${mosque.name || 'অজানা'}`);
        }
      }

      res.json({
        message: `${results.success} মসজিদ যোগ করা হয়েছে, ${results.failed} ব্যর্থ`,
        results,
      });
    } catch (error) {
      console.error("Import mosques error:", error);
      res.status(500).json({ error: "মসজিদ ইমপোর্ট করতে ব্যর্থ হয়েছে" });
    }
  });

  // Import halqas from CSV
  app.post("/api/import/halqas", requireAuth, requireRole("super_admin", "manager"), async (req, res) => {
    try {
      const user = (req as any).user as User;
      const managerThanaId = getManagerThanaRestriction(user);
      
      const { halqas: halqasList } = req.body;
      if (!Array.isArray(halqasList) || halqasList.length === 0) {
        return res.status(400).json({ error: "কোন ডেটা পাওয়া যায়নি" });
      }

      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[],
      };

      for (let i = 0; i < halqasList.length; i++) {
        const halqa = halqasList[i];
        const rowNum = i + 2;
        
        try {
          // Validate row with Zod
          const validationResult = csvHalqaSchema.safeParse(halqa);
          if (!validationResult.success) {
            results.failed++;
            results.errors.push(`সারি ${rowNum}: ${validationResult.error.errors[0]?.message}`);
            continue;
          }

          const validatedHalqa = validationResult.data;

          // Find thana by name
          const thana = await storage.getThanaByName(validatedHalqa.thana);
          if (!thana) {
            results.failed++;
            results.errors.push(`সারি ${rowNum}: থানা পাওয়া যায়নি - ${validatedHalqa.thana}`);
            continue;
          }

          // Manager restriction: only allow importing to their own thana
          if (managerThanaId && thana.id !== managerThanaId) {
            results.failed++;
            results.errors.push(`সারি ${rowNum}: শুধুমাত্র আপনার থানার ডেটা ইমপোর্ট করতে পারবেন`);
            continue;
          }

          // Find union by name
          const union = await storage.getUnionByName(validatedHalqa.union, thana.id);
          if (!union) {
            results.failed++;
            results.errors.push(`সারি ${rowNum}: ইউনিয়ন পাওয়া যায়নি - ${validatedHalqa.union}`);
            continue;
          }

          // Create halqa
          await storage.createHalqa({
            name: validatedHalqa.name,
            thanaId: thana.id,
            unionId: union.id,
          });

          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push(`সারি ${rowNum}: ত্রুটি - ${halqa.name || 'অজানা'}`);
        }
      }

      res.json({
        message: `${results.success} হালকা যোগ করা হয়েছে, ${results.failed} ব্যর্থ`,
        results,
      });
    } catch (error) {
      console.error("Import halqas error:", error);
      res.status(500).json({ error: "হালকা ইমপোর্ট করতে ব্যর্থ হয়েছে" });
    }
  });

  // ===== Dashboard Stats =====
  
  app.get("/api/stats", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user as User;
      const managerThanaId = getManagerThanaRestriction(user);

      let members, mosques, halqas;
      
      if (managerThanaId) {
        [members, mosques, halqas] = await Promise.all([
          storage.searchUsers("", managerThanaId, undefined, "member", undefined, undefined),
          storage.filterMosques(undefined, managerThanaId, undefined, undefined),
          storage.filterHalqas(undefined, managerThanaId, undefined),
        ]);
      } else {
        [members, mosques, halqas] = await Promise.all([
          storage.getUsersByRole("member"),
          storage.getAllMosques(),
          storage.getAllHalqas(),
        ]);
      }

      const stats = {
        totalMembers: members.length,
        totalMosques: mosques.length,
        totalHalqas: halqas.length,
        thisMonthTablig: members.filter(m => 
          m.tabligActivities && m.tabligActivities.length > 0
        ).length,
      };

      res.json({ stats });
    } catch (error) {
      console.error("Get stats error:", error);
      res.status(500).json({ error: "পরিসংখ্যান লোড করতে ব্যর্থ হয়েছে" });
    }
  });

  // ===== Settings Routes =====
  
  app.get("/api/settings", async (req, res) => {
    try {
      const allSettings = await storage.getAllSettings();
      const settingsMap: Record<string, string> = {};
      allSettings.forEach(s => {
        settingsMap[s.key] = s.value;
      });
      
      // Default values if not set
      if (!settingsMap.sabgujariDay) settingsMap.sabgujariDay = "thursday";
      if (!settingsMap.mashwaraDay) settingsMap.mashwaraDay = "monday";
      
      res.json({ settings: settingsMap });
    } catch (error) {
      console.error("Get settings error:", error);
      res.status(500).json({ error: "সেটিংস লোড করতে ব্যর্থ হয়েছে" });
    }
  });

  app.put("/api/settings", requireAuth, requireRole("super_admin"), async (req, res) => {
    try {
      const { key, value } = req.body;
      if (!key || value === undefined || value === null) {
        return res.status(400).json({ error: "কী এবং ভ্যালু প্রয়োজন" });
      }
      
      const setting = await storage.setSetting(key, value);
      res.json({ setting });
    } catch (error) {
      console.error("Update setting error:", error);
      res.status(500).json({ error: "সেটিংস আপডেট করতে ব্যর্থ হয়েছে" });
    }
  });

  // ===== Individual Member/Mosque/Halqa GET Routes =====

  app.get("/api/members/:id", requireAuth, async (req, res) => {
    try {
      const member = await storage.getUser(req.params.id);
      if (!member) {
        return res.status(404).json({ error: "সাথী পাওয়া যায়নি" });
      }
      const { password, ...memberWithoutPassword } = member;
      res.json({ member: memberWithoutPassword });
    } catch (error) {
      console.error("Get member error:", error);
      res.status(500).json({ error: "সাথী লোড করতে ব্যর্থ হয়েছে" });
    }
  });

  app.get("/api/mosques/:id", async (req, res) => {
    try {
      const mosque = await storage.getMosque(req.params.id);
      if (!mosque) {
        return res.status(404).json({ error: "মসজিদ পাওয়া যায়নি" });
      }
      res.json({ mosque });
    } catch (error) {
      console.error("Get mosque error:", error);
      res.status(500).json({ error: "মসজিদ লোড করতে ব্যর্থ হয়েছে" });
    }
  });

  app.get("/api/halqas/:id", async (req, res) => {
    try {
      const halqa = await storage.getHalqa(req.params.id);
      if (!halqa) {
        return res.status(404).json({ error: "হালকা পাওয়া যায়নি" });
      }
      res.json({ halqa });
    } catch (error) {
      console.error("Get halqa error:", error);
      res.status(500).json({ error: "হালকা লোড করতে ব্যর্থ হয়েছে" });
    }
  });

  // ===== Takaja (তাকাজা) Routes =====

  // Get current user's assigned takajas (notifications)
  app.get("/api/takajas/my", requireAuth, async (req, res) => {
    try {
      const currentUser = (req as any).user as User;
      const takajasList = await storage.getTakajasByAssignee(currentUser.id);
      res.json({ takajas: takajasList });
    } catch (error) {
      console.error("Get my takajas error:", error);
      res.status(500).json({ error: "তাকাজা লোড করতে ব্যর্থ হয়েছে" });
    }
  });

  // Get all takajas (with role-based filtering)
  app.get("/api/takajas", requireAuth, async (req, res) => {
    try {
      const { halqaId, assignedTo } = req.query;
      const currentUser = (req as any).user as User;
      let takajasList;
      
      // Members can only see their own assigned takajas
      if (currentUser.role === "member") {
        takajasList = await storage.getTakajasByAssignee(currentUser.id);
      } else if (halqaId) {
        takajasList = await storage.getTakajasByHalqa(halqaId as string);
      } else if (assignedTo) {
        takajasList = await storage.getTakajasByAssignee(assignedTo as string);
      } else {
        takajasList = await storage.getAllTakajas();
      }
      
      res.json({ takajas: takajasList });
    } catch (error) {
      console.error("Get takajas error:", error);
      res.status(500).json({ error: "তাকাজা লোড করতে ব্যর্থ হয়েছে" });
    }
  });

  // Get single takaja
  app.get("/api/takajas/:id", requireAuth, async (req, res) => {
    try {
      const takaja = await storage.getTakaja(req.params.id);
      if (!takaja) {
        return res.status(404).json({ error: "তাকাজা পাওয়া যায়নি" });
      }
      res.json({ takaja });
    } catch (error) {
      console.error("Get takaja error:", error);
      res.status(500).json({ error: "তাকাজা লোড করতে ব্যর্থ হয়েছে" });
    }
  });

  // Create takaja
  app.post("/api/takajas", requireAuth, async (req, res) => {
    try {
      const validatedData = insertTakajaSchema.parse(req.body);
      const takaja = await storage.createTakaja(validatedData);
      res.status(201).json({ takaja });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromError(error).message });
      }
      console.error("Create takaja error:", error);
      res.status(500).json({ error: "তাকাজা তৈরি করতে ব্যর্থ হয়েছে" });
    }
  });

  // Update takaja
  app.put("/api/takajas/:id", requireAuth, async (req, res) => {
    try {
      const validatedData = insertTakajaSchema.partial().parse(req.body);
      const takaja = await storage.updateTakaja(req.params.id, validatedData);
      if (!takaja) {
        return res.status(404).json({ error: "তাকাজা পাওয়া যায়নি" });
      }
      res.json({ takaja });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromError(error).message });
      }
      console.error("Update takaja error:", error);
      res.status(500).json({ error: "তাকাজা আপডেট করতে ব্যর্থ হয়েছে" });
    }
  });

  // Delete takaja
  app.delete("/api/takajas/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteTakaja(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "তাকাজা পাওয়া যায়নি" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete takaja error:", error);
      res.status(500).json({ error: "তাকাজা মুছতে ব্যর্থ হয়েছে" });
    }
  });

  // Assign takaja to a member (only admins/managers can assign)
  app.post("/api/takajas/:id/assign", requireAuth, requireRole("manager", "super_admin"), async (req, res) => {
    try {
      const { userId } = req.body;
      
      // Get the takaja to find its halqa
      const takaja = await storage.getTakaja(req.params.id);
      if (!takaja) {
        return res.status(404).json({ error: "তাকাজা পাওয়া যায়নি" });
      }
      
      // If assigning to a user, verify the user exists and belongs to the halqa
      if (userId) {
        const assignee = await storage.getUser(userId);
        if (!assignee) {
          return res.status(400).json({ error: "সাথী পাওয়া যায়নি" });
        }
        if (assignee.halqaId !== takaja.halqaId) {
          return res.status(400).json({ error: "এই সাথী এই হালকার অন্তর্ভুক্ত নয়" });
        }
      }
      
      const updatedTakaja = await storage.assignTakaja(req.params.id, userId || null);
      res.json({ takaja: updatedTakaja });
    } catch (error) {
      console.error("Assign takaja error:", error);
      res.status(500).json({ error: "তাকাজা অ্যাসাইন করতে ব্যর্থ হয়েছে" });
    }
  });

  // Complete takaja (assignee or admin can complete)
  app.post("/api/takajas/:id/complete", requireAuth, async (req, res) => {
    try {
      const currentUser = (req as any).user as User;
      const takaja = await storage.getTakaja(req.params.id);
      
      if (!takaja) {
        return res.status(404).json({ error: "তাকাজা পাওয়া যায়নি" });
      }
      
      // Only assignee or admin/manager can complete
      const isAdmin = currentUser.role === "super_admin" || currentUser.role === "manager";
      const isAssignee = takaja.assignedTo === currentUser.id;
      
      if (!isAdmin && !isAssignee) {
        return res.status(403).json({ error: "আপনি এই তাকাজা সম্পন্ন করার অনুমতি নেই" });
      }
      
      const updatedTakaja = await storage.completeTakaja(req.params.id);
      res.json({ takaja: updatedTakaja });
    } catch (error) {
      console.error("Complete takaja error:", error);
      res.status(500).json({ error: "তাকাজা সম্পন্ন করতে ব্যর্থ হয়েছে" });
    }
  });

  // ===== Export/Import Routes (Super Admin Only) =====

  // Export all data
  app.get("/api/export", requireAuth, requireRole("super_admin"), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const thanas = await storage.getAllThanas();
      const unions = await storage.getAllUnions();
      const mosques = await storage.getAllMosques();
      const halqas = await storage.getAllHalqas();
      const takajas = await storage.getAllTakajas();
      const settings = await storage.getAllSettings();

      // Remove passwords from users
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);

      res.json({
        users: usersWithoutPasswords,
        thanas,
        unions,
        mosques,
        halqas,
        takajas,
        settings,
      });
    } catch (error) {
      console.error("Export data error:", error);
      res.status(500).json({ error: "ডেটা এক্সপোর্ট করতে ব্যর্থ হয়েছে" });
    }
  });

  // Import data
  app.post("/api/import", requireAuth, requireRole("super_admin"), async (req, res) => {
    try {
      const { settings } = req.body;

      // Import settings if provided
      if (settings && Array.isArray(settings)) {
        for (const setting of settings) {
          if (setting.key && setting.value) {
            await storage.setSetting(setting.key, setting.value);
          }
        }
      }

      res.json({ success: true, message: "ডেটা সফলভাবে ইমপোর্ট করা হয়েছে" });
    } catch (error) {
      console.error("Import data error:", error);
      res.status(500).json({ error: "ডেটা ইমপোর্ট করতে ব্যর্থ হয়েছে" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
