"use client";

import { useState, useEffect } from "react";
import { useEventRegistrationStore } from "~/stores/eventRegistrationStore";

interface Participant {
  first_name: string;
  last_name: string | null;
  created_at: Date;
}

interface EventParticipantListsProps {
  initialRegistrations: Participant[];
  initialWaitingList: Participant[];
  initialRegCount: number;
  capacity: number;
}

export default function EventParticipantLists({
  initialRegistrations,
  initialWaitingList,
  initialRegCount,
  capacity,
}: EventParticipantListsProps) {
  const [registrations] = useState<Participant[]>(initialRegistrations);
  const [waitingList] = useState<Participant[]>(initialWaitingList);
  const [registrationCount] = useState<number>(initialRegCount);
  const [waitingListCount] = useState<number>(initialWaitingList.length);

  const { initialize } = useEventRegistrationStore();

  useEffect(() => {
    initialize(initialRegCount, capacity);
  }, [initialize, initialRegCount, capacity]);

  return (
    <>
      <h2 className="mb-5 mt-8 text-xl font-bold text-white">
        Registered ({registrationCount}/{capacity})
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
