"use client";

import { useState, useEffect, useCallback } from "react";
import { useEventRegistrationStore } from "~/stores/eventRegistrationStore";

interface Participant {
  first_name: string;
  last_name: string | null;
  created_at: Date;
}

interface ParticipantsApiResponse {
  success: boolean;
  registrations: Participant[];
  waitingList: Participant[];
  registrationCount: number;
  waitingListCount: number;
}

interface EventParticipantListsProps {
  initialRegistrations: Participant[];
  initialWaitingList: Participant[];
  initialRegCount: number;
  initialWaitingListCount: number;
  capacity: number;
  eventId: string;
  refreshTrigger?: number;
}

export default function EventParticipantLists({
  initialRegistrations,
  initialWaitingList,
  initialRegCount,
  initialWaitingListCount,
  capacity,
  eventId,
  refreshTrigger = 0,
}: EventParticipantListsProps) {
  const [registrations, setRegistrations] =
    useState<Participant[]>(initialRegistrations);
  const [waitingList, setWaitingList] =
    useState<Participant[]>(initialWaitingList);
  const [registrationCount, setRegistrationCount] =
    useState<number>(initialRegCount);
  const [waitingListCount, setWaitingListCount] = useState<number>(
    initialWaitingListCount,
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { initialize } = useEventRegistrationStore();

  useEffect(() => {
    initialize(initialRegCount, capacity);
  }, [initialize, initialRegCount, capacity]);

  const fetchParticipants = useCallback(async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/participants`);
      if (response.ok) {
        const data = (await response.json()) as ParticipantsApiResponse;
        if (data.success) {
          setRegistrations(data.registrations);
          setWaitingList(data.waitingList);
          setRegistrationCount(data.registrationCount);
          setWaitingListCount(data.waitingListCount);
        }
      }
    } catch (error: unknown) {
      console.error("Failed to refresh participants:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (refreshTrigger > 0) {
      setIsRefreshing(true);
      void fetchParticipants();
    }
  }, [refreshTrigger, fetchParticipants]);

  return (
    <>
      <h2 className="mb-5 mt-8 text-xl font-bold text-white">
        Registered ({registrationCount}/{capacity})
        {isRefreshing && (
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
                {/* Date removed per UI-only change request */}
              </div>
            ))}
          </div>
        ) : registrationCount > 0 ? (
          <div className="grid gap-3">
            {Array.from({ length: Math.min(registrationCount, 10) }).map(
              (_, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg bg-white/10 p-3"
                >
                  <div className="flex items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-white">
                      <span>P</span>
                    </div>
                    <span className="ml-3 text-white">
                      Participant {index + 1}
                    </span>
                  </div>
                </div>
              ),
            )}
            {registrationCount > 10 && (
              <div className="py-2 text-center text-white/70">
                ... and {registrationCount - 10} more participants
              </div>
            )}
          </div>
        ) : (
          <div className="py-4 text-center text-white/70">
            No one registered yet
          </div>
        )}
      </div>

      <h2 className="mb-5 mt-8 text-xl font-bold text-white">
        Waiting List ({waitingListCount})
        {isRefreshing && (
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
                {/* Date removed per UI-only change request */}
              </div>
            ))}
          </div>
        ) : waitingListCount > 0 ? (
          <div className="grid gap-3">
            {Array.from({ length: Math.min(waitingListCount, 10) }).map(
              (_, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg bg-white/10 p-3"
                >
                  <div className="flex items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white">
                      <span>W</span>
                    </div>
                    <span className="ml-3 text-white">Waiting {index + 1}</span>
                  </div>
                </div>
              ),
            )}
            {waitingListCount > 10 && (
              <div className="py-2 text-center text-white/70">
                ... and {waitingListCount - 10} more on waiting list
              </div>
            )}
          </div>
        ) : (
          <div className="py-4 text-center text-white/70">
            No one on waiting list yet
          </div>
        )}
      </div>
    </>
  );
}
