/*
  Warnings:

  - Added the required column `title` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "description" TEXT,
ADD COLUMN     "title" TEXT NOT NULL DEFAULT 'Game On Event',
ADD COLUMN     "visible" BOOLEAN NOT NULL DEFAULT true;

-- Update existing records
UPDATE "Event" SET "title" = 'Game On Event #' || id WHERE "title" = 'Game On Event';

-- Remove the default constraint
ALTER TABLE "Event" ALTER COLUMN "title" DROP DEFAULT;
