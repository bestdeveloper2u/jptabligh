import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - handles all user types (super_admin, manager, member)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("member"), // super_admin, manager, member
  thanaId: varchar("thana_id"),
  unionId: varchar("union_id"),
  mosqueId: varchar("mosque_id"),
  halqaId: varchar("halqa_id"),
  tabligActivities: text("tablig_activities").array().default(sql`ARRAY[]::text[]`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Thanas (police stations/subdivisions) in Jamalpur district
export const thanas = pgTable("thanas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  nameBn: text("name_bn").notNull(),
});

// Unions within each thana
export const unions = pgTable("unions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  nameBn: text("name_bn").notNull(),
  thanaId: varchar("thana_id").notNull().references(() => thanas.id, { onDelete: "cascade" }),
});

// Mosques
export const mosques = pgTable("mosques", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  thanaId: varchar("thana_id").notNull().references(() => thanas.id, { onDelete: "cascade" }),
  unionId: varchar("union_id").notNull().references(() => unions.id, { onDelete: "cascade" }),
  halqaId: varchar("halqa_id"),
  address: text("address").notNull(),
  imamPhone: text("imam_phone"),
  muazzinPhone: text("muazzin_phone"),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Halqas (circles/groups)
export const halqas = pgTable("halqas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  thanaId: varchar("thana_id").notNull().references(() => thanas.id, { onDelete: "cascade" }),
  unionId: varchar("union_id").notNull().references(() => unions.id, { onDelete: "cascade" }),
  membersCount: integer("members_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Takajas (দাওয়াতী তাকাজা - Dawati requests/assignments)
export const takajas = pgTable("takajas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  halqaId: varchar("halqa_id").notNull().references(() => halqas.id, { onDelete: "cascade" }),
  assignedTo: varchar("assigned_to").references(() => users.id, { onDelete: "set null" }),
  status: text("status").notNull().default("pending"), // pending, in_progress, completed
  priority: text("priority").notNull().default("normal"), // low, normal, high, urgent
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// App Settings
export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
}).extend({
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().min(11),
  password: z.string().min(6),
  tabligActivities: z.array(z.string()).optional(),
});

export const insertThanaSchema = createInsertSchema(thanas).omit({ id: true });
export const insertUnionSchema = createInsertSchema(unions).omit({ id: true });

export const insertMosqueSchema = createInsertSchema(mosques).omit({
  id: true,
  createdAt: true,
});

export const insertHalqaSchema = createInsertSchema(halqas).omit({
  id: true,
  createdAt: true,
  membersCount: true,
});

export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

export const insertTakajaSchema = createInsertSchema(takajas).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Thana = typeof thanas.$inferSelect;
export type InsertThana = z.infer<typeof insertThanaSchema>;

export type Union = typeof unions.$inferSelect;
export type InsertUnion = z.infer<typeof insertUnionSchema>;

export type Mosque = typeof mosques.$inferSelect;
export type InsertMosque = z.infer<typeof insertMosqueSchema>;

export type Halqa = typeof halqas.$inferSelect;
export type InsertHalqa = z.infer<typeof insertHalqaSchema>;

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;

export type Takaja = typeof takajas.$inferSelect;
export type InsertTakaja = z.infer<typeof insertTakajaSchema>;

// Login schema
export const loginSchema = z.object({
  phone: z.string().min(11),
  password: z.string().min(6),
});

export type LoginData = z.infer<typeof loginSchema>;
