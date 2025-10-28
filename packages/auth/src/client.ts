import {
	adminClient,
	anonymousClient,
	customSessionClient,
	inferAdditionalFields,
	multiSessionClient,
	passkeyClient,
	twoFactorClient,
	usernameClient
} from "better-auth/client/plugins";
import { nextCookies } from "better-auth/next-js";

// Explicit type for the auth client (adjust the type based on your library's documentation)

// Explicit type for the auth client (adjust the type based on your library's documentation)

import { createAuthClient } from "better-auth/client";

import type { auth } from "./auth";
import { ac, allRoles } from "./permissions";

// Infer the return type from the createAuthClient function directly
export const getAuthClient = (): ReturnType<typeof createAuthClient> =>
	createAuthClient({
		baseURL: process.env.NEXT_PUBLIC_BASE_URL ?? "",
		emailAndPassword: {
			autoSignIn: true,
			enabled: true,
			maxPasswordLength: 20,
			minPasswordLength: 6
		},
		plugins: [
			usernameClient(),
			nextCookies(),
			adminClient({
				ac,
				roles: allRoles
			}),
			twoFactorClient(),
			passkeyClient(),
			multiSessionClient(),
			customSessionClient(),
			anonymousClient(),
			inferAdditionalFields<typeof auth>()
		]
	});
