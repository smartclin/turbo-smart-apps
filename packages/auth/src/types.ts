// types/better-auth.d.ts
import "better-auth";

declare module "better-auth" {
	type BetterAuthUser = {
		role: "admin" | "doctor" | "nurse" | "member";
		gender: "male" | "female";
		banned?: boolean;
		banReason?: string | null;
		banExpires?: Date | null;
	};

	type BetterAuthSession = {
		user: BetterAuthUser & {
			id: string;
			name: string;
			email: string;
			emailVerified: boolean;
			image?: string | null;
			createdAt: Date;
			updatedAt: Date;
		};
	};
}
