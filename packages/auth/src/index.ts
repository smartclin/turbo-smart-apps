import { db } from "@smart-apps/db";
import * as schema from "@smart-apps/db/schema/auth";
import { type BetterAuthOptions, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin as adminPlugin, apiKey, bearer, multiSession, openAPI, twoFactor, username } from "better-auth/plugins";

import { ac, allRoles } from "./permissions";
import { restrictedUsernames } from "./usernames";

const restrictedUsernamesSet = new Set(restrictedUsernames);

type InitAuthOptions = {
	baseDomain: string;
	baseUrl: string;
	secret: string;
	trustedOrigins?: string[];
};

export function initAuth(options: InitAuthOptions) {
	const config: BetterAuthOptions = {
		database: drizzleAdapter(db, { provider: "pg", schema }),
		baseURL: options.baseUrl,
		secret: options.secret,
		trustedOrigins: options.trustedOrigins?.length
			? options.trustedOrigins
			: [process.env.CORS_ORIGIN || options.baseUrl || "http://localhost:3000"],
		session: {
			expiresIn: 60 * 60 * 24 * 7,
			updateAge: 60 * 60 * 24,
			cookieCache: { enabled: true, maxAge: 60 * 5 }
		},
		account: { accountLinking: { enabled: true, allowDifferentEmails: true } },
		emailAndPassword: { enabled: true, autoSignIn: true, requireEmailVerification: false },
		user: {
			additionalFields: {
				role: { type: "string", defaultValue: "member", input: false, required: false },
				password: { type: "string", input: true },
				gender: { type: "boolean", input: true, required: true }
			},
			changeEmail: { enabled: true },
			deleteUser: { enabled: true }
		},
		advanced: {
			crossSubDomainCookies: { enabled: true, domain: options.baseDomain },
			defaultCookieAttributes: { sameSite: "none", secure: true, httpOnly: true },
			database: { generateId: false, useNumberId: false }
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
		onAPIError: {
			throw: true,
			onError: error => console.error("Auth error:", error)
		}
	};

	return betterAuth(config);
}

export type Auth = ReturnType<typeof initAuth>;
export type Session = Auth["$Infer"]["Session"];
export type User = Auth["$Infer"]["Session"]["user"];
