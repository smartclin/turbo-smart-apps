// packages/api/src/trpc/routers/patient.ts

import {
	clinicalNotes, // ✅ FIX: import this table before usage
	insertPatientSchema,
	medicalHistory,
	patientAllergies,
	patients,
	updatePatientSchema
} from "@smart-apps/db/schema.ts";
import { TRPCError } from "@trpc/server"; // ✅ ensure this is imported
import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { z } from "zod";

import { adminProcedure, doctorProcedure, protectedProcedure, router } from "../index";

export const patientRouter = router({
	create: doctorProcedure.input(insertPatientSchema).mutation(async ({ ctx, input }) => {
		const [patient] = await ctx.db
			.insert(patients)
			.values({
				...input,
				createdBy: ctx.user.id
			})
			.returning();

		return patient;
	}),

	list: protectedProcedure
		.input(
			z.object({
				page: z.number().min(1).default(1),
				limit: z.number().min(1).max(100).default(20),
				search: z.string().optional(),
				isActive: z.boolean().optional()
			})
		)
		.query(async ({ ctx, input }) => {
			const { page, limit, search, isActive } = input;
			const offset = (page - 1) * limit;

			const whereConditions = [];
			if (search) {
				whereConditions.push(
					or(
						like(patients.firstName, `%${search}%`),
						like(patients.lastName, `%${search}%`),
						like(patients.medicalRecordNumber, `%${search}%`),
						like(patients.phone, `%${search}%`)
					)
				);
			}
			if (isActive !== undefined) {
				whereConditions.push(eq(patients.isActive, isActive));
			}

			const [data, total] = await Promise.all([
				ctx.db
					.select()
					.from(patients)
					.where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
					.orderBy(desc(patients.createdAt))
					.limit(limit)
					.offset(offset),
				ctx.db
					.select({ count: sql<number>`count(*)` })
					.from(patients)
					.where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
					.then(rows => Number(rows[0]?.count || 0))
			]);

			return {
				data,
				pagination: {
					page,
					limit,
					total,
					pages: Math.ceil(total / limit)
				}
			};
		}),

	getById: protectedProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ ctx, input }) => {
		const [patient] = await ctx.db.select().from(patients).where(eq(patients.id, input.id));

		if (!patient) {
			throw new TRPCError({ code: "NOT_FOUND", message: "Patient not found" });
		}

		return patient;
	}),

	update: doctorProcedure
		.input(updatePatientSchema.extend({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			const [patient] = await ctx.db
				.update(patients)
				.set({
					...data,
					updatedBy: ctx.user.id,
					updatedAt: new Date()
				})
				.where(eq(patients.id, id))
				.returning();

			if (!patient) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Patient not found" });
			}

			return patient;
		}),

	delete: adminProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
		const [patient] = await ctx.db.delete(patients).where(eq(patients.id, input.id)).returning();

		if (!patient) {
			throw new TRPCError({ code: "NOT_FOUND", message: "Patient not found" });
		}

		return patient;
	}),

	// Pediatric-specific procedures
	getMedicalHistory: doctorProcedure
		.input(z.object({ patientId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			return ctx.db
				.select()
				.from(medicalHistory)
				.where(eq(medicalHistory.patientId, input.patientId))
				.orderBy(desc(medicalHistory.diagnosisDate));
		}),

	getAllergies: doctorProcedure.input(z.object({ patientId: z.string().uuid() })).query(async ({ ctx, input }) => {
		return ctx.db
			.select()
			.from(patientAllergies)
			.where(and(eq(patientAllergies.patientId, input.patientId), eq(patientAllergies.isActive, true)));
	}),

	// Pediatric growth tracking
	getPediatricStats: doctorProcedure
		.input(z.object({ patientId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			// ✅ FIX: clinicalNotes is now imported and properly referenced
			const notes = await ctx.db
				.select({
					vitalSigns: clinicalNotes.vitalSigns,
					createdAt: clinicalNotes.createdAt
				})
				.from(clinicalNotes)
				.where(eq(clinicalNotes.patientId, input.patientId))
				.orderBy(desc(clinicalNotes.createdAt))
				.limit(10);

			return {
				growthData: notes
					.filter(note => note.vitalSigns && (note.vitalSigns.height || note.vitalSigns.weight))
					.map(note => ({
						date: note.createdAt,
						height: note.vitalSigns?.height,
						weight: note.vitalSigns?.weight,
						bmi: note.vitalSigns?.bmi
					})),
				latestVitals: notes[0]?.vitalSigns
			};
		})
});
