import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "~/lib/db";
import RegistrationForm from "~/components/RegistrationForm";

// Define Event interface to match the database schema
interface Event {
  id: string;
  title: string;
  description?: string | null;
  price: number;
  place?: string | null;
  from: Date;
  to: Date;
  created_at: Date;
  visible: boolean;
}

function formatDate(dateStr: string | Date) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}

function formatTime(dateStr: string | Date) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("cs-CZ", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function EventPage({
  params,
}: {
  params: { id: string };
}) {
  const eventData = await prisma.event.findUnique({
    where: {
      id: params.id,
    },
  });

  if (!eventData) {
    notFound();
  }

  // Cast to our Event interface
  const event = eventData as unknown as Event;

  // Check visibility after casting
  if (!event.visible) {
    notFound();
  }

  const isEventInPast = new Date(event.to) < new Date();

  return (
    <main className="container mx-auto min-h-screen bg-[#1a0a3a] px-4 py-6 md:py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center rounded-full bg-purple-800/50 px-3 py-1 text-sm text-white transition hover:bg-purple-700/70 hover:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mr-1 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Events
          </Link>

          <Link
            href="/"
            className="inline-flex items-center rounded-full bg-purple-800/50 px-3 py-1 text-sm text-white transition hover:bg-purple-700/70 hover:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mr-1 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h2a1 1 0 001-1v-7m-6 0a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1"
              />
            </svg>
            Home
          </Link>
        </div>

        <div className="overflow-hidden rounded-lg bg-[#2c1660] shadow-xl">
          <div className="p-4 md:p-6">
            <h1 className="mb-4 text-2xl font-bold text-white md:text-3xl">
              {event.title}
            </h1>

            <div className="mb-5 grid gap-4 text-white sm:grid-cols-2">
              <div className="flex items-start">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-500/40 text-purple-200">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="font-medium text-white">Date</p>
                  <p>{formatDate(event.from)}</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-500/40 text-purple-200">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
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
                </div>
                <div className="ml-3">
                  <p className="font-medium text-white">Time</p>
                  <p>
                    {formatTime(event.from)} - {formatTime(event.to)}
                  </p>
                </div>
              </div>

              {event.place && (
                <div className="flex items-start sm:col-span-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-500/40 text-purple-200">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-white">Location</p>
                    <p>{event.place}</p>
                  </div>
                </div>
              )}

              {event.price && (
                <div className="flex items-start">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-500/40 text-purple-200">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-white">Price</p>
                    <p>{event.price} CZK</p>
                  </div>
                </div>
              )}
            </div>

            {event.description && (
              <div className="mb-5 rounded border border-purple-400/30 bg-purple-900/30 p-4 text-white">
                <h2 className="mb-2 font-medium text-white">About Event</h2>
                <div className="whitespace-pre-wrap text-sm">
                  {event.description}
                </div>
              </div>
            )}

            {isEventInPast ? (
              <div className="rounded border border-yellow-400/40 bg-yellow-900/30 p-4 text-center text-yellow-200">
                <p>Registration for this event is now closed.</p>
              </div>
            ) : (
              <div className="rounded-lg border border-purple-400/50 bg-[#24176b] p-6 shadow-lg">
                <h2 className="mb-4 text-center text-xl font-medium text-white">
                  Registration
                </h2>
                <RegistrationForm
                  eventId={event.id}
                  eventDate={`${formatDate(event.from)} ${formatTime(event.from)}-${formatTime(event.to)}`}
                  eventPlace={event.place}
                  eventPrice={event.price}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
