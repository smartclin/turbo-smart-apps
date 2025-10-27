import type { SubArray } from "better-auth/plugins/access";
import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements, userAc } from "better-auth/plugins/admin/access";

// --- Define Resources & Actions ---

/**
 * Define your application's resources and their available actions.
 * Merging with `defaultStatements` ensures a base set of user and session permissions.
 */
export const statement = {
	// Add custom resources and their actions here
	task: ["create", "read", "update", "delete"],
	patients: ["create", "read", "update", "delete"],
	appointments: ["create", "read", "update", "delete"],
	records: ["create", "read", "update", "delete"],
	prescriptions: ["create", "read", "update", "delete"],
	staff: ["create", "read", "update", "delete"],
	payments: ["create", "read", "update", "delete"],
	...defaultStatements
} as const;

/**
 * Access controller instance
 */
export const ac = createAccessControl(statement);

// --- Define Roles ---

/**
 * Admin role: Full control over all resources.
 */
const adminRole = ac.newRole({
	task: ["create", "read", "update", "delete"],
	patients: ["create", "read", "update", "delete"],
	appointments: ["create", "read", "update", "delete"],
	records: ["create", "read", "update", "delete"],
	prescriptions: ["create", "read", "update", "delete"],
	staff: ["create", "read", "update", "delete"],
	payments: ["create", "read", "update", "delete"],
	...adminAc.statements
});

/**
 * Doctor role: Permissions focused on patient care and records.
 */
const doctorRole = ac.newRole({
	...userAc.statements,
	patients: ["read", "update"], // Can view and update patient demographics
	appointments: ["read", "update"], // Can view and update appointment details
	records: ["create", "read", "update"], // Can create, read, and update medical records
	prescriptions: ["create", "read", "update"], // Can create, read, and update prescriptions
	staff: ["read"], // Can view staff information (e.g., for collaboration)
	payments: ["read"] // Can view payment details (e.g., for billing inquiries)
});

/**
 * Staff role (e.g., receptionist, nurse): Permissions focused on administrative tasks.
 */
const nurseRole = ac.newRole({
	...userAc.statements,
	patients: ["create", "read", "update"], // Can register new patients, view, and update patient info
	appointments: ["create", "read", "update"], // Can schedule, view, and update appointments
	records: ["read"], // Can view patient records (e.g., for administrative purposes)
	prescriptions: ["read"], // Can view prescriptions
	staff: ["read"], // Can view other staff information
	payments: ["create", "read"] // Can record new payments and view payment history
});

/**
 * Patient role: Permissions to access their own data.
 */
const memberRole = ac.newRole({
	...userAc.statements,
	patients: ["read", "update"], // Can read and update their own profile information
	appointments: ["create", "read", "update"], // Can create, read, and update their own appointments
	records: ["read"], // Can read their own medical records
	prescriptions: ["read"], // Can read their own prescriptions
	staff: [], // No access to staff management
	payments: ["create", "read"] // Can make payments and view their own payment history
});

export const allRoles = {
	admin: adminRole,
	doctor: doctorRole,
	nurse: nurseRole,
	member: memberRole
};

export const rolesData = ["admin", "doctor", "nurse", "member"] as const;
export type RolesEnum = (typeof rolesData)[number]; // "admin" | "doctor" | "nurse" | "member"

export type rolesEnumData = (typeof rolesData)[number];
export type Permissions = {
	[k in keyof typeof statement]?: SubArray<(typeof statement)[k]>;
};
