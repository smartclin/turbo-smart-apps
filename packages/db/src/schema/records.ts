import { relations, sql } from "drizzle-orm";
import { boolean, check, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { user } from "./auth";
import { appointments } from "./clinic";
import { immunizationStatusEnum, priorityLevelEnum } from "./enum";
import { clinics, doctors, patients } from "./users";

// --- MEDICAL HISTORY TABLE (NO CHANGE REQUIRED) ---
export const medicalHistory = pgTable("medical_history", {
	id: uuid("id").primaryKey().defaultRandom(),
	patientId: uuid("patient_id")
		.references(() => patients.id, { onDelete: "cascade" })
		.notNull(),
	condition: text("condition").notNull(),
	diagnosisDate: timestamp("diagnosis_date", { mode: "date" }).notNull(),
	status: text("status").default("active"), // active, resolved, chronic
	severity: priorityLevelEnum("severity"),
	notes: text("notes"),
	treatment: text("treatment"),

	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date()),
	createdBy: text("created_by").references(() => user.id)
}).enableRLS();

export const immunizations = pgTable(
	"immunizations",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		patientId: uuid("patient_id")
			.references(() => patients.id, { onDelete: "cascade" })
			.notNull(),
		vaccineName: text("vaccine_name").notNull(),
		vaccineCode: text("vaccine_code"), // CVX code
		manufacturer: text("manufacturer"),
		lotNumber: text("lot_number"),
		administrationDate: timestamp("administration_date", {
			mode: "date"
		}).notNull(),
		nextDueDate: timestamp("next_due_date", { mode: "date" }),
		status: immunizationStatusEnum("status").default("administered").notNull(),
		administeredBy: text("administered_by").references(() => user.id),
		administrationSite: text("administration_site"), // Left arm, right arm, etc.
		doseNumber: integer("dose_number").default(1),
		totalDoses: integer("total_doses").default(1),
		reactions: text("reactions"),
		notes: text("notes"),

		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
	},
	// FIX: Using array syntax [] instead of object literal {}
	table => [
		// Ensure next due date is after administration date
		check("due_date_check", sql`${table.nextDueDate} IS NULL OR ${table.nextDueDate} > ${table.administrationDate}`)
	]
).enableRLS();

// --- CLINICAL NOTES TABLE (NO CHANGE REQUIRED) ---
export const clinicalNotes = pgTable("clinical_notes", {
	id: uuid("id").primaryKey().defaultRandom(),
	patientId: uuid("patient_id")
		.references(() => patients.id, { onDelete: "cascade" })
		.notNull(),
	appointmentId: uuid("appointment_id").references(() => appointments.id),
	authorId: text("author_id")
		.references(() => user.id)
		.notNull(),
	subjective: text("subjective"), // Patient's description
	objective: text("objective"), // Clinical findings
	assessment: text("assessment"), // Diagnosis/assessment
	plan: text("plan"), // Treatment plan
	vitalSigns: jsonb("vital_signs").$type<{
		bloodPressure?: string;
		heartRate?: number;
		temperature?: number;
		respiratoryRate?: number;
		oxygenSaturation?: number;
		height?: number;
		weight?: number;
		bmi?: number;
	}>(),
	isConfidential: boolean("is_confidential").default(false),

	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date())
}).enableRLS();

export const medicalRecords = pgTable("medical_records", {
	id: uuid("id").defaultRandom().primaryKey(),
	patientId: uuid("patient_id")
		.notNull()
		.references(() => patients.id, { onDelete: "cascade" }),
	appointmentId: uuid("appointment_id").references(() => appointments.id, {
		onDelete: "set null"
	}),
	doctorId: uuid("doctor_id")
		.notNull()
		.references(() => doctors.id, { onDelete: "cascade" }),
	clinicId: uuid("clinic_id")
		.notNull()
		.references(() => clinics.id, { onDelete: "cascade" }),
	diagnosis: text("diagnosis").notNull(),
	symptoms: text("symptoms"),
	treatment: text("treatment"),
	medications: text("medications"),
	notes: text("notes"),
	attachments: text("attachments"), // JSON array of file URLs
	followUpDate: timestamp("follow_up_date"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull()
});

export const medicalRecordsRelations = relations(medicalRecords, ({ one }) => ({
	patient: one(patients, {
		fields: [medicalRecords.patientId],
		references: [patients.id]
	}),
	appointment: one(appointments, {
		fields: [medicalRecords.appointmentId],
		references: [appointments.id]
	}),
	doctor: one(doctors, {
		fields: [medicalRecords.doctorId],
		references: [doctors.id]
	}),
	clinic: one(clinics, {
		fields: [medicalRecords.clinicId],
		references: [clinics.id]
	})
}));

export const patientAllergies = pgTable("patient_allergies", {
	id: uuid("id").primaryKey().defaultRandom(),
	patientId: uuid("patient_id")
		.references(() => patients.id, { onDelete: "cascade" })
		.notNull(),
	allergen: text("allergen").notNull(),
	severity: priorityLevelEnum("severity").notNull(),
	reaction: text("reaction"),
	onsetDate: timestamp("onset_date", { mode: "date" }),
	isActive: boolean("is_active").default(true),

	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date())
}).enableRLS();

export const medicalHistoryRelations = relations(medicalHistory, ({ one }) => ({
	patient: one(patients, {
		fields: [medicalHistory.patientId],
		references: [patients.id]
	}),
	createdByUser: one(user, {
		fields: [medicalHistory.createdBy],
		references: [user.id]
	})
}));

export const immunizationsRelations = relations(immunizations, ({ one }) => ({
	patient: one(patients, {
		fields: [immunizations.patientId],
		references: [patients.id]
	}),
	administeredByUser: one(user, {
		fields: [immunizations.administeredBy],
		references: [user.id]
	})
}));

export const clinicalNotesRelations = relations(clinicalNotes, ({ one }) => ({
	patient: one(patients, {
		fields: [clinicalNotes.patientId],
		references: [patients.id]
	}),
	appointment: one(appointments, {
		fields: [clinicalNotes.appointmentId],
		references: [appointments.id]
	}),
	author: one(user, {
		fields: [clinicalNotes.authorId],
		references: [user.id]
	})
}));

export const patientAllergiesRelations = relations(patientAllergies, ({ one }) => ({
	patient: one(patients, {
		fields: [patientAllergies.patientId],
		references: [patients.id]
	})
}));
