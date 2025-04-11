import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "~/lib/db";
import RegistrationForm from "~/components/RegistrationForm";

// Define Event interface to match the database schema
interface Event {
  id: string;
  title: string;
  description: string | null;
  price: number;
  place: string | null;
  from: Date;
  to: Date;
  created_at: Date;
  visible: boolean;
  capacity: number;
  _count: {
    Registration: number;
  };
}

function formatDate(dateStr: string | Date) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    timeZone: "Europe/Prague",
  });
}

function formatTime(dateStr: string | Date) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("cs-CZ", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Prague",
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
    include: {
      _count: {
        select: {
          Registration: true,
        },
      },
      Registration: {
        select: {
          first_name: true,
          last_name: true,
          created_at: true,
        },
        orderBy: {
          created_at: "desc",
        },
      },
    },
  });

  if (!eventData) {
    notFound();
  }

  // Cast to our Event interface with registrations
  const event = {
    ...eventData,
    registrations: eventData.Registration,
  } as unknown as Event & {
    registrations: {
      first_name: string;
      last_name: string | null;
      created_at: Date;
    }[];
  };

  // Check visibility after casting
  if (!event.visible) {
    notFound();
  }

  const isEventInPast = new Date(event.to) < new Date();

  return (
    <main className="min-h-screen bg-[#1a0a3a] px-4 py-6 md:py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center rounded-full bg-purple-800/50 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-purple-700/70 hover:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mr-2 h-4 w-4"
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
            className="inline-flex items-center rounded-full bg-purple-800/50 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-purple-700/70 hover:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mr-2 h-4 w-4"
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

        <div className="overflow-hidden rounded-2xl bg-gradient-to-b from-[#2c1660] to-[#24134d] shadow-xl">
          <div className="p-6 md:p-8">
            <h1 className="mb-6 text-2xl font-bold text-white md:text-3xl lg:text-4xl">
              {event.title}
            </h1>

            <div className="mb-8 grid gap-6 text-white sm:grid-cols-2">
              <div className="flex items-start space-x-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/40 text-purple-200">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
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
                <div>
                  <h2 className="text-base font-medium text-purple-200">
                    Date
                  </h2>
                  <p className="mt-1 text-lg font-semibold text-white">
                    {formatDate(event.from)}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/40 text-purple-200">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
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
                <div>
                  <h2 className="text-base font-medium text-purple-200">
                    Time
                  </h2>
                  <p className="mt-1 text-lg font-semibold text-white">
                    {formatTime(event.from)} - {formatTime(event.to)}
                  </p>
                </div>
              </div>

              {event.place && (
                <div className="flex items-start space-x-4 sm:col-span-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/40 text-purple-200">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
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
                  <div>
                    <h2 className="text-base font-medium text-purple-200">
                      Location
                    </h2>
                    <p className="mt-1 text-lg font-semibold text-white">
                      {event.place}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-8 grid gap-6 sm:grid-cols-2">
              {event.price && (
                <div className="overflow-hidden rounded-xl bg-white/10 p-5 shadow-md backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">Price</h2>
                    <div className="text-3xl font-bold text-white">
                      {event.price} Kč
                    </div>
                  </div>
                </div>
              )}

              <div className="overflow-hidden rounded-xl bg-white/10 p-5 shadow-md backdrop-blur-sm">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Capacity</h2>
                  <div className="text-2xl font-bold text-white">
                    {event._count.Registration} / {event.capacity}
                  </div>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-2.5 rounded-full bg-white"
                    style={{
                      width: `${Math.min(
                        100,
                        (event._count.Registration / event.capacity) * 100,
                      )}%`,
                    }}
                  ></div>
                </div>
                {event._count.Registration < event.capacity && (
                  <div className="mt-2 text-right text-sm text-white/80">
                    {event.capacity - event._count.Registration} spots left
                  </div>
                )}
              </div>
            </div>

            {event.description && (
              <>
                <h2 className="mb-5 text-xl font-bold text-white">
                  About Event
                </h2>
                <div className="mb-8 rounded-xl border border-white/20 bg-white/5 p-5 text-white backdrop-blur-sm">
                  <div className="prose prose-invert prose-p:text-white/90 prose-li:text-white/90 max-w-none whitespace-pre-wrap text-base">
                    {event.description}
                  </div>
                </div>
              </>
            )}

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
                <h3 className="mb-1 text-xl font-bold text-white">
                  Event Completed
                </h3>
                <p className="text-white/80">
                  Registration for this event is now closed.
                </p>
              </div>
            ) : (
              <>
                <h2 className="mb-5 text-xl font-bold text-white">Register</h2>
                <RegistrationForm
                  event={{
                    ...event,
                    from: event.from.toISOString(),
                    to: event.to.toISOString(),
                  }}
                  eventId={event.id}
                  eventDate={formatDate(event.from)}
                />
              </>
            )}

            {/* Display registrations */}
            {event.registrations.length > 0 && (
              <>
                <h2 className="mb-5 mt-8 text-xl font-bold text-white">
                  Participants
                </h2>
                <div className="rounded-xl border border-white/20 bg-white/5 p-5 backdrop-blur-sm">
                  <div className="grid gap-3">
                    {event.registrations.map((reg, index) => (
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
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
