import { pgEnum } from "drizzle-orm/pg-core";

export const appointmentStatusEnum = pgEnum("appointment_status", [
	"scheduled",
	"in-progress",
	"completed",
	"cancelled",
	"no-show"
]);

export const appointmentTypeEnum = pgEnum("appointment_type", [
	"consultation",
	"check-up",
	"follow-up",
	"emergency",
	"vaccination",
	"surgery",
	"therapy"
]);

export const genderEnum = pgEnum("gender", ["male", "female", "other", "prefer-not-to-say"]);

export const bloodTypeEnum = pgEnum("blood_type", ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]);

export const transactionTypeEnum = pgEnum("transaction_type", ["income", "outflow"]);

export const expenseCategoryEnum = pgEnum("expense_category", [
	"consultation",
	"medication",
	"laboratory",
	"imaging",
	"procedure",
	"supplies",
	"equipment",
	"rent",
	"utilities",
	"salaries",
	"insurance",
	"other"
]);

export const immunizationStatusEnum = pgEnum("immunization_status", [
	"administered",
	"scheduled",
	"overdue",
	"contraindicated"
]);

export const priorityLevelEnum = pgEnum("priority_level", ["low", "medium", "high", "emergency"]);
