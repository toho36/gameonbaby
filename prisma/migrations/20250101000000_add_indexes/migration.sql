-- Add indexes for compute optimization
-- These indexes optimize the most frequent queries

-- Index for Registration table to speed up duplicate checks
CREATE INDEX IF NOT EXISTS "Registration_event_id_created_at_idx" ON "Registration"("event_id", "created_at");

-- Index for Registration email lookups
CREATE INDEX IF NOT EXISTS "Registration_email_idx" ON "Registration"("email");

-- Index for WaitingList table
CREATE INDEX IF NOT EXISTS "WaitingList_event_id_created_at_idx" ON "WaitingList"("event_id", "created_at");

-- Index for WaitingList email lookups
CREATE INDEX IF NOT EXISTS "WaitingList_email_idx" ON "WaitingList"("email");

-- Index for RegistrationHistory queries
CREATE INDEX IF NOT EXISTS "RegistrationHistory_event_id_timestamp_idx" ON "RegistrationHistory"("event_id", "timestamp");

-- Index for RegistrationHistory email lookups
CREATE INDEX IF NOT EXISTS "RegistrationHistory_email_idx" ON "RegistrationHistory"("email");

