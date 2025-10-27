// packages/api/src/trpc/routers/immunization.ts

import {
	immunizationStatusEnum,
	immunizations,
	insertImmunizationSchema,
	patients,
	updateImmunizationSchema
} from "@smart-apps/db/schema.ts";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, lte, sql } from "drizzle-orm";
import z from "zod/v4";

import { doctorProcedure, router } from "../index";

export const immunizationRouter = router({
	create: doctorProcedure
		.input(insertImmunizationSchema.extend({ patientId: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			const [immunization] = await ctx.db
				.insert(immunizations)
				.values({
					...input,
					administeredBy: ctx.user.id
				})
				.returning();

			return immunization;
		}),

	list: doctorProcedure
		.input(
			z.object({
				page: z.number().min(1).default(1),
				limit: z.number().min(1).max(100).default(20),
				patientId: z.uuid().optional(),
				status: z.enum(immunizationStatusEnum.enumValues).default("scheduled")
			})
		)
		.query(async ({ ctx, input }) => {
			const { page, limit, patientId, status } = input;
			const offset = (page - 1) * limit;

			const whereConditions = [];
			if (patientId) {
				whereConditions.push(eq(immunizations.patientId, patientId));
			}
			if (status) {
				whereConditions.push(eq(immunizations.status, status));
			}

			const [data] = await ctx.db
				.select({
					immunization: immunizations,
					patient: patients
				})
				.from(immunizations)
				.innerJoin(patients, eq(immunizations.patientId, patients.id))
				.where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
				.orderBy(desc(immunizations.administrationDate))
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

	getById: doctorProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ ctx, input }) => {
		const [result] = await ctx.db
			.select({
				immunization: immunizations,
				patient: patients
			})
			.from(immunizations)
			.innerJoin(patients, eq(immunizations.patientId, patients.id))
			.where(eq(immunizations.id, input.id));

		if (!result) {
			throw new TRPCError({ code: "NOT_FOUND", message: "Immunization record not found" });
		}

		return result;
	}),

	update: doctorProcedure
		.input(updateImmunizationSchema.extend({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			const [immunization] = await ctx.db
				.update(immunizations)
				.set({
					...data,
					updatedAt: new Date()
				})
				.where(eq(immunizations.id, id))
				.returning();

			if (!immunization) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Immunization record not found" });
			}

			return immunization;
		}),

	delete: doctorProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
		const [immunization] = await ctx.db.delete(immunizations).where(eq(immunizations.id, input.id)).returning();

		if (!immunization) {
			throw new TRPCError({ code: "NOT_FOUND", message: "Immunization record not found" });
		}

		return immunization;
	}),

	// Pediatric immunization-specific procedures
	getVaccinationSchedule: doctorProcedure
		.input(z.object({ patientId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			return ctx.db
				.select()
				.from(immunizations)
				.where(eq(immunizations.patientId, input.patientId))
				.orderBy(immunizations.administrationDate);
		}),

	getOverdueVaccinations: doctorProcedure
		.input(z.object({ patientId: z.string().uuid().optional() }))
		.query(async ({ ctx, input }) => {
			const whereConditions = [lte(immunizations.nextDueDate, new Date()), eq(immunizations.status, "scheduled")];

			if (input.patientId) {
				whereConditions.push(eq(immunizations.patientId, input.patientId));
			}

			return ctx.db
				.select({
					immunization: immunizations,
					patient: patients
				})
				.from(immunizations)
				.innerJoin(patients, eq(immunizations.patientId, patients.id))
				.where(and(...whereConditions))
				.orderBy(immunizations.nextDueDate);
		}),

	// Common pediatric vaccines tracking
	getVaccineCoverage: doctorProcedure
		.input(z.object({ vaccineName: z.string().optional() }))
		.query(async ({ ctx, input }) => {
			const whereConditions = [eq(immunizations.status, "administered")];

			if (input.vaccineName) {
				whereConditions.push(eq(immunizations.vaccineName, input.vaccineName));
			}

			const results = await ctx.db
				.select({
					vaccineName: immunizations.vaccineName,
					count: sql<number>`count(*)`
				})
				.from(immunizations)
				.where(and(...whereConditions))
				.groupBy(immunizations.vaccineName);

			return results;
		})
});
