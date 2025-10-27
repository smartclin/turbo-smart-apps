// packages/api/src/trpc/routers/appointment.ts

import {
	appointmentStatusEnum,
	appointments,
	insertAppointmentSchema,
	patients,
	updateAppointmentSchema
} from "@smart-apps/db/schema/index";
import { TRPCError } from "@trpc/server";
import { and, between, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { doctorProcedure, protectedProcedure, router, staffProcedure } from "../index";

export const appointmentRouter = router({
	create: staffProcedure
		.input(
			insertAppointmentSchema.extend({
				patientId: z.uuid(),
				doctorId: z.string()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const [appointment] = await ctx.db
				.insert(appointments)
				.values({
					...input,
					createdBy: ctx.user.id
				})
				.returning();

			return appointment;
		}),

	list: protectedProcedure
		.input(
			z.object({
				page: z.number().min(1).default(1),
				limit: z.number().min(1).max(100).default(20),
				date: z.date().optional(),
				status: z.enum(appointmentStatusEnum.enumValues).default("scheduled"),
				doctorId: z.string().optional()
			})
		)
		.query(async ({ ctx, input }) => {
			const { page, limit, date, status, doctorId } = input;
			const offset = (page - 1) * limit;

			const whereConditions = [];

			if (date) {
				const startOfDay = new Date(date);
				startOfDay.setHours(0, 0, 0, 0);
				const endOfDay = new Date(date);
				endOfDay.setHours(23, 59, 59, 999);
				whereConditions.push(between(appointments.date, startOfDay, endOfDay));
			}

			if (status) {
				whereConditions.push(eq(appointments.status, status));
			}

			if (doctorId) {
				whereConditions.push(eq(appointments.doctorId, doctorId));
			}

			// ✅ Role-based filtering
			if (ctx.user?.role === "doctor") {
				whereConditions.push(eq(appointments.doctorId, ctx.user.id));
			}

			const data = await ctx.db
				.select({
					appointment: appointments,
					patient: patients
				})
				.from(appointments)
				.innerJoin(patients, eq(appointments.patientId, patients.id))
				.where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
				.orderBy(desc(appointments.date))
				.limit(limit)
				.offset(offset);

			return {
				data,
				pagination: { page, limit }
			};
		}),

	getById: protectedProcedure.input(z.object({ id: z.uuid() })).query(async ({ ctx, input }) => {
		const [result] = await ctx.db
			.select({
				appointment: appointments,
				patient: patients
			})
			.from(appointments)
			.innerJoin(patients, eq(appointments.patientId, patients.id))
			.where(eq(appointments.id, input.id));

		if (!result) {
			throw new TRPCError({ code: "NOT_FOUND", message: "Appointment not found" });
		}

		// Check if doctor can access this appointment
		if (ctx.user?.role === "doctor" && result.appointment.doctorId !== ctx.user.id) {
			throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
		}

		return result;
	}),

	update: staffProcedure.input(updateAppointmentSchema.extend({ id: z.uuid() })).mutation(async ({ ctx, input }) => {
		const { id, ...data } = input;

		// Check if doctor can update this appointment
		if (ctx.user.role === "doctor") {
			const [existing] = await ctx.db.select().from(appointments).where(eq(appointments.id, id));

			if (existing?.doctorId !== ctx.user.id) {
				throw new TRPCError({ code: "FORBIDDEN", message: "Can only update your own appointments" });
			}
		}

		const [appointment] = await ctx.db
			.update(appointments)
			.set({
				...data,
				updatedAt: new Date()
			})
			.where(eq(appointments.id, id))
			.returning();

		if (!appointment) {
			throw new TRPCError({ code: "NOT_FOUND", message: "Appointment not found" });
		}

		return appointment;
	}),

	delete: staffProcedure.input(z.object({ id: z.uuid() })).mutation(async ({ ctx, input }) => {
		// Check if doctor can delete this appointment
		if (ctx.user.role === "doctor") {
			const [existing] = await ctx.db.select().from(appointments).where(eq(appointments.id, input.id));

			if (existing?.doctorId !== ctx.user.id) {
				throw new TRPCError({ code: "FORBIDDEN", message: "Can only delete your own appointments" });
			}
		}

		const [appointment] = await ctx.db.delete(appointments).where(eq(appointments.id, input.id)).returning();

		if (!appointment) {
			throw new TRPCError({ code: "NOT_FOUND", message: "Appointment not found" });
		}

		return appointment;
	}),

	// Pediatric-specific procedures
	getToday: protectedProcedure.query(async ({ ctx }) => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		const whereConditions = [between(appointments.date, today, tomorrow)];

		if (ctx.user?.role === "doctor") {
			whereConditions.push(eq(appointments.doctorId, ctx.user.id));
		}

		return ctx.db
			.select({
				appointment: appointments,
				patient: patients
			})
			.from(appointments)
			.innerJoin(patients, eq(appointments.patientId, patients.id))
			.where(and(...whereConditions))
			.orderBy(appointments.date);
	}),

	getUpcomingVaccinations: doctorProcedure
		.input(z.object({ days: z.number().min(1).max(365).default(30) }))
		.query(async ({ ctx, input }) => {
			const startDate = new Date();
			const endDate = new Date();
			endDate.setDate(endDate.getDate() + input.days);

			return ctx.db
				.select({
					appointment: appointments,
					patient: patients
				})
				.from(appointments)
				.innerJoin(patients, eq(appointments.patientId, patients.id))
				.where(and(between(appointments.date, startDate, endDate), eq(appointments.type, "vaccination")))
				.orderBy(appointments.date);
		})
});
