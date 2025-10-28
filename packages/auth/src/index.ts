import { db } from "@smart-apps/db";
import * as schema from "@smart-apps/db/schema/auth";
import { hash } from "bcryptjs";
import { type BetterAuthOptions, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin as adminPlugin, apiKey, bearer, multiSession, openAPI, twoFactor, username } from "better-auth/plugins";

import { ac, allRoles } from "./permissions";
import { restrictedUsernames } from "./usernames";

const restrictedUsernamesSet = new Set(restrictedUsernames);

export function initAuth(
	_DB: unknown,
	options: { baseUrl: string; baseDomain: string; secret: string; trustedOrigins?: string[] }
) {
	const config: BetterAuthOptions = {
		database: drizzleAdapter(db, { provider: "pg", schema }),
		baseURL: options.baseUrl,
		secret: options.secret,
		trustedOrigins: options.trustedOrigins ?? [options.baseUrl],
		session: {
			expiresIn: 60 * 60 * 24 * 7,
			updateAge: 60 * 60 * 24,
			cookieCache: { enabled: true, maxAge: 60 * 5 }
		},
		databaseHooks: {
			user: {
				create: {
					before: async (incomingUser, context) => {
						if (incomingUser.password) {
							const hashedPassword = await hash(String(incomingUser.password), 6);
							return {
								data: {
									...incomingUser,
									password: hashedPassword,
									gender: incomingUser.gender ?? false,
									role: incomingUser.role ?? "member",
									banned: incomingUser.banned ?? false
								}
							};
						}

						if (incomingUser.role === "admin" && context?.body?.role !== "admin") {
							console.warn("Blocked non-admin attempt to create user with role: admin");
							return false;
						}

						return undefined;
					},
					after: async user => {
						console.log(`User created successfully: ${user.email} (ID: ${user.id})`);
					}
				}
			}
		},
		user: {
			additionalFields: {
				role: { type: "string", defaultValue: "member", input: false },
				password: { type: "string", input: true },
				gender: { type: "boolean", input: true, required: true }
			},
			changeEmail: { enabled: true },
			deleteUser: { enabled: true }
		},
		plugins: [
			apiKey(),
			bearer(),
			openAPI({ path: "/docs" }),
			multiSession(),
			twoFactor(),
			adminPlugin({ ac, roles: allRoles }),
			nextCookies(),
			username({
				minUsernameLength: 4,
				maxUsernameLength: 10,
				usernameValidator: value => !restrictedUsernamesSet.has(value),
				usernameNormalization: value => value.toLowerCase()
			})
		],
		telemetry: { enabled: false }
	};

	return betterAuth(config);
}

// ✅ Initialize auth here instead of using pre-imported auth
export const authInstance = initAuth(
	{},
	{
		baseDomain: "localhost",
		baseUrl: "http://localhost:3000",
		secret: "secret",
		trustedOrigins: ["http://localhost:3000"]
	}
);

// ✅ Access API from the initialized instance
export const api = authInstance.api;

// ✅ Correctly infer types including additionalFields
export type Auth = typeof authInstance;
export type Session = Auth["$Infer"]["Session"];

// Extend user to include additionalFields
export type User = Session["user"] & {
	role: string;
	gender: boolean;
	banned: boolean;
};

export type Role = User["role"];
