"use client";

import { useState } from "react";
import type { Event } from "~/features/events/types";
import { EventParticipantLists } from "~/features/events";
import { RegistrationForm } from "~/features/registration";

interface Participant {
  first_name: string;
  last_name: string | null;
  created_at: Date;
}

interface EventPageContentProps {
  event: {
    id: string;
    title: string;
    description: string | null;
    price: number;
    place: string | null;
    from: Date;
    to: Date;
    visible: boolean;
    capacity: number;
    bankAccountId?: string | null;
    registrations: Participant[];
    waitingList: Participant[];
    _count: {
      Registration: number;
      WaitingList: number;
    };
  };
  formattedEventDate: string;
}

export default function EventPageContent({
  event,
  formattedEventDate,
}: EventPageContentProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRegistrationSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const isEventInPast = new Date(event.to) < new Date();

  return (
    <>
      {isEventInPast ? (
        <div className="rounded-xl border border-white/20 bg-white/5 p-5 text-center backdrop-blur-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mx-auto mb-2 h-10 w-10 text-white/70"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mb-1 text-xl font-bold text-white">Event Completed</h3>
          <p className="text-white/80">
            Registration for this event is now closed.
          </p>
        </div>
      ) : (
        <>
          <h2 className="mb-5 text-xl font-bold text-white">Register</h2>
          <RegistrationForm
            event={
              {
                id: event.id,
                title: event.title,
                description: event.description,
                price: event.price,
                place: event.place,
                capacity: event.capacity,
                from: event.from.toISOString(),
                to: event.to.toISOString(),
                visible: event.visible,
                bankAccountId: event.bankAccountId,
                _count: {
                  Registration: event._count.Registration,
                },
              } as unknown as Event
            }
            eventId={event.id}
            eventDate={formattedEventDate}
            onSuccess={handleRegistrationSuccess}
          />
        </>
      )}

      <EventParticipantLists
        eventId={event.id}
        initialRegistrations={event.registrations}
        initialWaitingList={event.waitingList}
        initialRegCount={event._count.Registration}
        initialWaitingListCount={event._count.WaitingList}
        capacity={event.capacity}
        refreshTrigger={refreshTrigger}
      />
    </>
  );
}
