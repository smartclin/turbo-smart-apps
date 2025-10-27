import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

// 1. Create the postgres.js client instance
// The '!' tells TypeScript the variable is definitely set.
const client = postgres(process.env.DATABASE_URL as string, {
	// Recommended configuration for a robust connection pool
	max: 10,
	idle_timeout: 30000
});

// 2. Initialize Drizzle with the client, schema, and casing
const initializeDrizzle = () =>
	drizzle(client, {
		schema,
		casing: "snake_case" // Ensures Drizzle uses snake_case for the database
	});

// 3. Global check to prevent multiple connections in development (e.g., Next.js HMR)
const globalForDrizzle = globalThis as unknown as {
	db: ReturnType<typeof initializeDrizzle> | undefined;
};

export const db = globalForDrizzle.db ?? initializeDrizzle();

if (process.env.NODE_ENV !== "production") {
	globalForDrizzle.db = db;
}
// Removed: export * from "drizzle-orm/sql"; (This should be imported in schema.ts only)
