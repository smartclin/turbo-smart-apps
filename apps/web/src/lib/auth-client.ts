import type { auth } from "@smart-apps/auth/auth";
import { ac, allRoles } from "@smart-apps/auth/permissions";
import {
	adminClient,
	customSessionClient,
	inferAdditionalFields,
	multiSessionClient,
	passkeyClient,
	twoFactorClient,
	usernameClient
} from "better-auth/client/plugins";
import { nextCookies } from "better-auth/next-js";
import { createAuthClient } from "better-auth/react";
import { toast } from "sonner";

export const authClient = createAuthClient({
	baseURL: process.env.NEXT_PUBLIC_BASE_URL ?? "",
	emailAndPassword: {
		enabled: true
	},
	fetchOptions: {
		onError({ error }) {
			if (error.status === 429) {
				toast.error("Terlalu banyak permintaan. Silakan coba beberapa saat lagi.");
			}
		}
	},
	plugins: [
		adminClient({
			ac,
			roles: allRoles
		}),
		twoFactorClient(),
		passkeyClient(),
		multiSessionClient(),
		customSessionClient<typeof auth>(),
		usernameClient(),
		nextCookies(),
		inferAdditionalFields<typeof auth>()
	]
});

export const {
	signIn,
	signOut,
	signUp,
	updateUser,
	changePassword,
	changeEmail,
	deleteUser,
	useSession,
	revokeSession,
	resetPassword,
	linkSocial,
	forgetPassword,
	listAccounts,
	listSessions,
	revokeOtherSessions,
	revokeSessions
} = authClient;
