-- DropIndex
DROP INDEX "Registration_event_id_email_key";

-- CreateIndex
CREATE UNIQUE INDEX "Registration_event_id_email_first_name_last_name_key" ON "Registration"("event_id", "email", "first_name", COALESCE("last_name", '')); 