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
  capacity: number;
  _count?: {
    Registration: number;
  };
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
      <div className="rounded-lg border border-white/20 bg-white/10 p-8 text-center">
        <p className="mb-2 text-xl text-white">No events scheduled</p>
        <p className="text-sm text-white/70">
          Check back later for upcoming events
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <Link
            key={event.id}
            href={`/events/${event.id}`}
            className="flex flex-col rounded-lg border border-white/20 bg-white/10 p-5 transition-all hover:border-purple-400 hover:bg-white/15"
          >
            <div className="mb-3 flex items-start justify-between">
              <h3 className="text-xl font-semibold text-white">
                {event.title}
              </h3>
              {event.visible === false && (
                <span className="ml-2 rounded-full bg-yellow-500/30 px-2 py-0.5 text-xs font-medium text-yellow-200">
                  Hidden
                </span>
              )}
            </div>

            <div className="mb-3 text-sm text-white/90">
              <div className="mb-1">{formatDate(event.from)}</div>
              <div>
                {formatTime(event.from)} - {formatTime(event.to)}
              </div>
            </div>

            <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-3">
              <span className="text-sm text-white/80">
                {event.place || "Location TBA"}
              </span>
              {event.capacity > 0 && (
                <span className="rounded-full bg-purple-800/50 px-2 py-1 text-xs text-white">
                  {event._count?.Registration || 0}/{event.capacity}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
