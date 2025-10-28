import type { InferInsertModel } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from "zod/v4";

import type { user } from "./auth";
import { appointments, budgets, expenses } from "./clinic";
import { bloodTypeEnum } from "./enum";
import { clinicalNotes, immunizations, type medicalHistory, type patientAllergies } from "./records";
import { patients } from "./users";

// Patient Schemas
// Patient Schemas
export const insertPatientSchema = createInsertSchema(patients, {
	medicalRecordNumber: z.string().regex(/^MRN-[0-9]{6}$/, "MRN must be in format MRN-000001"),
	firstName: z.string().min(1, "First name is required"),
	lastName: z.string().min(1, "Last name is required"),
	dateOfBirth: z.date().max(new Date(), "Date of birth cannot be in the future"),
	phone: z.string().optional(),
	// FIX: Use .optional().or(z.literal("")) to align with form input
	email: z.email().optional().or(z.literal("")),

	// FIX: Explicitly chain .optional() with .default([]) for array fields
	allergies: z.array(z.string()).optional().default([]),
	currentMedications: z.array(z.string()).optional().default([]),
	preExistingConditions: z.array(z.string()).optional().default([]),

	// Non-null but non-required fields in the form that could be undefined
	bloodType: z.enum(bloodTypeEnum.enumValues).nullish(),
	address: z.string().nullish(),
	emergencyContactName: z.string().nullish(),
	emergencyContactPhone: z.string().nullish(),
	emergencyContactRelation: z.string().nullish(),
	insuranceProvider: z.string().nullish(),
	insurancePolicyNumber: z.string().nullish(),
	notes: z.string().nullish()
}).omit({
	id: true,

	createdAt: true,
	updatedAt: true,
	createdBy: true,
	updatedBy: true
});

export const selectPatientSchema = createSelectSchema(patients);
export const updatePatientSchema = insertPatientSchema.partial();

// Appointment Schemas
export const insertAppointmentSchema = createInsertSchema(appointments, {
	date: z.date().min(new Date(), "Appointment must be in the future"),
	duration: z.number().int().positive("Duration must be positive"),
	reason: z.string().min(1, "Reason is required")
}).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
	createdBy: true
});

export const selectAppointmentSchema = createSelectSchema(appointments);
export const updateAppointmentSchema = insertAppointmentSchema.partial();

// Immunization Schemas
export const insertImmunizationSchema = createInsertSchema(immunizations, {
	administrationDate: z.date().max(new Date(), "Administration date cannot be in the future"),
	vaccineName: z.string().min(1, "Vaccine name is required"),
	doseNumber: z.number().int().positive("Dose number must be positive"),
	totalDoses: z.number().int().positive("Total doses must be positive")
}).omit({
	id: true,
	createdAt: true,
	updatedAt: true
});

export const selectImmunizationSchema = createSelectSchema(immunizations);
export const updateImmunizationSchema = insertImmunizationSchema.partial();

// Expense Schemas
export const insertExpenseSchema = createInsertSchema(expenses, {
	amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Amount must be a valid decimal"),
	description: z.string().min(1, "Description is required"),
	transactionDate: z.date().max(new Date(), "Transaction date cannot be in the future")
}).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
	createdBy: true
});

export const selectExpenseSchema = createSelectSchema(expenses);
export const updateExpenseSchema = insertExpenseSchema.partial();

// Clinical Note Schemas (SOAP format)
export const insertClinicalNoteSchema = createInsertSchema(clinicalNotes, {
	subjective: z.string().optional(),
	objective: z.string().optional(),
	assessment: z.string().optional(),
	plan: z.string().optional()
}).omit({
	id: true,
	createdAt: true,
	updatedAt: true
});

export const selectClinicalNoteSchema = createSelectSchema(clinicalNotes);
export const updateClinicalNoteSchema = insertClinicalNoteSchema.partial();

// Budget Schemas
export const insertBudgetSchema = createInsertSchema(budgets, {
	fiscalYear: z.number().int().min(2000).max(2100),
	allocatedAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Amount must be a valid decimal")
}).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
	createdBy: true,
	spentAmount: true
});

export const selectBudgetSchema = createSelectSchema(budgets);
export const updateBudgetSchema = insertBudgetSchema.partial();

export type User = typeof user.$inferSelect;
export type InsertUser = InferInsertModel<typeof user>;

export type Patient = typeof patients.$inferSelect;
export type NewPatient = typeof patients.$inferInsert;

export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;

export type Immunization = typeof immunizations.$inferSelect;
export type NewImmunization = typeof immunizations.$inferInsert;

export type ClinicalNote = typeof clinicalNotes.$inferSelect;
export type NewClinicalNote = typeof clinicalNotes.$inferInsert;

export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;

export type Budget = typeof budgets.$inferSelect;
export type NewBudget = typeof budgets.$inferInsert;

export type MedicalHistory = typeof medicalHistory.$inferSelect;
export type NewMedicalHistory = typeof medicalHistory.$inferInsert;

export type PatientAllergy = typeof patientAllergies.$inferSelect;
export type NewPatientAllergy = typeof patientAllergies.$inferInsert;

// Zod inference types
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type UpdatePatient = z.infer<typeof updatePatientSchema>;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type InsertImmunization = z.infer<typeof insertImmunizationSchema>;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type InsertClinicalNote = z.infer<typeof insertClinicalNoteSchema>;
export type InsertBudget = z.infer<typeof insertBudgetSchema>;
