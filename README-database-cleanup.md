# Database Cleanup Tools

This README provides instructions for cleaning up the database and resolving issues with deleting participants.

## Issue Fixed

The original issue was that participants could not be deleted due to a foreign key constraint between the `Payment` and `Registration` tables. The constraint was preventing the deletion of registrations that had associated payment records.

## Solutions Implemented

1. **Updated the `deleteRegistration` function in `src/actions/actions.tsx`**

   - The function now properly deletes associated payment records before deleting the registration
   - This ensures that the cascade delete works properly

2. **Updated the Database Schema**

   - Added `onDelete: Cascade` to the Payment-Registration relationship in `prisma/schema.prisma`
   - This ensures that when a Registration is deleted, its associated Payment is automatically deleted

3. **Created Cleanup Tools**

   ### Database Cleanup Script

   This script checks for and fixes database inconsistencies:

   ```bash
   node scripts/fix-registration-data.js
   ```

   ### Participant Deletion Tool

   This command-line tool allows direct deletion of participants:

   ```bash
   # List all participants
   node scripts/delete-participant.js --list

   # Delete a participant by ID
   node scripts/delete-participant.js --id <registration_id>

   # Delete a participant by email (requires event ID)
   node scripts/delete-participant.js --email <email> --event <event_id>

   # Show help
   node scripts/delete-participant.js --help
   ```

## Best Practices

1. Always ensure payment records are deleted before deleting registrations if not using cascade delete
2. Use the provided tools for database cleanup rather than manual database operations
3. After making schema changes, run migrations to keep the database in sync

## Common Issues

If you encounter problems with deleting participants, try the following:

1. Use the `--list` option to find the exact ID of the participant
2. Try deleting with the provided script first
3. Check for any database constraint errors in the console
4. If errors persist, run the database cleanup script
5. Make sure the schema is properly synchronized with `npx prisma db push`
