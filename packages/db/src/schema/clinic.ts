import { relations, sql } from "drizzle-orm";
import { boolean, check, decimal, integer, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

import { user } from "./auth";
import {
	appointmentStatusEnum,
	appointmentTypeEnum,
	expenseCategoryEnum,
	priorityLevelEnum,
	transactionTypeEnum
} from "./enum";
import { clinicalNotes } from "./records";
import { clinics, doctors, patients } from "./users";

// --- APPOINTMENTS TABLE (FIXED) ---
export const appointments = pgTable(
	"appointments",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		patientId: uuid("patient_id")
			.references(() => patients.id, { onDelete: "cascade" })
			.notNull(),
		userId: text("user_id")
			.references(() => user.id)
			.notNull(),
		doctorId: uuid("doctor_id")
			.notNull()
			.references(() => doctors.id, { onDelete: "cascade" }),

		appointmentPrice: integer("appointment_price_in_cents").notNull(),
		clinicId: uuid("clinic_id")
			.notNull()
			.references(() => clinics.id, { onDelete: "cascade" }),

		date: timestamp("date").notNull(),
		duration: integer("duration").default(30).notNull(), // in minutes
		type: appointmentTypeEnum("type").notNull(),
		status: appointmentStatusEnum("status").default("scheduled").notNull(),
		priority: priorityLevelEnum("priority").default("medium"),
		reason: text("reason"),
		symptoms: text("symptoms"),
		notes: text("notes"),
		diagnosis: text("diagnosis"),
		prescription: text("prescription"),
		followUpDate: timestamp("follow_up_date", { mode: "date" }),

		// Recurring appointments
		isRecurring: boolean("is_recurring").default(false),
		recurrencePattern: text("recurrence_pattern"), // daily, weekly, monthly
		recurrenceEndDate: timestamp("recurrence_end_date"),

		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date()),
		createdBy: text("created_by").references(() => user.id)
	},
	// FIX: Using array syntax [] instead of object literal {}
	table => [
		// Ensure appointment is in the future when scheduled
		check("scheduled_at_check", sql`${table.date} > CURRENT_TIMESTAMP`),
		// Ensure duration is positive
		check("duration_check", sql`${table.duration} > 0`)
	]
).enableRLS();

// --- EXPENSES TABLE (FIXED) ---
export const expenses = pgTable(
	"expenses",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		type: transactionTypeEnum("type").notNull(),
		category: expenseCategoryEnum("category").notNull(),
		amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
		description: text("description").notNull(),
		transactionDate: timestamp("transaction_date", { mode: "date" }).notNull(),
		referenceNumber: text("reference_number"),
		patientId: uuid("patient_id").references(() => patients.id),
		appointmentId: uuid("appointment_id").references(() => appointments.id),
		isRecurring: boolean("is_recurring").default(false),
		recurrenceInterval: text("recurrence_interval"), // monthly, quarterly, yearly
		paymentMethod: text("payment_method"), // cash, card, insurance, bank transfer
		status: text("status").default("completed"), // pending, completed, failed

		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date()),
		createdBy: text("created_by").references(() => user.id)
	},
	// FIX: Converted check constraints to an array
	table => [
		// Ensure amount is positive
		check("amount_check", sql`${table.amount} > 0`)
	]
).enableRLS();

export const budgets = pgTable(
	"budgets",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		category: expenseCategoryEnum("category").notNull(),
		fiscalYear: integer("fiscal_year").notNull(),
		allocatedAmount: decimal("allocated_amount", { precision: 10, scale: 2 }).notNull(),
		spentAmount: decimal("spent_amount", { precision: 10, scale: 2 }).default("0"),
		notes: text("notes"),

		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date()),
		createdBy: text("created_by").references(() => user.id)
	},
	table => [
		// Use unique constraint instead of primary key for the composite
		unique("budgets_category_year_unique").on(table.category, table.fiscalYear)
	]
).enableRLS();

// --- JUNCTION TABLE (NO CHANGE REQUIRED) ---

// ==================== RELATIONS ====================

export const expensesRelations = relations(expenses, ({ one }) => ({
	patient: one(patients, {
		fields: [expenses.patientId],
		references: [patients.id]
	}),
	appointment: one(appointments, {
		fields: [expenses.appointmentId],
		references: [appointments.id]
	}),
	createdByUser: one(user, {
		fields: [expenses.createdBy],
		references: [user.id]
	})
}));

export const budgetsRelations = relations(budgets, ({ one }) => ({
	createdByUser: one(user, {
		fields: [budgets.createdBy],
		references: [user.id]
	})
}));

export const appointmentsRelations = relations(appointments, ({ one, many }) => ({
	patient: one(patients, {
		fields: [appointments.patientId],
		references: [patients.id]
	}),
	doctor: one(user, {
		fields: [appointments.doctorId],
		references: [user.id]
	}),
	clinicalNotes: many(clinicalNotes),
	expenses: many(expenses),
	createdByUser: one(user, {
		fields: [appointments.createdBy],
		references: [user.id]
	})
}));
