-- Add autoPromote column to Event table
ALTER TABLE "Event" ADD COLUMN "autoPromote" BOOLEAN NOT NULL DEFAULT false;
