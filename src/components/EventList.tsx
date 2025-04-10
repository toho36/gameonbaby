"use client";

import Link from "next/link";

interface Event {
  id: string;
  title: string;
  description: string | null;
  price: number;
  place: string | null;
  from: Date;
  to: Date;
  visible?: boolean;
}

interface EventListProps {
  events: Event[];
}

export default function EventList({ events }: EventListProps) {
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
          <Link
            key={event.id}
            href={`/events/${event.id}`}
            className="rounded-lg border border-white/10 bg-white/5 p-5 transition-all hover:border-purple-400 hover:bg-white/10"
          >
            <h3 className="mb-2 text-xl font-semibold">{event.title}</h3>

            <div className="mb-3 flex justify-between text-sm">
              <span>{formatDate(event.from)}</span>
              <span>
                {formatTime(event.from)} - {formatTime(event.to)}
              </span>
            </div>

            <div className="mt-4">
              <span className="text-sm font-medium text-gray-300">
                {event.place || "Location TBA"}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
