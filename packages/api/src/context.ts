// context.ts
import { auth } from "@smart-apps/auth/auth";
import { db } from "@smart-apps/db";
import type { NextRequest } from "next/server";
import "server-only";

import type { User } from "@smart-apps/auth";

// Better-Auth user type
type AuthUser = User & {
	role: "admin" | "doctor" | "nurse" | "member";
	gender: "male" | "female";
	banned?: boolean;
	banReason?: string | null;
	banExpires?: Date | null;
};

export async function createContext(req: NextRequest) {
	const session = await auth.api.getSession({ headers: req.headers });

	// Extract user safely
	const user = session?.user as AuthUser | undefined;

	return {
		db,
		session,
		user
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
export type { AuthUser };
