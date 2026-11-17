CREATE TYPE "public"."actor_type" AS ENUM('USER', 'CUSTOMER', 'SYSTEM');--> statement-breakpoint
CREATE TYPE "public"."doc_status" AS ENUM('AUTO_FETCHED', 'UPLOADED', 'FILLED', 'AWAITING_CONSENT', 'MISSING', 'AWAITING_CUSTOMER', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."employment" AS ENUM('EMPLOYEE', 'SELF_EMPLOYED');--> statement-breakpoint
CREATE TYPE "public"."property_type" AS ENUM('HOUSE', 'TERRACED', 'APARTMENT', 'HOLIDAY', 'COOP');--> statement-breakpoint
CREATE TYPE "public"."purpose" AS ENUM('BUY', 'COOP', 'PRE_APPROVAL', 'REFINANCE', 'RENOVATION', 'EQUITY', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('ADVISOR', 'BANK_ADMIN', 'PLATFORM_ADMIN');--> statement-breakpoint
CREATE TYPE "public"."case_stage" AS ENUM('OPEN', 'CREDIT', 'CLOSED');--> statement-breakpoint
CREATE TABLE "applicants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"position" smallint NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"cpr_encrypted" text NOT NULL,
	"cpr_masked" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"address" text NOT NULL,
	"zip" text NOT NULL,
	"city" text NOT NULL,
	"employment" "employment" NOT NULL,
	"company_name" text,
	"cvr" text,
	"relation" text,
	"identified_at" timestamp with time zone,
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_type" "actor_type" NOT NULL,
	"actor_user_id" uuid,
	"actor_applicant_id" uuid,
	"bank_id" uuid,
	"case_id" uuid,
	"action" text NOT NULL,
	"details" jsonb
);
--> statement-breakpoint
CREATE TABLE "banks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"applicant_id" uuid,
	"doc_key" text NOT NULL,
	"status" "doc_status" NOT NULL,
	"source" text,
	"rejection_reason" text,
	"file_count" integer DEFAULT 0 NOT NULL,
	"received_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_number" text NOT NULL,
	"bank_id" uuid NOT NULL,
	"department_id" uuid NOT NULL,
	"advisor_id" uuid NOT NULL,
	"purpose" "purpose" NOT NULL,
	"stage" "case_stage" DEFAULT 'OPEN' NOT NULL,
	"property_type" "property_type" NOT NULL,
	"price" bigint,
	"down_payment" bigint,
	"loan_amount" bigint,
	"property_address" text,
	"property_zip" text,
	"property_city" text,
	"takeover_date" date,
	"notes" text,
	"advisor_summary" text,
	"broker_firm" text,
	"broker_person" text,
	"broker_phone" text,
	"reminders_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bank_id" uuid NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bank_id" uuid,
	"department_id" uuid,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"title" text,
	"phone" text,
	"role" "role" DEFAULT 'ADVISOR' NOT NULL,
	"password_hash" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"failed_logins" smallint DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "applicants" ADD CONSTRAINT "applicants_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_applicant_id_applicants_id_fk" FOREIGN KEY ("actor_applicant_id") REFERENCES "public"."applicants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_bank_id_banks_id_fk" FOREIGN KEY ("bank_id") REFERENCES "public"."banks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_documents" ADD CONSTRAINT "case_documents_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_documents" ADD CONSTRAINT "case_documents_applicant_id_applicants_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."applicants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_bank_id_banks_id_fk" FOREIGN KEY ("bank_id") REFERENCES "public"."banks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_advisor_id_users_id_fk" FOREIGN KEY ("advisor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_bank_id_banks_id_fk" FOREIGN KEY ("bank_id") REFERENCES "public"."banks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_bank_id_banks_id_fk" FOREIGN KEY ("bank_id") REFERENCES "public"."banks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "applicants_case_pos_uq" ON "applicants" USING btree ("case_id","position");--> statement-breakpoint
CREATE INDEX "audit_case_idx" ON "audit_log" USING btree ("case_id","at");--> statement-breakpoint
CREATE INDEX "audit_actor_idx" ON "audit_log" USING btree ("actor_user_id","at");--> statement-breakpoint
CREATE UNIQUE INDEX "case_documents_uq" ON "case_documents" USING btree ("case_id",coalesce("applicant_id", '00000000-0000-0000-0000-000000000000'::uuid),"doc_key");--> statement-breakpoint
CREATE INDEX "case_documents_case_idx" ON "case_documents" USING btree ("case_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cases_number_uq" ON "cases" USING btree ("case_number");--> statement-breakpoint
CREATE INDEX "cases_advisor_idx" ON "cases" USING btree ("advisor_id");--> statement-breakpoint
CREATE INDEX "cases_dept_idx" ON "cases" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "cases_bank_idx" ON "cases" USING btree ("bank_id");--> statement-breakpoint
CREATE INDEX "departments_bank_idx" ON "departments" USING btree ("bank_id");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_uq" ON "users" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX "users_bank_idx" ON "users" USING btree ("bank_id");