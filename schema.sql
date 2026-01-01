-- ============================================
-- Supabase Schema for GameOnBaby
-- Generated from Prisma Schema
-- ============================================

-- Clean up existing schema (to avoid "already exists" errors)
DROP TABLE IF EXISTS "Account" CASCADE;
DROP TABLE IF EXISTS "Session" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TABLE IF EXISTS "VerificationToken" CASCADE;
DROP TABLE IF EXISTS "Event" CASCADE;
DROP TABLE IF EXISTS "Registration" CASCADE;
DROP TABLE IF EXISTS "WaitingList" CASCADE;
DROP TABLE IF EXISTS "Payment" CASCADE;
DROP TABLE IF EXISTS "RegistrationHistory" CASCADE;
DROP TABLE IF EXISTS "NoShow" CASCADE;
DROP TABLE IF EXISTS "playing_with_neon" CASCADE;

DROP TYPE IF EXISTS "UserRole" CASCADE;
DROP TYPE IF EXISTS "RegistrationAction" CASCADE;

-- ============================================
-- Create ENUM types first (they must exist before tables)
-- ============================================
CREATE TYPE "UserRole" AS ENUM ('USER', 'REGULAR', 'MODERATOR', 'ADMIN');
CREATE TYPE "RegistrationAction" AS ENUM ('REGISTERED', 'UNREGISTERED', 'MOVED_TO_WAITLIST', 'MOVED_FROM_WAITLIST', 'ADDED_TO_WAITLIST', 'DELETED_BY_MODERATOR', 'EVENT_CREATED', 'EVENT_DELETED', 'EVENT_UPDATED', 'REACTIVATED');

-- ============================================
-- Tables
-- ============================================

-- Account table (NextAuth.js)
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "refresh_token_expires_in" INTEGER,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- Session table (NextAuth.js)
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- User table
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "kindeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentPreference" TEXT NOT NULL DEFAULT 'CARD',
    "phoneNumber" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- VerificationToken table (NextAuth.js)
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- Event table
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "place" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 0,
    "from" TIMESTAMP(3) NOT NULL,
    "to" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "bankAccountId" TEXT,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- Registration table
CREATE TABLE "Registration" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT,
    "email" TEXT NOT NULL,
    "phone_number" TEXT,
    "payment_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "attended" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Registration_pkey" PRIMARY KEY ("id")
);

-- WaitingList table
CREATE TABLE "WaitingList" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT,
    "email" TEXT NOT NULL,
    "phone_number" TEXT,
    "payment_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaitingList_pkey" PRIMARY KEY ("id")
);

-- Payment table
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "registration_id" TEXT NOT NULL UNIQUE,
    "variable_symbol" TEXT NOT NULL,
    "qr_data" TEXT NOT NULL,
    "paid" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- RegistrationHistory table
CREATE TABLE "RegistrationHistory" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "registration_id" TEXT,
    "waiting_list_id" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT,
    "email" TEXT NOT NULL,
    "phone_number" TEXT,
    "action_type" "RegistrationAction" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT,
    "event_title" TEXT,

    CONSTRAINT "RegistrationHistory_pkey" PRIMARY KEY ("id")
);

-- NoShow table
CREATE TABLE "NoShow" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventTitle" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "feePaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "NoShow_pkey" PRIMARY KEY ("id")
);

-- Test table (can be removed in production)
CREATE TABLE "playing_with_neon" (
    "id" INTEGER NOT NULL GENERATED BY DEFAULT AS IDENTITY (START WITH 1 INCREMENT BY 1),
    "name" TEXT NOT NULL,
    "value" REAL,

    CONSTRAINT "playing_with_neon_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- Unique Indexes
-- ============================================

-- Account indexes
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- Session indexes
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- User indexes
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "User_kindeId_key" ON "User"("kindeId");

-- VerificationToken indexes
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- Registration unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "Registration_event_id_email_first_name_last_name_key" ON "Registration"("event_id", "email", "first_name", "last_name");
CREATE UNIQUE INDEX IF NOT EXISTS "WaitingList_event_id_email_first_name_last_name_key" ON "WaitingList"("event_id", "email", "first_name", "last_name");

-- Payment unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_registration_id_key" ON "Payment"("registration_id");

-- ============================================
-- Performance Indexes
-- ============================================

-- Registration indexes for common queries
CREATE INDEX IF NOT EXISTS "Registration_event_id_created_at_idx" ON "Registration"("event_id", "created_at");
CREATE INDEX IF NOT EXISTS "Registration_email_idx" ON "Registration"("email");

-- WaitingList indexes for common queries
CREATE INDEX IF NOT EXISTS "WaitingList_event_id_created_at_idx" ON "WaitingList"("event_id", "created_at");
CREATE INDEX IF NOT EXISTS "WaitingList_email_idx" ON "WaitingList"("email");

-- RegistrationHistory indexes
CREATE INDEX IF NOT EXISTS "RegistrationHistory_event_id_timestamp_idx" ON "RegistrationHistory"("event_id", "timestamp");
CREATE INDEX IF NOT EXISTS "RegistrationHistory_email_idx" ON "RegistrationHistory"("email");

-- NoShow indexes
CREATE INDEX IF NOT EXISTS "NoShow_email_idx" ON "NoShow"("email");
CREATE INDEX IF NOT EXISTS "NoShow_feePaid_idx" ON "NoShow"("feePaid");

-- ============================================
-- Foreign Keys
-- ============================================

-- Account -> User
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Session -> User
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Registration -> Event
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- WaitingList -> Event
ALTER TABLE "WaitingList" ADD CONSTRAINT "WaitingList_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Payment -> Registration
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "Registration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- Enable Row Level Security (Optional)
-- ============================================

-- Uncomment if you want to enable RLS for additional security
-- ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Event" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Registration" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "WaitingList" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Triggers for updated_at timestamp
-- ============================================

-- Create function to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for User table
DROP TRIGGER IF EXISTS update_user_updated_at ON "User";
CREATE TRIGGER update_user_updated_at
    BEFORE UPDATE ON "User"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Notes
-- ============================================

-- This schema is based on Prisma schema file
-- All constraints, indexes, and relationships are preserved
-- The schema is ready for Supabase PostgreSQL database
-- Data can be imported after schema is created

-- ============================================
-- End of Schema
-- ============================================
