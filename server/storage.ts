import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and, ilike, or } from "drizzle-orm";
import {
  users,
  thanas,
  unions,
  mosques,
  halqas,
  takajas,
  settings,
  type User,
  type InsertUser,
  type Thana,
  type InsertThana,
  type Union,
  type InsertUnion,
  type Mosque,
  type InsertMosque,
  type Halqa,
  type InsertHalqa,
  type Takaja,
  type InsertTakaja,
  type Setting,
  type InsertSetting,
} from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  searchUsers(query: string, thanaId?: string, unionId?: string): Promise<User[]>;

  // Thana methods
  getAllThanas(): Promise<Thana[]>;
  getThana(id: string): Promise<Thana | undefined>;
  createThana(thana: InsertThana): Promise<Thana>;

  // Union methods
  getAllUnions(): Promise<Union[]>;
  getUnionsByThana(thanaId: string): Promise<Union[]>;
  getUnion(id: string): Promise<Union | undefined>;
  createUnion(union: InsertUnion): Promise<Union>;

  // Mosque methods
  getAllMosques(): Promise<Mosque[]>;
  getMosque(id: string): Promise<Mosque | undefined>;
  getMosquesByThana(thanaId: string): Promise<Mosque[]>;
  getMosquesByUnion(unionId: string): Promise<Mosque[]>;
  getMosquesByHalqa(halqaId: string): Promise<Mosque[]>;
  searchMosques(query: string, thanaId?: string, unionId?: string): Promise<Mosque[]>;
  filterMosques(query?: string, thanaId?: string, unionId?: string, halqaId?: string): Promise<Mosque[]>;
  createMosque(mosque: InsertMosque): Promise<Mosque>;
  updateMosque(id: string, mosque: Partial<InsertMosque>): Promise<Mosque | undefined>;
  deleteMosque(id: string): Promise<boolean>;

  // Halqa methods
  getAllHalqas(): Promise<Halqa[]>;
  getHalqa(id: string): Promise<Halqa | undefined>;
  getHalqasByThana(thanaId: string): Promise<Halqa[]>;
  getHalqasByUnion(unionId: string): Promise<Halqa[]>;
  searchHalqas(query: string, thanaId?: string, unionId?: string): Promise<Halqa[]>;
  filterHalqas(query?: string, thanaId?: string, unionId?: string): Promise<Halqa[]>;
  createHalqa(halqa: InsertHalqa): Promise<Halqa>;
  updateHalqa(id: string, halqa: Partial<InsertHalqa>): Promise<Halqa | undefined>;
  deleteHalqa(id: string): Promise<boolean>;
  getMembersByHalqa(halqaId: string): Promise<User[]>;

  // Bulk import methods
  bulkCreateMosques(mosquesList: InsertMosque[]): Promise<Mosque[]>;
  bulkCreateHalqas(halqasList: InsertHalqa[]): Promise<Halqa[]>;
  bulkCreateUsers(usersList: InsertUser[]): Promise<User[]>;
  getThanaByName(nameBn: string): Promise<Thana | undefined>;
  getUnionByName(nameBn: string, thanaId: string): Promise<Union | undefined>;

  // Settings methods
  getSetting(key: string): Promise<Setting | undefined>;
  getAllSettings(): Promise<Setting[]>;
  setSetting(key: string, value: string): Promise<Setting>;

  // Takaja methods
  getAllTakajas(): Promise<Takaja[]>;
  getTakaja(id: string): Promise<Takaja | undefined>;
  getTakajasByHalqa(halqaId: string): Promise<Takaja[]>;
  getTakajasByAssignee(userId: string): Promise<Takaja[]>;
  createTakaja(takaja: InsertTakaja): Promise<Takaja>;
  updateTakaja(id: string, takaja: Partial<InsertTakaja>): Promise<Takaja | undefined>;
  deleteTakaja(id: string): Promise<boolean>;
  assignTakaja(takajaId: string, userId: string | null): Promise<Takaja | undefined>;
  completeTakaja(id: string): Promise<Takaja | undefined>;
}

export class DbStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!email) return undefined;
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users).set(user).where(eq(users.id, id)).returning();
    return result[0];
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role));
  }

  async searchUsers(query: string, thanaId?: string, unionId?: string, role?: string): Promise<User[]> {
    const conditions: any[] = [];

    // Only add search condition if query is not empty
    if (query && query.trim() !== "") {
      conditions.push(
        or(
          ilike(users.name, `%${query}%`),
          ilike(users.phone, `%${query}%`),
          ilike(users.email || "", `%${query}%`)
        )
      );
    }

    // Add role filter - defaults to "member" if not specified
    conditions.push(eq(users.role, role || "member"));

    if (thanaId && thanaId !== "all") {
      conditions.push(eq(users.thanaId, thanaId));
    }
    if (unionId && unionId !== "all") {
      conditions.push(eq(users.unionId, unionId));
    }

    return await db.select().from(users).where(and(...conditions));
  }

  // Thana methods
  async getAllThanas(): Promise<Thana[]> {
    return await db.select().from(thanas);
  }

  async getThana(id: string): Promise<Thana | undefined> {
    const result = await db.select().from(thanas).where(eq(thanas.id, id)).limit(1);
    return result[0];
  }

  async createThana(thana: InsertThana): Promise<Thana> {
    const result = await db.insert(thanas).values(thana).returning();
    return result[0];
  }

  // Union methods
  async getAllUnions(): Promise<Union[]> {
    return await db.select().from(unions);
  }

  async getUnionsByThana(thanaId: string): Promise<Union[]> {
    return await db.select().from(unions).where(eq(unions.thanaId, thanaId));
  }

  async getUnion(id: string): Promise<Union | undefined> {
    const result = await db.select().from(unions).where(eq(unions.id, id)).limit(1);
    return result[0];
  }

  async createUnion(union: InsertUnion): Promise<Union> {
    const result = await db.insert(unions).values(union).returning();
    return result[0];
  }

  // Mosque methods
  async getAllMosques(): Promise<Mosque[]> {
    return await db.select().from(mosques);
  }

  async getMosque(id: string): Promise<Mosque | undefined> {
    const result = await db.select().from(mosques).where(eq(mosques.id, id)).limit(1);
    return result[0];
  }

  async getMosquesByThana(thanaId: string): Promise<Mosque[]> {
    return await db.select().from(mosques).where(eq(mosques.thanaId, thanaId));
  }

  async getMosquesByUnion(unionId: string): Promise<Mosque[]> {
    return await db.select().from(mosques).where(eq(mosques.unionId, unionId));
  }

  async getMosquesByHalqa(halqaId: string): Promise<Mosque[]> {
    return await db.select().from(mosques).where(eq(mosques.halqaId, halqaId));
  }

  async searchMosques(query: string, thanaId?: string, unionId?: string): Promise<Mosque[]> {
    const conditions = [
      or(
        ilike(mosques.name, `%${query}%`),
        ilike(mosques.address, `%${query}%`)
      ),
    ];

    if (thanaId && thanaId !== "all") {
      conditions.push(eq(mosques.thanaId, thanaId));
    }
    if (unionId && unionId !== "all") {
      conditions.push(eq(mosques.unionId, unionId));
    }

    return await db.select().from(mosques).where(and(...conditions));
  }

  async filterMosques(query?: string, thanaId?: string, unionId?: string, halqaId?: string): Promise<Mosque[]> {
    const conditions: any[] = [];

    if (query && query.trim() !== "") {
      conditions.push(
        or(
          ilike(mosques.name, `%${query}%`),
          ilike(mosques.address, `%${query}%`)
        )
      );
    }

    if (thanaId && thanaId !== "all") {
      conditions.push(eq(mosques.thanaId, thanaId));
    }
    if (unionId && unionId !== "all") {
      conditions.push(eq(mosques.unionId, unionId));
    }
    if (halqaId && halqaId !== "all") {
      conditions.push(eq(mosques.halqaId, halqaId));
    }

    if (conditions.length === 0) {
      return await db.select().from(mosques);
    }

    return await db.select().from(mosques).where(and(...conditions));
  }

  async createMosque(mosque: InsertMosque): Promise<Mosque> {
    const result = await db.insert(mosques).values(mosque).returning();
    return result[0];
  }

  async updateMosque(id: string, mosque: Partial<InsertMosque>): Promise<Mosque | undefined> {
    const result = await db.update(mosques).set(mosque).where(eq(mosques.id, id)).returning();
    return result[0];
  }

  async deleteMosque(id: string): Promise<boolean> {
    const result = await db.delete(mosques).where(eq(mosques.id, id)).returning();
    return result.length > 0;
  }

  // Halqa methods
  async getAllHalqas(): Promise<Halqa[]> {
    return await db.select().from(halqas);
  }

  async getHalqa(id: string): Promise<Halqa | undefined> {
    const result = await db.select().from(halqas).where(eq(halqas.id, id)).limit(1);
    return result[0];
  }

  async getHalqasByThana(thanaId: string): Promise<Halqa[]> {
    return await db.select().from(halqas).where(eq(halqas.thanaId, thanaId));
  }

  async getHalqasByUnion(unionId: string): Promise<Halqa[]> {
    return await db.select().from(halqas).where(eq(halqas.unionId, unionId));
  }

  async searchHalqas(query: string, thanaId?: string, unionId?: string): Promise<Halqa[]> {
    const conditions = [ilike(halqas.name, `%${query}%`)];

    if (thanaId && thanaId !== "all") {
      conditions.push(eq(halqas.thanaId, thanaId));
    }
    if (unionId && unionId !== "all") {
      conditions.push(eq(halqas.unionId, unionId));
    }

    return await db.select().from(halqas).where(and(...conditions));
  }

  async filterHalqas(query?: string, thanaId?: string, unionId?: string): Promise<Halqa[]> {
    const conditions: any[] = [];

    if (query && query.trim() !== "") {
      conditions.push(ilike(halqas.name, `%${query}%`));
    }

    if (thanaId && thanaId !== "all") {
      conditions.push(eq(halqas.thanaId, thanaId));
    }
    if (unionId && unionId !== "all") {
      conditions.push(eq(halqas.unionId, unionId));
    }

    if (conditions.length === 0) {
      return await db.select().from(halqas);
    }

    return await db.select().from(halqas).where(and(...conditions));
  }

  async getMembersByHalqa(halqaId: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.halqaId, halqaId));
  }

  async createHalqa(halqa: InsertHalqa): Promise<Halqa> {
    const result = await db.insert(halqas).values(halqa).returning();
    return result[0];
  }

  async updateHalqa(id: string, halqa: Partial<InsertHalqa>): Promise<Halqa | undefined> {
    const result = await db.update(halqas).set(halqa).where(eq(halqas.id, id)).returning();
    return result[0];
  }

  async deleteHalqa(id: string): Promise<boolean> {
    const result = await db.delete(halqas).where(eq(halqas.id, id)).returning();
    return result.length > 0;
  }

  // Bulk import methods
  async bulkCreateMosques(mosquesList: InsertMosque[]): Promise<Mosque[]> {
    if (mosquesList.length === 0) return [];
    const result = await db.insert(mosques).values(mosquesList).returning();
    return result;
  }

  async bulkCreateHalqas(halqasList: InsertHalqa[]): Promise<Halqa[]> {
    if (halqasList.length === 0) return [];
    const result = await db.insert(halqas).values(halqasList).returning();
    return result;
  }

  async bulkCreateUsers(usersList: InsertUser[]): Promise<User[]> {
    if (usersList.length === 0) return [];
    const result = await db.insert(users).values(usersList).returning();
    return result;
  }

  async getThanaByName(nameBn: string): Promise<Thana | undefined> {
    const result = await db.select().from(thanas).where(eq(thanas.nameBn, nameBn)).limit(1);
    return result[0];
  }

  async getUnionByName(nameBn: string, thanaId: string): Promise<Union | undefined> {
    const result = await db.select().from(unions).where(
      and(eq(unions.nameBn, nameBn), eq(unions.thanaId, thanaId))
    ).limit(1);
    return result[0];
  }

  // Settings methods
  async getSetting(key: string): Promise<Setting | undefined> {
    const result = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
    return result[0];
  }

  async getAllSettings(): Promise<Setting[]> {
    return await db.select().from(settings);
  }

  async setSetting(key: string, value: string): Promise<Setting> {
    const existing = await this.getSetting(key);
    if (existing) {
      const result = await db.update(settings)
        .set({ value, updatedAt: new Date() })
        .where(eq(settings.key, key))
        .returning();
      return result[0];
    }
    const result = await db.insert(settings).values({ key, value }).returning();
    return result[0];
  }

  // Takaja methods
  async getAllTakajas(): Promise<Takaja[]> {
    return await db.select().from(takajas);
  }

  async getTakaja(id: string): Promise<Takaja | undefined> {
    const result = await db.select().from(takajas).where(eq(takajas.id, id)).limit(1);
    return result[0];
  }

  async getTakajasByHalqa(halqaId: string): Promise<Takaja[]> {
    return await db.select().from(takajas).where(eq(takajas.halqaId, halqaId));
  }

  async getTakajasByAssignee(userId: string): Promise<Takaja[]> {
    return await db.select().from(takajas).where(eq(takajas.assignedTo, userId));
  }

  async createTakaja(takaja: InsertTakaja): Promise<Takaja> {
    const result = await db.insert(takajas).values(takaja).returning();
    return result[0];
  }

  async updateTakaja(id: string, takaja: Partial<InsertTakaja>): Promise<Takaja | undefined> {
    const result = await db.update(takajas).set(takaja).where(eq(takajas.id, id)).returning();
    return result[0];
  }

  async deleteTakaja(id: string): Promise<boolean> {
    const result = await db.delete(takajas).where(eq(takajas.id, id)).returning();
    return result.length > 0;
  }

  async assignTakaja(takajaId: string, userId: string | null): Promise<Takaja | undefined> {
    const result = await db.update(takajas)
      .set({ 
        assignedTo: userId,
        status: userId ? "in_progress" : "pending"
      })
      .where(eq(takajas.id, takajaId))
      .returning();
    return result[0];
  }

  async completeTakaja(id: string): Promise<Takaja | undefined> {
    const result = await db.update(takajas)
      .set({ 
        status: "completed",
        completedAt: new Date()
      })
      .where(eq(takajas.id, id))
      .returning();
    return result[0];
  }
}

export const storage = new DbStorage();
