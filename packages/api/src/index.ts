import type { User } from "@smart-apps/auth";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import type { Context } from "./context";

type AuthUser = User & {
	role: "admin" | "doctor" | "nurse" | "member";
	gender: "male" | "female";
	banned?: boolean;
	banReason?: string | null;
	banExpires?: Date | null;
};

export const t = initTRPC.context<Context>().create({
	transformer: superjson,
	errorFormatter({ shape, error }) {
		return {
			...shape,
			data: {
				...shape.data,
				zodError: error.cause instanceof ZodError ? error.cause.flatten() : null
			}
		};
	}
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Simple role validation helper
const requireRole = (allowed: AuthUser["role"][]) =>
	t.middleware(({ ctx, next }) => {
		const user = ctx.user;

		if (!user) {
			throw new TRPCError({ code: "UNAUTHORIZED" });
		}

		if (!allowed.includes(user.role)) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: `Access denied for role '${user.role}'. Required: ${allowed.join(", ")}`
			});
		}

		return next({
			ctx: {
				...ctx,
				user
			}
		});
	});

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
	if (!ctx.user) {
		throw new TRPCError({ code: "UNAUTHORIZED" });
	}

	return next({ ctx });
});

export const adminProcedure = protectedProcedure.use(requireRole(["admin"]));
export const doctorProcedure = protectedProcedure.use(requireRole(["admin", "doctor"]));
export const nurseProcedure = protectedProcedure.use(requireRole(["admin", "doctor", "nurse"]));
export const staffProcedure = protectedProcedure.use(requireRole(["admin", "doctor", "nurse"]));
export const memberProcedure = protectedProcedure.use(requireRole(["admin", "doctor", "nurse", "member"]));
