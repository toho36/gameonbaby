// Add RegistrationHistoryEntry interface
export interface RegistrationHistoryEntry {
  id: string;
  event_id: string;
  registration_id?: string;
  waiting_list_id?: string;
  first_name: string;
  last_name: string | null;
  email: string;
  phone_number: string | null;
  action_type:
    | "REGISTERED"
    | "UNREGISTERED"
    | "MOVED_TO_WAITLIST"
    | "MOVED_FROM_WAITLIST";
  timestamp: Date;
}

// Add RegistrationAction enum
export type RegistrationAction =
  | "REGISTERED"
  | "UNREGISTERED"
  | "MOVED_TO_WAITLIST"
  | "MOVED_FROM_WAITLIST";
