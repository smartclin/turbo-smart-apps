// packages/api/src/trpc/routers/clinicalNote.ts

import {
	appointments,
	clinicalNotes,
	insertClinicalNoteSchema,
	patients,
	updateClinicalNoteSchema
} from "@smart-apps/db/schema.ts";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { doctorProcedure, router } from "../index";

export const clinicalNoteRouter = router({
	create: doctorProcedure
		.input(
			insertClinicalNoteSchema.extend({
				patientId: z.uuid(),
				appointmentId: z.uuid().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const [note] = await ctx.db
				.insert(clinicalNotes)
				.values({
					...input,
					authorId: ctx.user.id
				})
				.returning();

			return note;
		}),

	list: doctorProcedure
		.input(
			z.object({
				page: z.number().min(1).default(1),
				limit: z.number().min(1).max(100).default(20),
				patientId: z.uuid().optional()
			})
		)
		.query(async ({ ctx, input }) => {
			const { page, limit, patientId } = input;
			const offset = (page - 1) * limit;

			const whereConditions = [];
			if (patientId) {
				whereConditions.push(eq(clinicalNotes.patientId, patientId));
			}

			// Doctors can only see notes they authored or for their patients
			if (ctx.user.role === "doctor") {
				whereConditions.push(eq(clinicalNotes.authorId, ctx.user.id));
			}

			const [data] = await ctx.db
				.select({
					note: clinicalNotes,
					patient: patients,
					appointment: appointments
				})
				.from(clinicalNotes)
				.innerJoin(patients, eq(clinicalNotes.patientId, patients.id))
				.leftJoin(appointments, eq(clinicalNotes.appointmentId, appointments.id))
				.where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
				.orderBy(desc(clinicalNotes.createdAt))
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

	getById: doctorProcedure.input(z.object({ id: z.uuid() })).query(async ({ ctx, input }) => {
		const [result] = await ctx.db
			.select({
				note: clinicalNotes,
				patient: patients,
				appointment: appointments
			})
			.from(clinicalNotes)
			.innerJoin(patients, eq(clinicalNotes.patientId, patients.id))
			.leftJoin(appointments, eq(clinicalNotes.appointmentId, appointments.id))
			.where(eq(clinicalNotes.id, input.id));

		if (!result) {
			throw new TRPCError({ code: "NOT_FOUND", message: "Clinical note not found" });
		}

		// Check if doctor can access this note
		if (ctx.user.role === "doctor" && result.note.authorId !== ctx.user.id) {
			throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
		}

		return result;
	}),

	update: doctorProcedure
		.input(updateClinicalNoteSchema.extend({ id: z.uuid() }))
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			// Check if doctor can update this note
			if (ctx.user.role === "doctor") {
				const [existing] = await ctx.db.select().from(clinicalNotes).where(eq(clinicalNotes.id, id));

				if (existing?.authorId !== ctx.user.id) {
					throw new TRPCError({ code: "FORBIDDEN", message: "Can only update your own notes" });
				}
			}

			const [note] = await ctx.db
				.update(clinicalNotes)
				.set({
					...data,
					updatedAt: new Date()
				})
				.where(eq(clinicalNotes.id, id))
				.returning();

			if (!note) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Clinical note not found" });
			}

			return note;
		}),

	delete: doctorProcedure.input(z.object({ id: z.uuid() })).mutation(async ({ ctx, input }) => {
		// Check if doctor can delete this note
		if (ctx.user.role === "doctor") {
			const [existing] = await ctx.db.select().from(clinicalNotes).where(eq(clinicalNotes.id, input.id));

			if (existing?.authorId !== ctx.user.id) {
				throw new TRPCError({ code: "FORBIDDEN", message: "Can only delete your own notes" });
			}
		}

		const [note] = await ctx.db.delete(clinicalNotes).where(eq(clinicalNotes.id, input.id)).returning();

		if (!note) {
			throw new TRPCError({ code: "NOT_FOUND", message: "Clinical note not found" });
		}

		return note;
	}),

	// Pediatric-specific SOAP note procedures
	getGrowthChartData: doctorProcedure.input(z.object({ patientId: z.uuid() })).query(async ({ ctx, input }) => {
		const notes = await ctx.db
			.select({
				vitalSigns: clinicalNotes.vitalSigns,
				createdAt: clinicalNotes.createdAt
			})
			.from(clinicalNotes)
			.where(eq(clinicalNotes.patientId, input.patientId))
			.orderBy(clinicalNotes.createdAt);

		return notes
			.filter(note => note.vitalSigns && (note.vitalSigns.height || note.vitalSigns.weight))
			.map(note => ({
				date: note.createdAt,
				height: note.vitalSigns?.height,
				weight: note.vitalSigns?.weight,
				bmi: note.vitalSigns?.bmi
			}));
	})
});
