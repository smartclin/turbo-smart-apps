import { relations, sql } from "drizzle-orm";
import { boolean, check, integer, jsonb, pgTable, text, time, timestamp, uuid } from "drizzle-orm/pg-core";

import { user } from "./auth";
import { appointments, expenses } from "./clinic";
import { bloodTypeEnum, genderEnum } from "./enum";
import { clinicalNotes, immunizations, medicalHistory, medicalRecords, patientAllergies } from "./records";

export const clinics = pgTable("clinics", {
	id: uuid("id").defaultRandom().primaryKey(),
	name: text("name").notNull(),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow()
});

export const doctors = pgTable("doctors", {
	id: uuid("id").defaultRandom().primaryKey(),
	clinicId: uuid("clinic_id")
		.notNull()
		.references(() => clinics.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	avatarImageUrl: text("avatar_image_url"),
	// 1 - Monday, 2 - Tuesday, 3 - Wednesday, 4 - Thursday, 5 - Friday, 6 - Saturday, 0 - Sunday
	availableFromWeekDay: integer("available_from_week_day").notNull(),
	availableToWeekDay: integer("available_to_week_day").notNull(),
	availableFromTime: time("available_from_time").notNull(),
	availableToTime: time("available_to_time").notNull(),
	specialty: text("specialty").notNull(),
	appointmentPrice: integer("appointment_price_in_cents").notNull(),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow()
});

export const usersToClinics = pgTable("users_to_clinics", {
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	clinicId: uuid("clinic_id")
		.notNull()
		.references(() => clinics.id, { onDelete: "cascade" }),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// --- PATIENTS TABLE (FIXED) ---
export const patients = pgTable(
	"patients",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		medicalRecordNumber: text("medical_record_number").notNull().unique(),
		firstName: text("first_name").notNull(),
		lastName: text("last_name").notNull(),
		dateOfBirth: timestamp("date_of_birth", { mode: "date" }).notNull(),
		gender: genderEnum("gender").notNull(),
		bloodType: bloodTypeEnum("blood_type"),
		phone: text("phone"),
		email: text("email"),
		address: text("address"),
		emergencyContactName: text("emergency_contact_name"),
		emergencyContactPhone: text("emergency_contact_phone"),
		emergencyContactRelation: text("emergency_contact_relation"),
		insuranceProvider: text("insurance_provider"),
		insurancePolicyNumber: text("insurance_policy_number"),
		allergies: jsonb("allergies").$type<string[]>().default([]),
		currentMedications: jsonb("current_medications").$type<string[]>().default([]),
		preExistingConditions: jsonb("pre_existing_conditions").$type<string[]>().default([]),
		notes: text("notes"),
		isActive: boolean("is_active").default(true).notNull(),

		// Audit fields
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date()),
		createdBy: text("created_by").references(() => user.id),
		updatedBy: text("updated_by").references(() => user.id)
	},
	// FIX: Using array syntax [] instead of object literal {}
	table => [
		// Ensure medical record number follows pattern
		check("mrn_check", sql`${table.medicalRecordNumber} ~ '^MRN-[0-9]{6}$'`),
		// Ensure date of birth is in the past
		check("dob_check", sql`${table.dateOfBirth} < CURRENT_TIMESTAMP`)
	]
).enableRLS();

export const clinicsRelations = relations(clinics, ({ many }) => ({
	doctors: many(doctors),
	patients: many(patients),
	appointments: many(appointments),
	usersToClinics: many(usersToClinics),
	medicalRecords: many(medicalRecords)
}));

export const usersToClinicsRelations = relations(usersToClinics, ({ one }) => ({
	user: one(user, {
		fields: [usersToClinics.userId],
		references: [user.id]
	}),
	clinic: one(clinics, {
		fields: [usersToClinics.clinicId],
		references: [clinics.id]
	})
}));
export const doctorsRelations = relations(doctors, ({ many, one }) => ({
	clinic: one(clinics, {
		fields: [doctors.clinicId],
		references: [clinics.id]
	}),
	appointments: many(appointments),
	medicalRecords: many(medicalRecords)
}));
export const patientsRelations = relations(patients, ({ many, one }) => ({
	medicalHistories: many(medicalHistory),
	appointments: many(appointments),
	immunizations: many(immunizations),
	clinicalNotes: many(clinicalNotes),
	expenses: many(expenses),
	allergies: many(patientAllergies),
	createdByUser: one(user, {
		fields: [patients.createdBy],
		references: [user.id]
	}),
	updatedByUser: one(user, {
		fields: [patients.updatedBy],
		references: [user.id]
	})
}));
