// scripts/seed.ts
import "dotenv/config";

import { db } from "@smart-apps/db";
import { account } from "@smart-apps/db/schema/auth";
import { clinics, user, usersToClinics } from "@smart-apps/db/schema/index";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";

function generateId(): string {
	return crypto.randomUUID();
}

const ADMIN_EMAIL = "clinysmar@gmail.com";
const ADMIN_PASSWORD = "HealthFact24";
const ADMIN_NAME = "Hazem Ali";
const CLINIC_NAME = "Smart Clinic";

async function main() {
	console.log("--- Start Seeding Admin User and Clinic ---");

	// --- Ensure Clinic Exists ---
	let clinic = await db.query.clinics.findFirst({
		where: eq(clinics.name, CLINIC_NAME)
	});

	if (clinic) {
		console.log(`🏥 Clinic exists: ${clinic.name} (${clinic.id})`);
	} else {
		console.log("🏥 Creating new clinic...");
		const clinicId = generateId();
		[clinic] = await db
			.insert(clinics)
			.values({
				id: clinicId,
				name: CLINIC_NAME,
				address: "123 Medical Center Drive",
				phone: "+1-555-0123",
				email: "info@smartclinic.com",
				createdAt: new Date(),
				updatedAt: new Date()
			})
			.returning();

		console.log(`🏥 Clinic created: ${clinics.name} (${clinics.id})`);
	}

	// --- Check if Admin User Exists ---
	let existingUser = await db.query.user.findFirst({
		where: eq(user.email, ADMIN_EMAIL)
	});

	if (existingUser) {
		console.log(`👨‍💻 Admin user already exists: ${existingUser.email}`);

		// Update role to admin
		await db.update(user).set({ role: "admin", updatedAt: new Date() }).where(eq(user.id, existingUser.id));

		console.log(`✅ Admin privileges assigned to ${existingUser.email}`);
	} else {
		console.log("➕ Creating new admin user directly...");

		try {
			const userId = generateId();
			const hashedPassword = await hash(ADMIN_PASSWORD, 10);

			// Create user directly in database
			const [newUser] = await db
				.insert(user)
				.values({
					id: userId,
					email: ADMIN_EMAIL,
					name: ADMIN_NAME,
					role: "admin",
					gender: true,
					banned: false,
					emailVerified: true,
					createdAt: new Date(),
					updatedAt: new Date()
				})
				.returning();

			// Create account with password
			await db.insert(account).values({
				id: generateId(),
				userId,
				accountId: ADMIN_EMAIL,
				providerId: "credential",
				password: hashedPassword,
				createdAt: new Date(),
				updatedAt: new Date()
			});

			// Link user to clinic
			await db.insert(usersToClinics).values({
				userId: newUser.id,
				clinicId: clinic?.id ?? "",
				role: "admin",
				createdAt: new Date(),
				updatedAt: new Date()
			});

			existingUser = newUser;

			console.log(`✅ Admin user created: ${existingUser?.email}`);
		} catch (error) {
			console.error("❌ Error creating user:", error);
			throw error;
		}
	}

	// --- Verify final state ---
	const finalUser = await db.query.user.findFirst({
		where: eq(user.email, ADMIN_EMAIL)
	});

	if (finalUser) {
		console.log(`👨‍⚕️ Admin user ensured: ${finalUser.name} (ID: ${finalUser.id})`);

		// Check clinic linkage
		const userClinicLink = await db.query.usersToClinics.findFirst({
			where: eq(usersToClinics.userId, finalUser.id)
		});

		if (userClinicLink && clinic) {
			console.log(`🔗 Linked to clinic: ${clinic.name}`);
		} else {
			console.log("⚠️ User not linked to a clinic.");
		}

		console.log(`🎯 Role: ${finalUser.role}`);
	} else {
		throw new Error("❌ Failed to verify admin user creation");
	}

	console.log("--- Seeding Complete ---");
}

main()
	.then(() => {
		console.log("✅ DB Seed Completed Successfully");
		process.exit(0);
	})
	.catch(err => {
		console.error("❌ Seeder Error:", err);
		process.exit(1);
	});
