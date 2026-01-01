
    "access_token" TEXT,
    "action_type" "RegistrationAction" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "event_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
    "expires" TIMESTAMP(3) NOT NULL,
    "expires_at" INTEGER,
    "first_name" TEXT NOT NULL,
    "from" TIMESTAMP(3) NOT NULL,
    "id" TEXT NOT NULL,
    "id_token" TEXT,
    "identifier" TEXT NOT NULL,
    "image" TEXT,
    "last_name" TEXT NOT NULL,
    "last_name" TEXT,
    "name" TEXT,
    "paid" BOOLEAN NOT NULL,
    "payment_type" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "phone_number" TEXT,
    "price" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "qr_data" TEXT NOT NULL,
    "refresh_token" TEXT,
    "refresh_token_expires_in" INTEGER,
    "registration_id" TEXT NOT NULL,
    "registration_id" TEXT,
    "scope" TEXT,
    "sessionToken" TEXT NOT NULL,
    "session_state" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "to" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "token_type" TEXT,
    "type" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "variable_symbol" TEXT NOT NULL,
    "waiting_list_id" TEXT,
    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
    CONSTRAINT "RegistrationHistory_pkey" PRIMARY KEY ("id")
    CONSTRAINT "Registration_pkey" PRIMARY KEY ("id")
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
    CONSTRAINT "WaitingList_pkey" PRIMARY KEY ("id")
  - A unique constraint covering the columns `[event_id,email,first_name,last_name]` on the table `Registration` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[kindeId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `title` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.
  Warnings:
);
); -- CreateTable
*/
-- Add deleted field to Registration table
-- Add indexes for compute optimization
-- AddForeignKey
-- AlterTable
-- Create RegistrationHistory table
-- Create enum for registration actions
-- CreateEnum
-- CreateIndex
-- CreateTable
-- DropIndex
-- Index for Registration email lookups
-- Index for Registration table to speed up duplicate checks
-- Index for RegistrationHistory email lookups
-- Index for RegistrationHistory queries
-- Index for WaitingList email lookups
-- Index for WaitingList table
-- Remove the default constraint
-- These indexes optimize the most frequent queries
-- Update existing records
/*
ADD COLUMN     "kindeId" TEXT,
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER',
ADD COLUMN     "title" TEXT NOT NULL DEFAULT 'Game On Event',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
ADD COLUMN     "visible" BOOLEAN NOT NULL DEFAULT true;
ALTER COLUMN "price" SET DATA TYPE DOUBLE PRECISION;
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Event" ADD COLUMN     "capacity" INTEGER NOT NULL DEFAULT 0,
ALTER TABLE "Event" ADD COLUMN     "description" TEXT,
ALTER TABLE "Event" ADD COLUMN     "place" TEXT;
ALTER TABLE "Event" ALTER COLUMN "title" DROP DEFAULT;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "Registration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Registration" ADD COLUMN     "attended" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Registration" ADD COLUMN "deleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Registration" ALTER COLUMN "last_name" DROP NOT NULL;
ALTER TABLE "Registration" ALTER COLUMN "phone_number" DROP NOT NULL;
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "User" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER TABLE "User" ADD COLUMN     "paymentPreference" TEXT NOT NULL DEFAULT 'CARD';
ALTER TABLE "WaitingList" ADD CONSTRAINT "WaitingList_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "RegistrationHistory_email_idx" ON "RegistrationHistory"("email");
CREATE INDEX IF NOT EXISTS "RegistrationHistory_event_id_timestamp_idx" ON "RegistrationHistory"("event_id", "timestamp");
CREATE INDEX IF NOT EXISTS "Registration_email_idx" ON "Registration"("email");
CREATE INDEX IF NOT EXISTS "Registration_event_id_created_at_idx" ON "Registration"("event_id", "created_at");
CREATE INDEX IF NOT EXISTS "WaitingList_email_idx" ON "WaitingList"("email");
CREATE INDEX IF NOT EXISTS "WaitingList_event_id_created_at_idx" ON "WaitingList"("event_id", "created_at");
CREATE TABLE "Account" (
CREATE TABLE "Event" (
CREATE TABLE "Payment" (
CREATE TABLE "Registration" (
CREATE TABLE "RegistrationHistory" (
CREATE TABLE "Session" (
CREATE TABLE "User" (
CREATE TABLE "VerificationToken" (
CREATE TABLE "WaitingList" (
CREATE TYPE "RegistrationAction" AS ENUM ('REGISTERED', 'UNREGISTERED', 'MOVED_TO_WAITLIST', 'MOVED_FROM_WAITLIST');
CREATE TYPE "UserRole" AS ENUM ('USER', 'MODERATOR', 'ADMIN');
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
CREATE UNIQUE INDEX "Payment_registration_id_key" ON "Payment"("registration_id");
CREATE UNIQUE INDEX "Registration_event_id_email_first_name_last_name_key" ON "Registration"("event_id", "email", "first_name", "last_name");
CREATE UNIQUE INDEX "Registration_event_id_email_first_name_last_name_key" ON "Registration"("event_id", "email", "first_name", COALESCE("last_name", '')); 
CREATE UNIQUE INDEX "Registration_event_id_email_key" ON "Registration"("event_id", "email");
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_kindeId_key" ON "User"("kindeId");
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE UNIQUE INDEX "WaitingList_event_id_email_first_name_last_name_key" ON "WaitingList"("event_id", "email", "first_name", "last_name");
DROP INDEX "Registration_event_id_email_key";
UPDATE "Event" SET "title" = 'Game On Event #' || id WHERE "title" = 'Game On Event';
