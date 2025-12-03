import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  try {
    const migration = readFileSync("migrations/0000_futuristic_maximus.sql", "utf-8");
    const statements = migration.split("--> statement-breakpoint").map(s => s.trim()).filter(s => s);
    
    for (const statement of statements) {
      if (statement) {
        console.log("Executing:", statement.substring(0, 50) + "...");
        await sql(statement);
      }
    }
    
    console.log("✓ Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate();
