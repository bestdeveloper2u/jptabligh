import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and, ilike, or } from "drizzle-orm";
import {
  users,
  thanas,
  unions,
  mosques,
  halqas,
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
  searchMosques(query: string, thanaId?: string, unionId?: string): Promise<Mosque[]>;
  createMosque(mosque: InsertMosque): Promise<Mosque>;
  updateMosque(id: string, mosque: Partial<InsertMosque>): Promise<Mosque | undefined>;
  deleteMosque(id: string): Promise<boolean>;

  // Halqa methods
  getAllHalqas(): Promise<Halqa[]>;
  getHalqa(id: string): Promise<Halqa | undefined>;
  getHalqasByThana(thanaId: string): Promise<Halqa[]>;
  getHalqasByUnion(unionId: string): Promise<Halqa[]>;
  searchHalqas(query: string, thanaId?: string, unionId?: string): Promise<Halqa[]>;
  createHalqa(halqa: InsertHalqa): Promise<Halqa>;
  updateHalqa(id: string, halqa: Partial<InsertHalqa>): Promise<Halqa | undefined>;
  deleteHalqa(id: string): Promise<boolean>;
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
}

export const storage = new DbStorage();
