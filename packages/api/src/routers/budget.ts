// packages/api/src/trpc/routers/budget.ts

import { budgets, insertBudgetSchema, updateBudgetSchema } from "@smart-apps/db/schema.ts";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { adminProcedure, protectedProcedure, router } from "../index";

export const budgetRouter = router({
	create: adminProcedure.input(insertBudgetSchema).mutation(async ({ ctx, input }) => {
		const [budget] = await ctx.db
			.insert(budgets)
			.values({
				...input,
				createdBy: ctx.user.id
			})
			.returning();

		return budget;
	}),

	list: protectedProcedure
		.input(
			z.object({
				page: z.number().min(1).default(1),
				limit: z.number().min(1).max(100).default(20),
				fiscalYear: z.number().optional()
			})
		)
		.query(async ({ ctx, input }) => {
			const { page, limit, fiscalYear } = input;
			const offset = (page - 1) * limit;

			const whereConditions = [];
			if (fiscalYear) {
				whereConditions.push(eq(budgets.fiscalYear, fiscalYear));
			}

			const [data] = await ctx.db
				.select()
				.from(budgets)
				.where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
				.orderBy(desc(budgets.fiscalYear), desc(budgets.category))
				.limit(limit)
				.offset(offset);

			return {
				data,
				pagination: {
					page,
					limit
				}
			};
		}),

	getById: protectedProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ ctx, input }) => {
		const [budget] = await ctx.db.select().from(budgets).where(eq(budgets.id, input.id));

		if (!budget) {
			throw new TRPCError({ code: "NOT_FOUND", message: "Budget not found" });
		}

		return budget;
	}),

	update: adminProcedure
		.input(updateBudgetSchema.extend({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			const [budget] = await ctx.db
				.update(budgets)
				.set({
					...data,
					updatedAt: new Date()
				})
				.where(eq(budgets.id, id))
				.returning();

			if (!budget) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Budget not found" });
			}

			return budget;
		}),

	delete: adminProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
		const [budget] = await ctx.db.delete(budgets).where(eq(budgets.id, input.id)).returning();

		if (!budget) {
			throw new TRPCError({ code: "NOT_FOUND", message: "Budget not found" });
		}

		return budget;
	}),

	getByFiscalYear: protectedProcedure
		.input(z.object({ fiscalYear: z.number() }))
		.query(async ({ ctx, input }) =>
			ctx.db.select().from(budgets).where(eq(budgets.fiscalYear, input.fiscalYear)).orderBy(budgets.category)
		),

	getBudgetUtilization: adminProcedure.input(z.object({ fiscalYear: z.number() })).query(async ({ ctx, input }) => {
		const budgetData = await ctx.db.select().from(budgets).where(eq(budgets.fiscalYear, input.fiscalYear));

		const totalAllocated = budgetData.reduce((sum, budget) => sum + Number(budget.allocatedAmount), 0);
		const totalSpent = budgetData.reduce((sum, budget) => sum + Number(budget.spentAmount), 0);

		return {
			totalAllocated,
			totalSpent,
			remaining: totalAllocated - totalSpent,
			utilizationRate: totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0,
			byCategory: budgetData.map(budget => ({
				category: budget.category,
				allocated: Number(budget.allocatedAmount),
				spent: Number(budget.spentAmount),
				remaining: Number(budget.allocatedAmount) - Number(budget.spentAmount),
				utilizationRate:
					Number(budget.allocatedAmount) > 0
						? (Number(budget.spentAmount) / Number(budget.allocatedAmount)) * 100
						: 0
			}))
		};
	})
});
