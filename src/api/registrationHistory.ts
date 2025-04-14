import { useQuery } from "@tanstack/react-query";

export type RegistrationAction =
  | "REGISTERED"
  | "UNREGISTERED"
  | "MOVED_TO_WAITLIST"
  | "MOVED_FROM_WAITLIST";

export interface RegistrationHistoryItem {
  id: string;
  eventId: string;
  eventTitle: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  paymentType?: string;
  status: string;
  actionType?: RegistrationAction;
  attended?: boolean;
  createdAt: string;
  type: "REGISTRATION" | "WAITING_LIST" | "HISTORY";
}

export interface PaginationInfo {
  total: number;
  offset: number;
  limit: number;
}

export interface RegistrationHistoryResponse {
  history: RegistrationHistoryItem[];
  registrations?: RegistrationHistoryItem[];
  waitingList?: RegistrationHistoryItem[];
  pagination: PaginationInfo;
}

export const useRegistrationHistory = (
  eventId?: string,
  limit: number = 100,
  offset: number = 0,
) => {
  return useQuery({
    queryKey: ["registrationHistory", eventId, limit, offset],
    queryFn: async (): Promise<RegistrationHistoryResponse> => {
      try {
        // Build URL with query parameters
        let url = "/api/admin/registrations/history?";

        if (eventId) {
          url += `eventId=${encodeURIComponent(eventId)}&`;
        }

        url += `limit=${limit}&offset=${offset}`;

        // Fetch data
        const response = await fetch(url);
        const data = await response.json();

        if (!data.success) {
          throw new Error(
            data.message || "Failed to load registration history",
          );
        }

        return {
          history: data.history,
          registrations: data.registrations,
          waitingList: data.waitingList,
          pagination: data.pagination,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to load registration history";
        throw new Error(errorMessage);
      }
    },
  });
};
