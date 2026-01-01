import prisma from "~/lib/db";
import {
  getRegistrationHistoryTableExists,
  setRegistrationHistoryTableExists,
  getCachedRegistrationHistory,
  setCachedRegistrationHistory,
} from "~/lib/cache";

/**
 * Enum for different types of registration actions
 */
export enum RegistrationAction {
  REGISTERED = "REGISTERED",
  UNREGISTERED = "UNREGISTERED",
  MOVED_TO_WAITLIST = "MOVED_TO_WAITLIST",
  MOVED_FROM_WAITLIST = "MOVED_FROM_WAITLIST",
  DELETED_BY_MODERATOR = "DELETED_BY_MODERATOR",
  EVENT_CREATED = "EVENT_CREATED",
  EVENT_DELETED = "EVENT_DELETED",
  EVENT_UPDATED = "EVENT_UPDATED",
  REACTIVATED = "REACTIVATED",
  ADDED_TO_WAITLIST = "ADDED_TO_WAITLIST",
}

// Type definition for registration history entry
export type RegistrationHistoryEntry = {
  id: string;
  event_id: string;
  registration_id?: string | null;
  waiting_list_id?: string | null;
  first_name: string;
  last_name?: string | null;
  email: string;
  phone_number?: string | null;
  action_type: string;
  timestamp: Date;
  user_id?: string | null;
  event_title?: string | null;
};

// Backup in-memory storage in case DB operations fail
const registrationHistoryStorage: RegistrationHistoryEntry[] = [];

/**
 * Records an entry in registration history
 * Tries to write to database if table exists, otherwise stores in memory
 */
export async function recordRegistrationHistory({
  eventId,
  registrationId = null,
  waitingListId = null,
  firstName,
  lastName = null,
  email,
  phoneNumber = null,
  actionType,
  userId = null,
  eventTitle = null,
}: {
  eventId: string;
  registrationId?: string | null;
  waitingListId?: string | null;
  firstName: string;
  lastName?: string | null;
  email: string;
  phoneNumber?: string | null;
  actionType: RegistrationAction;
  userId?: string | null;
  eventTitle?: string | null;
}) {
  try {
    // Generate a unique ID
    const id =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    // Create history entry to insert
    const historyEntry: RegistrationHistoryEntry = {
      id,
      event_id: eventId,
      registration_id: registrationId,
      waiting_list_id: waitingListId,
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone_number: phoneNumber,
      action_type: actionType,
      timestamp: new Date(),
      user_id: userId,
      event_title: eventTitle,
    };

    try {
      // OPTIMIZATION: Use cache instead of querying information_schema every time
      let tableExists = getRegistrationHistoryTableExists();

      if (tableExists === null) {
        // First time: check table existence and cache result
        const result = await prisma.$queryRaw`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public'
            AND table_name = 'RegistrationHistory'
          );
        `;
        tableExists = (result as any)[0]?.exists;
        setRegistrationHistoryTableExists(tableExists);
      }

      // If table exists, insert directly using raw SQL
      if (tableExists) {
        await prisma.$executeRaw`
          INSERT INTO "RegistrationHistory" (
            id, event_id, registration_id, waiting_list_id, 
            first_name, last_name, email, phone_number, 
            action_type, timestamp, user_id, event_title
          ) VALUES (
            ${id}, ${eventId}, ${registrationId}, ${waitingListId},
            ${firstName}, ${lastName || null}, ${email}, ${phoneNumber || null},
            ${actionType}, ${new Date()}, ${userId || null}, ${eventTitle || null}
          );
        `;
      } else {
        // Store in memory if table doesn't exist
        registrationHistoryStorage.push(historyEntry);
      }
    } catch (dbError) {
      // If database operation fails, store in memory as backup
      registrationHistoryStorage.push(historyEntry);
    }
  } catch (error) {
    // Silent error handling to prevent blocking main functionality
  }
}

/**
 * Get all registration history entries
 * Tries to fetch from database if table exists, otherwise returns from memory
 */
export async function getRegistrationHistory(): Promise<
  RegistrationHistoryEntry[]
> {
  try {
    // OPTIMIZATION: Use cache instead of querying information_schema every time
    let tableExists = getRegistrationHistoryTableExists();

    if (tableExists === null) {
      // First time: check table existence and cache result
      const result = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = 'RegistrationHistory'
        );
      `;
      tableExists = (result as any)[0]?.exists;
      setRegistrationHistoryTableExists(tableExists);
    }

    // If table exists, get data from database or cache
    if (tableExists) {
      // OPTIMIZATION: Check cache first
      const cachedHistory = getCachedRegistrationHistory<RegistrationHistoryEntry[]>();
      
      if (cachedHistory) {
        return cachedHistory;
      }

      const history = await prisma.$queryRaw<RegistrationHistoryEntry[]>`
        SELECT * FROM "RegistrationHistory"
        ORDER BY timestamp DESC
        LIMIT 200;
      `;
      
      // Cache for 5 minutes
      setCachedRegistrationHistory(history);
      return history;
    } else {
      return [...registrationHistoryStorage]
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 200);
    }
  } catch (dbError) {
    console.error("Database error, falling back to memory storage:", dbError);
    return [...registrationHistoryStorage]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 200);
  }
}

/**
 * Get registration history for a specific event
 * Tries to fetch from database if table exists, otherwise returns from memory
 */
export async function getEventRegistrationHistory(
  eventId: string,
): Promise<RegistrationHistoryEntry[]> {
  try {
    // OPTIMIZATION: Use cache instead of querying information_schema every time
    let tableExists = getRegistrationHistoryTableExists();

    if (tableExists === null) {
      // First time: check table existence and cache result
      const result = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = 'RegistrationHistory'
        );
      `;
      tableExists = (result as any)[0]?.exists;
      setRegistrationHistoryTableExists(tableExists);
    }

    // If table exists, get data from database or cache
    if (tableExists) {
      // OPTIMIZATION: Check cache first
      const cachedHistory = getCachedRegistrationHistory<RegistrationHistoryEntry[]>(eventId);
      
      if (cachedHistory) {
        return cachedHistory;
      }

      // Add LIMIT to prevent excessive data fetching
      const history = await prisma.$queryRaw<RegistrationHistoryEntry[]>`
        SELECT * FROM "RegistrationHistory"
        WHERE event_id = ${eventId}
        ORDER BY timestamp DESC
        LIMIT 200;
      `;
      
      // Cache for 5 minutes
      setCachedRegistrationHistory(history, eventId);
      return history;
    } else {
      return [...registrationHistoryStorage]
        .filter((entry) => entry.event_id === eventId)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 200); // Limit results for consistent behavior
    }
  } catch (dbError) {
    console.error(`Database error, falling back to memory storage:`, dbError);
    return [...registrationHistoryStorage]
      .filter((entry) => entry.event_id === eventId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 200); // Limit results for consistent behavior
  }
}
