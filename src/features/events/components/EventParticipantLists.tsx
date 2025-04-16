"use client";

import { useState, useEffect } from "react";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { toast } from "react-hot-toast";
import { useEventRegistrationStore } from "~/stores/eventRegistrationStore";

interface Participant {
  first_name: string;
  last_name: string | null;
  created_at: Date;
  user_id?: string;
  email?: string;
  payment_type?: string;
}

interface EventParticipantListsProps {
  eventId: string;
  initialRegistrations: Participant[];
  initialWaitingList: Participant[];
  initialRegCount: number;
  capacity: number;
}

// Component to display payment type with icon
const PaymentTypeIndicator = ({ type }: { type?: string }) => {
  if (!type) return null;

  const isQR = type === "QR" || type === "CARD"; // Support both new and old values

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${isQR ? "bg-blue-100 text-blue-800" : "bg-yellow-100 text-yellow-800"}`}
    >
      {isQR ? (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mr-1 h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
            />
          </svg>
          QR
        </>
      ) : (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mr-1 h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z"
            />
          </svg>
          Cash
        </>
      )}
    </span>
  );
};

export default function EventParticipantLists({
  eventId,
  initialRegistrations,
  initialWaitingList,
  initialRegCount,
  capacity,
}: EventParticipantListsProps) {
  const { user, isAuthenticated } = useKindeBrowserClient();
  const [registrations, setRegistrations] =
    useState<Participant[]>(initialRegistrations);
  const [waitingList, setWaitingList] =
    useState<Participant[]>(initialWaitingList);
  const [waitingListCount, setWaitingListCount] = useState<number>(
    initialWaitingList.length,
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Get registration count from the global store
  const { registrationCount, setRegistrationCount, initialize } =
    useEventRegistrationStore();

  // Initialize the store with the initial registration count and capacity
  useEffect(() => {
    initialize(initialRegCount, capacity);
  }, [initialize, initialRegCount, capacity]);

  // Function to fetch updated data
  const fetchParticipantData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/events/${eventId}/participants`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRegistrations(data.registrations);
          setWaitingList(data.waitingList);
          setRegistrationCount(data.registrationCount);
          setWaitingListCount(data.waitingListCount);
        }
      }
    } catch (error) {
      console.error("Error fetching participant data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Set up polling for updates
  useEffect(() => {
    if (isAuthenticated) {
      // Initial fetch
      fetchParticipantData();

      // Set up polling interval (every 10 seconds)
      const intervalId = setInterval(fetchParticipantData, 10000);

      // Clean up interval on component unmount
      return () => clearInterval(intervalId);
    }
  }, [eventId, isAuthenticated]);

  // If user is not authenticated, don't render anything
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Display registrations */}
      <h2 className="mb-5 mt-8 text-xl font-bold text-white">
        Registered ({registrationCount}/{capacity})
        {isLoading && (
          <span className="ml-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
        )}
      </h2>
      <div className="rounded-xl border border-white/20 bg-white/5 p-5 backdrop-blur-sm">
        {registrations.length > 0 ? (
          <div className="grid gap-3">
            {registrations.map((reg, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg bg-white/10 p-3"
              >
                <div className="flex items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-white">
                    {reg.first_name.charAt(0)}
                    {reg.last_name ? reg.last_name.charAt(0) : ""}
                  </div>
                  <span className="ml-3 text-white">
                    {reg.first_name} {reg.last_name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-white/70">
                    {new Date(reg.created_at).toLocaleDateString("cs-CZ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center text-white/70">
            No one registered yet
          </div>
        )}
      </div>

      {/* Display waiting list */}
      <h2 className="mb-5 mt-8 text-xl font-bold text-white">
        Waiting List ({waitingListCount})
        {isLoading && (
          <span className="ml-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
        )}
      </h2>
      <div className="rounded-xl border border-white/20 bg-white/5 p-5 backdrop-blur-sm">
        {waitingList.length > 0 ? (
          <div className="grid gap-3">
            {waitingList.map((entry, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg bg-white/10 p-3"
              >
                <div className="flex items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white">
                    {entry.first_name.charAt(0)}
                    {entry.last_name ? entry.last_name.charAt(0) : ""}
                  </div>
                  <span className="ml-3 text-white">
                    {entry.first_name} {entry.last_name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-white/70">
                    {new Date(entry.created_at).toLocaleDateString("cs-CZ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center text-white/70">
            No one on the waiting list yet
          </div>
        )}
      </div>
    </>
  );
}
