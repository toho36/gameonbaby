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
}

interface EventParticipantListsProps {
  eventId: string;
  initialRegistrations: Participant[];
  initialWaitingList: Participant[];
  initialRegCount: number;
  capacity: number;
}

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
                <span className="text-sm text-white/70">
                  {new Date(reg.created_at).toLocaleDateString("cs-CZ")}
                </span>
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
                <span className="text-sm text-white/70">
                  {new Date(entry.created_at).toLocaleDateString("cs-CZ")}
                </span>
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
