import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

dotenv.config({
	path: "../../apps/web/.env"
});

export default defineConfig({
	schema: "./src/schema",
	out: "./src/migrations",
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.DATABASE_URL || ""
	},
	verbose: true,
	strict: true
});
