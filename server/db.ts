import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });

export const connectDB = async () => {
  try {
    // Test the connection
    await sql`SELECT 1`;
    console.log("✅ PostgreSQL Connected Successfully");
  } catch (err) {
    console.error("❌ PostgreSQL Connection Failed:", err);
    process.exit(1);
  }
};
