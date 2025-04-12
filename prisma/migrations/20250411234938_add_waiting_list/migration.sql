/*
  Warnings:

  - A unique constraint covering the columns `[event_id,email,first_name,last_name]` on the table `Registration` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
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

-- CreateIndex
CREATE UNIQUE INDEX "WaitingList_event_id_email_first_name_last_name_key" ON "WaitingList"("event_id", "email", "first_name", "last_name");

-- CreateIndex
CREATE UNIQUE INDEX "Registration_event_id_email_first_name_last_name_key" ON "Registration"("event_id", "email", "first_name", "last_name");

-- AddForeignKey
ALTER TABLE "WaitingList" ADD CONSTRAINT "WaitingList_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
