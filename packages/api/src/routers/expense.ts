// packages/api/src/trpc/routers/expense.ts

import {
	expenseCategoryEnum,
	expenses,
	insertExpenseSchema,
	patients,
	transactionTypeEnum,
	updateExpenseSchema
} from "@smart-apps/db/schema.ts";
import { TRPCError } from "@trpc/server";
import { and, between, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { adminProcedure, protectedProcedure, router, staffProcedure } from "../index";

export const expenseRouter = router({
	create: staffProcedure.input(insertExpenseSchema).mutation(async ({ ctx, input }) => {
		const [expense] = await ctx.db
			.insert(expenses)
			.values({
				...input,
				createdBy: ctx.user.id
			})
			.returning();

		return expense;
	}),

	list: protectedProcedure
		.input(
			z.object({
				page: z.number().min(1).default(1),
				limit: z.number().min(1).max(100).default(20),
				startDate: z.date().optional(),
				endDate: z.date().optional(),
				type: z.enum(transactionTypeEnum.enumValues).default("income"),
				category: z.enum(expenseCategoryEnum.enumValues).default("consultation")
			})
		)
		.query(async ({ ctx, input }) => {
			const { page, limit, startDate, endDate, type, category } = input;
			const offset = (page - 1) * limit;

			const whereConditions = [];
			if (startDate && endDate) {
				whereConditions.push(between(expenses.transactionDate, startDate, endDate));
			}
			if (type) {
				whereConditions.push(eq(expenses.type, type));
			}
			if (category) {
				whereConditions.push(eq(expenses.category, category));
			}

			const [data] = await ctx.db
				.select({
					expense: expenses,
					patient: patients
				})
				.from(expenses)
				.leftJoin(patients, eq(expenses.patientId, patients.id))
				.where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
				.orderBy(desc(expenses.transactionDate))
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
		const [result] = await ctx.db
			.select({
				expense: expenses,
				patient: patients
			})
			.from(expenses)
			.leftJoin(patients, eq(expenses.patientId, patients.id))
			.where(eq(expenses.id, input.id));

		if (!result) {
			throw new TRPCError({ code: "NOT_FOUND", message: "Expense not found" });
		}

		return result;
	}),

	update: staffProcedure
		.input(updateExpenseSchema.extend({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			const [expense] = await ctx.db
				.update(expenses)
				.set({
					...data,
					updatedAt: new Date()
				})
				.where(eq(expenses.id, id))
				.returning();

			if (!expense) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Expense not found" });
			}

			return expense;
		}),

	delete: adminProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
		const [expense] = await ctx.db.delete(expenses).where(eq(expenses.id, input.id)).returning();

		if (!expense) {
			throw new TRPCError({ code: "NOT_FOUND", message: "Expense not found" });
		}

		return expense;
	}),

	// Pediatric clinic financial reports
	getFinancialSummary: adminProcedure
		.input(
			z.object({
				startDate: z.date(),
				endDate: z.date()
			})
		)
		.query(async ({ ctx, input }) => {
			const { startDate, endDate } = input;

			const results = await ctx.db
				.select()
				.from(expenses)
				.where(and(between(expenses.transactionDate, startDate, endDate), eq(expenses.status, "completed")));

			const summary = results.reduce(
				(acc, expense) => {
					const amount = Number(expense.amount);
					if (expense.type === "income") {
						acc.totalIncome += amount;
						acc.incomeByCategory[expense.category] = (acc.incomeByCategory[expense.category] || 0) + amount;
					} else {
						acc.totalExpenses += amount;
						acc.expensesByCategory[expense.category] =
							(acc.expensesByCategory[expense.category] || 0) + amount;
					}
					return acc;
				},
				{
					totalIncome: 0,
					totalExpenses: 0,
					incomeByCategory: {} as Record<string, number>,
					expensesByCategory: {} as Record<string, number>
				}
			);

			return summary;
		})
});
