CREATE TYPE "public"."appointment_status" AS ENUM('scheduled', 'in-progress', 'completed', 'cancelled', 'no-show');--> statement-breakpoint
CREATE TYPE "public"."appointment_type" AS ENUM('consultation', 'check-up', 'follow-up', 'emergency', 'vaccination', 'surgery', 'therapy');--> statement-breakpoint
CREATE TYPE "public"."blood_type" AS ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');--> statement-breakpoint
CREATE TYPE "public"."expense_category" AS ENUM('consultation', 'medication', 'laboratory', 'imaging', 'procedure', 'supplies', 'equipment', 'rent', 'utilities', 'salaries', 'insurance', 'other');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'other', 'prefer-not-to-say');--> statement-breakpoint
CREATE TYPE "public"."immunization_status" AS ENUM('administered', 'scheduled', 'overdue', 'contraindicated');--> statement-breakpoint
CREATE TYPE "public"."priority_level" AS ENUM('low', 'medium', 'high', 'emergency');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('income', 'outflow');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "apikey" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"start" text,
	"prefix" text,
	"key" text NOT NULL,
	"user_id" text NOT NULL,
	"refill_interval" integer,
	"refill_amount" integer,
	"last_refill_at" timestamp,
	"enabled" boolean DEFAULT true,
	"rate_limit_enabled" boolean DEFAULT true,
	"rate_limit_time_window" integer DEFAULT 86400000,
	"rate_limit_max" integer DEFAULT 10,
	"request_count" integer DEFAULT 0,
	"remaining" integer,
	"last_request" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"permissions" text,
	"metadata" text
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "two_factor" (
	"id" text PRIMARY KEY NOT NULL,
	"secret" text NOT NULL,
	"backup_codes" text NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"two_factor_enabled" boolean DEFAULT false,
	"role" text DEFAULT 'member',
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	"username" text,
	"display_username" text,
	"password" text,
	"gender" boolean NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"doctor_id" uuid NOT NULL,
	"appointment_price_in_cents" integer NOT NULL,
	"clinic_id" uuid NOT NULL,
	"date" timestamp NOT NULL,
	"duration" integer DEFAULT 30 NOT NULL,
	"type" "appointment_type" NOT NULL,
	"status" "appointment_status" DEFAULT 'scheduled' NOT NULL,
	"priority" "priority_level" DEFAULT 'medium',
	"reason" text,
	"symptoms" text,
	"notes" text,
	"diagnosis" text,
	"prescription" text,
	"follow_up_date" timestamp,
	"is_recurring" boolean DEFAULT false,
	"recurrence_pattern" text,
	"recurrence_end_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"created_by" text,
	CONSTRAINT "scheduled_at_check" CHECK ("appointments"."date" > CURRENT_TIMESTAMP),
	CONSTRAINT "duration_check" CHECK ("appointments"."duration" > 0)
);
--> statement-breakpoint
ALTER TABLE "appointments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "budgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" "expense_category" NOT NULL,
	"fiscal_year" integer NOT NULL,
	"allocated_amount" numeric(10, 2) NOT NULL,
	"spent_amount" numeric(10, 2) DEFAULT '0',
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"created_by" text,
	CONSTRAINT "budgets_category_year_unique" UNIQUE("category","fiscal_year")
);
--> statement-breakpoint
ALTER TABLE "budgets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "transaction_type" NOT NULL,
	"category" "expense_category" NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"description" text NOT NULL,
	"transaction_date" timestamp NOT NULL,
	"reference_number" text,
	"patient_id" uuid,
	"appointment_id" uuid,
	"is_recurring" boolean DEFAULT false,
	"recurrence_interval" text,
	"payment_method" text,
	"status" text DEFAULT 'completed',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"created_by" text,
	CONSTRAINT "amount_check" CHECK ("expenses"."amount" > 0)
);
--> statement-breakpoint
ALTER TABLE "expenses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "clinical_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"appointment_id" uuid,
	"author_id" text NOT NULL,
	"subjective" text,
	"objective" text,
	"assessment" text,
	"plan" text,
	"vital_signs" jsonb,
	"is_confidential" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "clinical_notes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "immunizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"vaccine_name" text NOT NULL,
	"vaccine_code" text,
	"manufacturer" text,
	"lot_number" text,
	"administration_date" timestamp NOT NULL,
	"next_due_date" timestamp,
	"status" "immunization_status" DEFAULT 'administered' NOT NULL,
	"administered_by" text,
	"administration_site" text,
	"dose_number" integer DEFAULT 1,
	"total_doses" integer DEFAULT 1,
	"reactions" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "due_date_check" CHECK ("immunizations"."next_due_date" IS NULL OR "immunizations"."next_due_date" > "immunizations"."administration_date")
);
--> statement-breakpoint
ALTER TABLE "immunizations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "medical_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"condition" text NOT NULL,
	"diagnosis_date" timestamp NOT NULL,
	"status" text DEFAULT 'active',
	"severity" "priority_level",
	"notes" text,
	"treatment" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"created_by" text
);
--> statement-breakpoint
ALTER TABLE "medical_history" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "medical_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"appointment_id" uuid,
	"doctor_id" uuid NOT NULL,
	"clinic_id" uuid NOT NULL,
	"diagnosis" text NOT NULL,
	"symptoms" text,
	"treatment" text,
	"medications" text,
	"notes" text,
	"attachments" text,
	"follow_up_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient_allergies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"allergen" text NOT NULL,
	"severity" "priority_level" NOT NULL,
	"reaction" text,
	"onset_date" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "patient_allergies" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "todo" (
	"id" serial PRIMARY KEY NOT NULL,
	"text" text NOT NULL,
	"completed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"phone" text,
	"email" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "doctors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"name" text NOT NULL,
	"avatar_image_url" text,
	"available_from_week_day" integer NOT NULL,
	"available_to_week_day" integer NOT NULL,
	"available_from_time" time NOT NULL,
	"available_to_time" time NOT NULL,
	"specialty" text NOT NULL,
	"appointment_price_in_cents" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "patients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"medical_record_number" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"date_of_birth" timestamp NOT NULL,
	"gender" "gender" NOT NULL,
	"blood_type" "blood_type",
	"phone" text,
	"email" text,
	"address" text,
	"emergency_contact_name" text,
	"emergency_contact_phone" text,
	"emergency_contact_relation" text,
	"insurance_provider" text,
	"insurance_policy_number" text,
	"allergies" jsonb DEFAULT '[]'::jsonb,
	"current_medications" jsonb DEFAULT '[]'::jsonb,
	"pre_existing_conditions" jsonb DEFAULT '[]'::jsonb,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"created_by" text,
	"updated_by" text,
	CONSTRAINT "patients_medical_record_number_unique" UNIQUE("medical_record_number"),
	CONSTRAINT "mrn_check" CHECK ("patients"."medical_record_number" ~ '^MRN-[0-9]{6}$'),
	CONSTRAINT "dob_check" CHECK ("patients"."date_of_birth" < CURRENT_TIMESTAMP)
);
--> statement-breakpoint
ALTER TABLE "patients" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "users_to_clinics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"clinic_id" uuid NOT NULL,
	"role" text DEFAULT 'staff',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apikey" ADD CONSTRAINT "apikey_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "two_factor" ADD CONSTRAINT "two_factor_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_notes" ADD CONSTRAINT "clinical_notes_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_notes" ADD CONSTRAINT "clinical_notes_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_notes" ADD CONSTRAINT "clinical_notes_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "immunizations" ADD CONSTRAINT "immunizations_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "immunizations" ADD CONSTRAINT "immunizations_administered_by_user_id_fk" FOREIGN KEY ("administered_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_history" ADD CONSTRAINT "medical_history_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_history" ADD CONSTRAINT "medical_history_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_allergies" ADD CONSTRAINT "patient_allergies_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_to_clinics" ADD CONSTRAINT "users_to_clinics_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_to_clinics" ADD CONSTRAINT "users_to_clinics_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;