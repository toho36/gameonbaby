/*
In your src/app/admin/events/[id]/[eventId]/registrations/page.tsx file,
make the following changes:

1. IMPORT the new function at the top:
   ```
   import { duplicateRegistrationWithDirectUpdate } from "~/api/registrations";
   ```

2. REPLACE your current duplicateRegistration function with:
   ```
   async function duplicateRegistration(registration) {
     await duplicateRegistrationWithDirectUpdate(
       registration,
       params.eventId,
       setProcessing
     );
   }
   ```

This will update the store directly without needing to call refetch(),
which means the duplicated registration will appear in the table immediately
without a full refresh of the component.
*/
