"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "~/components/ui/button";

interface Event {
  id: string;
  title: string;
  description: string | null;
  price: number;
  from: Date;
  to: Date;
  visible?: boolean;
}

interface EventListProps {
  events: Event[];
}

export default function EventList({ events }: EventListProps) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("cs-CZ", {
      dateStyle: "medium",
    }).format(new Date(date));
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("cs-CZ", {
      timeStyle: "short",
    }).format(new Date(date));
  };

  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-white/20 bg-white/5 p-8 text-center">
        <p className="text-lg">No events are currently scheduled.</p>
        <p className="mt-2 text-sm text-gray-300">
          Please check back later for upcoming events.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <div
            key={event.id}
            className={`cursor-pointer rounded-lg border p-5 transition-all ${
              selectedEventId === event.id
                ? "border-purple-400 bg-white/10"
                : "hover:bg-white/8 border-white/10 bg-white/5 hover:border-white/20"
            }`}
            onClick={() => setSelectedEventId(event.id)}
          >
            <h3 className="mb-2 text-xl font-semibold">{event.title}</h3>

            <div className="mb-3 flex justify-between text-sm">
              <span>{formatDate(event.from)}</span>
              <span>
                {formatTime(event.from)} - {formatTime(event.to)}
              </span>
            </div>

            {event.description && (
              <p className="mb-4 text-sm text-gray-300">{event.description}</p>
            )}

            <div className="mt-4 flex items-center justify-between">
              <span className="text-lg font-bold">{event.price} Kč</span>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = `/events/${event.id}`;
                }}
                className="px-3 py-1 text-sm"
              >
                Register
              </Button>
            </div>
          </div>
        ))}
      </div>

      {selectedEventId && (
        <div className="flex justify-center">
          <Link href={`/events/${selectedEventId}`}>
            <Button className="px-6 py-2 text-lg">
              Register for Selected Event
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
