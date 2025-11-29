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
      
      // Check if user already exists
      const existingUser = await storage.getUserByPhone(validatedData.phone);
      if (existingUser) {
        return res.status(400).json({ error: "ইতিমধ্যে এই নাম্বার দিয়ে রেজিস্ট্রেশন করা হয়েছে" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);

      // Create user
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
      });

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      // Create session
      req.session.userId = user.id;

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

  // ===== Thana Routes =====
  
  app.get("/api/thanas", async (req, res) => {
    try {
      const thanas = await storage.getAllThanas();
      res.json({ thanas });
    } catch (error) {
      console.error("Get thanas error:", error);
      res.status(500).json({ error: "থানা তালিকা লোড করতে ব্যর্থ হয়েছে" });
    }
  });

  // ===== Union Routes =====
  
  app.get("/api/unions", async (req, res) => {
    try {
      const { thanaId } = req.query;
      
      const unions = thanaId && thanaId !== "all"
        ? await storage.getUnionsByThana(thanaId as string)
        : await storage.getAllUnions();
        
      res.json({ unions });
    } catch (error) {
      console.error("Get unions error:", error);
      res.status(500).json({ error: "ইউনিয়ন তালিকা লোড করতে ব্যর্থ হয়েছে" });
    }
  });

  // ===== Mosque Routes =====
  
  app.get("/api/mosques", async (req, res) => {
    try {
      const { search, thanaId, unionId } = req.query;

      let mosques;
      if (search) {
        mosques = await storage.searchMosques(
          search as string,
          thanaId as string,
          unionId as string
        );
      } else if (thanaId && thanaId !== "all") {
        mosques = await storage.getMosquesByThana(thanaId as string);
      } else if (unionId && unionId !== "all") {
        mosques = await storage.getMosquesByUnion(unionId as string);
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
      const validatedData = insertMosqueSchema.parse(req.body);
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
      const mosque = await storage.updateMosque(req.params.id, req.body);
      if (!mosque) {
        return res.status(404).json({ error: "মসজিদ পাওয়া যায়নি" });
      }
      res.json({ mosque });
    } catch (error) {
      console.error("Update mosque error:", error);
      res.status(500).json({ error: "মসজিদ আপডেট করতে ব্যর্থ হয়েছে" });
    }
  });

  app.delete("/api/mosques/:id", requireAuth, requireRole("super_admin", "manager"), async (req, res) => {
    try {
      const deleted = await storage.deleteMosque(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "মসজিদ পাওয়া যায়নি" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete mosque error:", error);
      res.status(500).json({ error: "মসজিদ মুছে ফেলতে ব্যর্থ হয়েছে" });
    }
  });

  // ===== Halqa Routes =====
  
  app.get("/api/halqas", async (req, res) => {
    try {
      const { search, thanaId, unionId } = req.query;

      let halqas;
      if (search) {
        halqas = await storage.searchHalqas(
          search as string,
          thanaId as string,
          unionId as string
        );
      } else if (thanaId && thanaId !== "all") {
        halqas = await storage.getHalqasByThana(thanaId as string);
      } else if (unionId && unionId !== "all") {
        halqas = await storage.getHalqasByUnion(unionId as string);
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
      const validatedData = insertHalqaSchema.parse(req.body);
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
      const halqa = await storage.updateHalqa(req.params.id, req.body);
      if (!halqa) {
        return res.status(404).json({ error: "হালকা পাওয়া যায়নি" });
      }
      res.json({ halqa });
    } catch (error) {
      console.error("Update halqa error:", error);
      res.status(500).json({ error: "হালকা আপডেট করতে ব্যর্থ হয়েছে" });
    }
  });

  app.delete("/api/halqas/:id", requireAuth, requireRole("super_admin", "manager"), async (req, res) => {
    try {
      const deleted = await storage.deleteHalqa(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "হালকা পাওয়া যায়নি" });
      }
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
      const { search, thanaId, unionId, role } = req.query;

      // Determine target role - default to "member" if not provided or empty
      const roleString = typeof role === "string" && role.trim() !== "" ? role.trim() : "member";
      
      // Restrict manager queries to super_admin only
      if (roleString === "manager" && user.role !== "super_admin") {
        return res.status(403).json({ error: "আপনার এই অপারেশন করার অনুমতি নেই" });
      }
      
      // Always use searchUsers which handles all filtering including role
      const members = await storage.searchUsers(
        (search as string) || "",
        thanaId as string,
        unionId as string,
        roleString
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

      // Users can only update their own profile unless they're admin/manager
      if (user.id !== targetId && !["super_admin", "manager"].includes(user.role)) {
        return res.status(403).json({ error: "অনুমতি নেই" });
      }

      const member = await storage.updateUser(targetId, req.body);
      if (!member) {
        return res.status(404).json({ error: "সাথী পাওয়া যায়নি" });
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
      const deleted = await storage.deleteUser(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "সাথী পাওয়া যায়নি" });
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
  app.post("/api/import/members", requireAuth, requireRole("super_admin"), async (req, res) => {
    try {
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
  app.post("/api/import/mosques", requireAuth, requireRole("super_admin"), async (req, res) => {
    try {
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
  app.post("/api/import/halqas", requireAuth, requireRole("super_admin"), async (req, res) => {
    try {
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
      const [members, mosques, halqas] = await Promise.all([
        storage.getUsersByRole("member"),
        storage.getAllMosques(),
        storage.getAllHalqas(),
      ]);

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

  const httpServer = createServer(app);
  return httpServer;
}
