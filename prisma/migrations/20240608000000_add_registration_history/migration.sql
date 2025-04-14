-- Add deleted field to Registration table
ALTER TABLE "Registration" ADD COLUMN "deleted" BOOLEAN NOT NULL DEFAULT false;

-- Create enum for registration actions
CREATE TYPE "RegistrationAction" AS ENUM ('REGISTERED', 'UNREGISTERED', 'MOVED_TO_WAITLIST', 'MOVED_FROM_WAITLIST');

-- Create RegistrationHistory table
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

    CONSTRAINT "RegistrationHistory_pkey" PRIMARY KEY ("id")
); 