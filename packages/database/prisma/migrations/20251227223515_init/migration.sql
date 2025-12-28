-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'MANAGER', 'DEPUTY', 'ROOM_LEADER', 'PRACTITIONER', 'ADMIN', 'PARENT');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "DietaryType" AS ENUM ('VEGETARIAN', 'VEGAN', 'HALAL', 'KOSHER', 'GLUTEN_FREE', 'DAIRY_FREE', 'NUT_FREE', 'EGG_FREE', 'PESCATARIAN', 'OTHER');

-- CreateEnum
CREATE TYPE "FundingType" AS ENUM ('NONE', 'UNIVERSAL_15', 'EXTENDED_30', 'TWO_YEAR_OLD');

-- CreateEnum
CREATE TYPE "ChildStatus" AS ENUM ('ENQUIRY', 'WAITLIST', 'ACTIVE', 'LEAVER', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DailyLogType" AS ENUM ('NAPPY', 'TOILETING', 'SLEEP', 'MEAL', 'SNACK', 'DRINK', 'ACTIVITY', 'MOOD', 'NOTE', 'PHOTO', 'VIDEO', 'MILESTONE');

-- CreateEnum
CREATE TYPE "LogStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('EXPECTED', 'CHECKED_IN', 'CHECKED_OUT', 'ABSENT_NOTIFIED', 'ABSENT_UNNOTIFIED');

-- CreateEnum
CREATE TYPE "EYFSArea" AS ENUM ('COMMUNICATION_AND_LANGUAGE', 'PHYSICAL_DEVELOPMENT', 'PERSONAL_SOCIAL_EMOTIONAL', 'LITERACY', 'MATHEMATICS', 'UNDERSTANDING_THE_WORLD', 'EXPRESSIVE_ARTS');

-- CreateEnum
CREATE TYPE "CharacteristicOfLearning" AS ENUM ('PLAYING_AND_EXPLORING', 'ACTIVE_LEARNING', 'CREATING_AND_THINKING_CRITICALLY');

-- CreateEnum
CREATE TYPE "ProgressLevel" AS ENUM ('EMERGING', 'EXPECTED', 'EXCEEDING');

-- CreateEnum
CREATE TYPE "InjurySeverity" AS ENUM ('MINOR', 'MODERATE', 'SERIOUS', 'CRITICAL');

-- CreateEnum
CREATE TYPE "SafeguardingType" AS ENUM ('PHYSICAL_ABUSE', 'EMOTIONAL_ABUSE', 'NEGLECT', 'SEXUAL_ABUSE', 'DOMESTIC_VIOLENCE', 'CONCERN_FOR_WELFARE', 'DISCLOSURE', 'OTHER');

-- CreateEnum
CREATE TYPE "SafeguardingStatus" AS ENUM ('OPEN', 'MONITORING', 'REFERRED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ConsentType" AS ENUM ('PHOTOS_INTERNAL', 'PHOTOS_SOCIAL_MEDIA', 'PHOTOS_WEBSITE', 'OUTINGS', 'SUN_CREAM', 'FACE_PAINTING', 'TRANSPORT', 'EMERGENCY_MEDICAL', 'TERMS_AND_CONDITIONS', 'PRIVACY_POLICY');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "InvoiceItemType" AS ENUM ('SESSION_FEE', 'ADDITIONAL_HOURS', 'LATE_PICKUP_FEE', 'CONSUMABLES', 'REGISTRATION_FEE', 'DEPOSIT', 'MEALS', 'DISCOUNT', 'FUNDING_REDUCTION', 'OTHER');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'PERMISSION_CHANGE', 'SIGNATURE_CAPTURE', 'PDF_GENERATED');

-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "subdomain" VARCHAR(100) NOT NULL,
    "logo_url" TEXT,
    "primary_color" VARCHAR(20) NOT NULL DEFAULT '#6366f1',
    "secondary_color" VARCHAR(20) NOT NULL DEFAULT '#8b5cf6',
    "config" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" TEXT,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(50),
    "avatar_url" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'PRACTITIONER',
    "permissions" JSONB NOT NULL DEFAULT '[]',
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "last_login_at" TIMESTAMP(3),
    "mfa_enabled" BOOLEAN NOT NULL DEFAULT false,
    "magic_link_token" TEXT,
    "magic_link_expiry" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "capacity" INTEGER NOT NULL,
    "min_age_months" INTEGER NOT NULL,
    "max_age_months" INTEGER NOT NULL,
    "color" VARCHAR(20) NOT NULL DEFAULT '#6366f1',
    "icon" VARCHAR(50),
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "children" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "room_id" UUID,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "date_of_birth" DATE NOT NULL,
    "gender" "Gender",
    "profile_photo_url" TEXT,
    "about_me" TEXT,
    "upn" VARCHAR(13),
    "ethnicity" VARCHAR(100),
    "languages_spoken" TEXT[],
    "home_language" VARCHAR(100),
    "allergies" JSONB NOT NULL DEFAULT '[]',
    "has_allergy" BOOLEAN NOT NULL DEFAULT false,
    "has_medical_condition" BOOLEAN NOT NULL DEFAULT false,
    "medical_conditions" TEXT,
    "medication_required" BOOLEAN NOT NULL DEFAULT false,
    "dietary_requirements" "DietaryType"[],
    "dietary_notes" TEXT,
    "expected_days" TEXT[],
    "expected_hours_per_week" DECIMAL(5,2),
    "key_person_id" UUID,
    "funding_type" "FundingType",
    "funding_hours" DECIMAL(5,2),
    "stretched_funding" BOOLEAN NOT NULL DEFAULT false,
    "start_date" DATE,
    "end_date" DATE,
    "status" "ChildStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "children_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guardians" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID,
    "title" VARCHAR(20),
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50),
    "mobile" VARCHAR(50),
    "address_line1" VARCHAR(255),
    "address_line2" VARCHAR(255),
    "city" VARCHAR(100),
    "postcode" VARCHAR(20),
    "relationship" VARCHAR(50) NOT NULL DEFAULT 'Parent',
    "is_bill_payer" BOOLEAN NOT NULL DEFAULT false,
    "tfc_reference" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guardians_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "child_guardians" (
    "id" UUID NOT NULL,
    "child_id" UUID NOT NULL,
    "guardian_id" UUID NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "authorized_to_collect" BOOLEAN NOT NULL DEFAULT true,
    "collection_password" VARCHAR(50),
    "photo_verification_url" TEXT,
    "receive_daily_updates" BOOLEAN NOT NULL DEFAULT true,
    "receive_newsletters" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "child_guardians_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_contacts" (
    "id" UUID NOT NULL,
    "child_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "relationship" VARCHAR(50) NOT NULL,
    "phone" VARCHAR(50) NOT NULL,
    "mobile" VARCHAR(50),
    "authorized_to_collect" BOOLEAN NOT NULL DEFAULT false,
    "collection_password" VARCHAR(50),
    "priority" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emergency_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_logs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "child_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "type" "DailyLogType" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data" JSONB NOT NULL,
    "notes" TEXT,
    "media_urls" TEXT[],
    "status" "LogStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "approved_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_records" (
    "id" UUID NOT NULL,
    "child_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "check_in_time" TIMESTAMP(3),
    "check_out_time" TIMESTAMP(3),
    "checked_in_by" UUID,
    "checked_out_by" UUID,
    "collected_by" VARCHAR(200),
    "collector_relationship" VARCHAR(50),
    "booked_session" VARCHAR(50),
    "status" "AttendanceStatus" NOT NULL DEFAULT 'EXPECTED',
    "absence_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "observations" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "child_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "title" VARCHAR(255),
    "narrative" TEXT NOT NULL,
    "media_urls" TEXT[],
    "areas_of_learning" "EYFSArea"[],
    "characteristics" "CharacteristicOfLearning"[],
    "next_steps" TEXT,
    "status" "LogStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "parent_comments" TEXT,
    "parent_viewed_at" TIMESTAMP(3),
    "observed_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "observations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "two_year_checks" (
    "id" UUID NOT NULL,
    "child_id" UUID NOT NULL,
    "assessment_date" DATE NOT NULL,
    "communication_summary" TEXT NOT NULL,
    "physical_summary" TEXT NOT NULL,
    "psed_summary" TEXT NOT NULL,
    "overall_progress" "ProgressLevel" NOT NULL,
    "areas_of_strength" TEXT,
    "areas_for_support" TEXT,
    "assessor_id" UUID NOT NULL,
    "assessor_name" VARCHAR(200) NOT NULL,
    "parent_comments" TEXT,
    "parent_signed_at" TIMESTAMP(3),
    "pdf_url" TEXT,
    "locked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "two_year_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accidents" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "child_id" UUID NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "location" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "body_map_data" JSONB,
    "injury_type" VARCHAR(100),
    "injury_severity" "InjurySeverity",
    "first_aid_given" TEXT,
    "first_aid_by" VARCHAR(200) NOT NULL,
    "witness_name" VARCHAR(200),
    "witness_statement" TEXT,
    "parent_notified_at" TIMESTAMP(3),
    "parent_notified_by" VARCHAR(200),
    "parent_signature" TEXT,
    "parent_signed_at" TIMESTAMP(3),
    "signature_ip_address" VARCHAR(45),
    "reported_by" VARCHAR(200) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "is_riddor_reportable" BOOLEAN NOT NULL DEFAULT false,
    "riddor_ref_number" VARCHAR(50),
    "pdf_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safeguarding_logs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "child_id" UUID NOT NULL,
    "concern_date" TIMESTAMP(3) NOT NULL,
    "concern_type" "SafeguardingType" NOT NULL,
    "description" TEXT NOT NULL,
    "physical_indicators" TEXT,
    "behavioral_indicators" TEXT,
    "reported_to_name" VARCHAR(200),
    "reported_to_role" VARCHAR(100),
    "reported_at" TIMESTAMP(3),
    "external_referral" BOOLEAN NOT NULL DEFAULT false,
    "referral_agency" VARCHAR(200),
    "referral_ref" VARCHAR(100),
    "status" "SafeguardingStatus" NOT NULL DEFAULT 'OPEN',
    "outcome" TEXT,
    "closed_at" TIMESTAMP(3),
    "recorded_by" VARCHAR(200) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "safeguarding_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medication_records" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "child_id" UUID NOT NULL,
    "medication_name" VARCHAR(255) NOT NULL,
    "dosage" VARCHAR(100) NOT NULL,
    "frequency" VARCHAR(100) NOT NULL,
    "consent_given_by" VARCHAR(200) NOT NULL,
    "consent_date" DATE NOT NULL,
    "consent_signature" TEXT,
    "administered_at" TIMESTAMP(3),
    "administered_by" VARCHAR(200),
    "witnessed_by" VARCHAR(200),
    "batch_number" VARCHAR(100),
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medication_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "receiver_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "read_at" TIMESTAMP(3),
    "attachment_urls" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_records" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "consent_type" "ConsentType" NOT NULL,
    "description" TEXT,
    "given_by" VARCHAR(200) NOT NULL,
    "given_at" TIMESTAMP(3) NOT NULL,
    "signature_data" TEXT,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "is_granted" BOOLEAN NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "newsletters" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "published_at" TIMESTAMP(3),
    "scheduled_for" TIMESTAMP(3),
    "total_sent" INTEGER NOT NULL DEFAULT 0,
    "total_opened" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "newsletters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "guardian_id" UUID NOT NULL,
    "invoice_number" VARCHAR(50) NOT NULL,
    "issue_date" DATE NOT NULL,
    "due_date" DATE NOT NULL,
    "subtotal_pence" INTEGER NOT NULL,
    "discount_pence" INTEGER NOT NULL DEFAULT 0,
    "funding_pence" INTEGER NOT NULL DEFAULT 0,
    "tax_pence" INTEGER NOT NULL DEFAULT 0,
    "total_pence" INTEGER NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "paid_at" TIMESTAMP(3),
    "payment_method" VARCHAR(50),
    "payment_ref" VARCHAR(100),
    "tfc_amount" INTEGER,
    "tfc_reference" VARCHAR(50),
    "notes" TEXT,
    "pdf_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "child_id" UUID,
    "description" VARCHAR(500) NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit_price_pence" INTEGER NOT NULL,
    "total_pence" INTEGER NOT NULL,
    "item_type" "InvoiceItemType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "room_id" UUID,
    "employee_number" VARCHAR(50),
    "job_title" VARCHAR(100),
    "start_date" DATE,
    "qualification_level" INTEGER,
    "qualifications" JSONB NOT NULL DEFAULT '[]',
    "dbs_number" VARCHAR(50),
    "dbs_issue_date" DATE,
    "dbs_expiry_date" DATE,
    "first_aid_certified" BOOLEAN NOT NULL DEFAULT false,
    "first_aid_expiry" DATE,
    "paediatric_first_aid" BOOLEAN NOT NULL DEFAULT false,
    "safeguarding_training_date" DATE,
    "is_dsl" BOOLEAN NOT NULL DEFAULT false,
    "contract_type" VARCHAR(50),
    "weekly_hours" DECIMAL(5,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID,
    "action" "AuditAction" NOT NULL,
    "entity_type" VARCHAR(100) NOT NULL,
    "entity_id" VARCHAR(100),
    "previous_data" JSONB,
    "new_data" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_subdomain_key" ON "tenants"("subdomain");

-- CreateIndex
CREATE INDEX "users_tenant_id_idx" ON "users"("tenant_id");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenant_id_email_key" ON "users"("tenant_id", "email");

-- CreateIndex
CREATE INDEX "rooms_tenant_id_idx" ON "rooms"("tenant_id");

-- CreateIndex
CREATE INDEX "children_tenant_id_idx" ON "children"("tenant_id");

-- CreateIndex
CREATE INDEX "children_room_id_idx" ON "children"("room_id");

-- CreateIndex
CREATE INDEX "children_key_person_id_idx" ON "children"("key_person_id");

-- CreateIndex
CREATE UNIQUE INDEX "guardians_user_id_key" ON "guardians"("user_id");

-- CreateIndex
CREATE INDEX "guardians_tenant_id_idx" ON "guardians"("tenant_id");

-- CreateIndex
CREATE INDEX "guardians_user_id_idx" ON "guardians"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "child_guardians_child_id_guardian_id_key" ON "child_guardians"("child_id", "guardian_id");

-- CreateIndex
CREATE INDEX "emergency_contacts_child_id_idx" ON "emergency_contacts"("child_id");

-- CreateIndex
CREATE INDEX "daily_logs_tenant_id_idx" ON "daily_logs"("tenant_id");

-- CreateIndex
CREATE INDEX "daily_logs_child_id_idx" ON "daily_logs"("child_id");

-- CreateIndex
CREATE INDEX "daily_logs_timestamp_idx" ON "daily_logs"("timestamp");

-- CreateIndex
CREATE INDEX "daily_logs_type_idx" ON "daily_logs"("type");

-- CreateIndex
CREATE INDEX "attendance_records_child_id_idx" ON "attendance_records"("child_id");

-- CreateIndex
CREATE INDEX "attendance_records_date_idx" ON "attendance_records"("date");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_child_id_date_key" ON "attendance_records"("child_id", "date");

-- CreateIndex
CREATE INDEX "observations_tenant_id_idx" ON "observations"("tenant_id");

-- CreateIndex
CREATE INDEX "observations_child_id_idx" ON "observations"("child_id");

-- CreateIndex
CREATE INDEX "observations_observed_at_idx" ON "observations"("observed_at");

-- CreateIndex
CREATE UNIQUE INDEX "two_year_checks_child_id_key" ON "two_year_checks"("child_id");

-- CreateIndex
CREATE INDEX "accidents_tenant_id_idx" ON "accidents"("tenant_id");

-- CreateIndex
CREATE INDEX "accidents_child_id_idx" ON "accidents"("child_id");

-- CreateIndex
CREATE INDEX "accidents_occurred_at_idx" ON "accidents"("occurred_at");

-- CreateIndex
CREATE INDEX "safeguarding_logs_tenant_id_idx" ON "safeguarding_logs"("tenant_id");

-- CreateIndex
CREATE INDEX "safeguarding_logs_child_id_idx" ON "safeguarding_logs"("child_id");

-- CreateIndex
CREATE INDEX "medication_records_tenant_id_idx" ON "medication_records"("tenant_id");

-- CreateIndex
CREATE INDEX "medication_records_child_id_idx" ON "medication_records"("child_id");

-- CreateIndex
CREATE INDEX "messages_sender_id_idx" ON "messages"("sender_id");

-- CreateIndex
CREATE INDEX "messages_receiver_id_idx" ON "messages"("receiver_id");

-- CreateIndex
CREATE INDEX "messages_created_at_idx" ON "messages"("created_at");

-- CreateIndex
CREATE INDEX "consent_records_tenant_id_idx" ON "consent_records"("tenant_id");

-- CreateIndex
CREATE INDEX "consent_records_consent_type_idx" ON "consent_records"("consent_type");

-- CreateIndex
CREATE INDEX "newsletters_tenant_id_idx" ON "newsletters"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "invoices_tenant_id_idx" ON "invoices"("tenant_id");

-- CreateIndex
CREATE INDEX "invoices_guardian_id_idx" ON "invoices"("guardian_id");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "invoice_items_invoice_id_idx" ON "invoice_items"("invoice_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_user_id_key" ON "staff"("user_id");

-- CreateIndex
CREATE INDEX "staff_tenant_id_idx" ON "staff"("tenant_id");

-- CreateIndex
CREATE INDEX "staff_user_id_idx" ON "staff"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_idx" ON "audit_logs"("tenant_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "children" ADD CONSTRAINT "children_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "children" ADD CONSTRAINT "children_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "children" ADD CONSTRAINT "children_key_person_id_fkey" FOREIGN KEY ("key_person_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guardians" ADD CONSTRAINT "guardians_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guardians" ADD CONSTRAINT "guardians_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "child_guardians" ADD CONSTRAINT "child_guardians_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "child_guardians" ADD CONSTRAINT "child_guardians_guardian_id_fkey" FOREIGN KEY ("guardian_id") REFERENCES "guardians"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_contacts" ADD CONSTRAINT "emergency_contacts_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_logs" ADD CONSTRAINT "daily_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_logs" ADD CONSTRAINT "daily_logs_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_logs" ADD CONSTRAINT "daily_logs_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observations" ADD CONSTRAINT "observations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observations" ADD CONSTRAINT "observations_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observations" ADD CONSTRAINT "observations_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "two_year_checks" ADD CONSTRAINT "two_year_checks_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accidents" ADD CONSTRAINT "accidents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accidents" ADD CONSTRAINT "accidents_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safeguarding_logs" ADD CONSTRAINT "safeguarding_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safeguarding_logs" ADD CONSTRAINT "safeguarding_logs_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medication_records" ADD CONSTRAINT "medication_records_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medication_records" ADD CONSTRAINT "medication_records_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "newsletters" ADD CONSTRAINT "newsletters_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_guardian_id_fkey" FOREIGN KEY ("guardian_id") REFERENCES "guardians"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
