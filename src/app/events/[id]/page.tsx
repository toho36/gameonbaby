import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "~/lib/db";
import { RegistrationForm } from "~/features/registration";
import {
  EventParticipantLists,
  CheckRegistrationStatus,
  CapacityDisplay,
} from "~/features/events";
import { PrismaClient, UserRole } from "@prisma/client";
import {
  getCurrentUser,
  hasSpecialAccess,
  isUserModerator,
} from "~/server/service/userService";

// Create a separate client for raw queries
const prismaRaw = new PrismaClient();

// Define Event interface to match the database schema
interface EventData {
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
  bankAccountId?: string | null;
  Registration: Array<{
    first_name: string;
    last_name: string | null;
    created_at: Date;
  }>;
  _count: {
    Registration: number;
    WaitingList: number;
  };
}

// Interface for WaitingList entries from raw query
interface WaitingListEntry {
  first_name: string;
  last_name: string | null;
  created_at: Date;
}

// Interface for combined event data
interface EventWithLists {
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
  bankAccountId?: string | null;
  _count: {
    Registration: number;
    WaitingList: number;
  };
  registrations: Array<{
    first_name: string;
    last_name: string | null;
    created_at: Date;
  }>;
  waitingList: WaitingListEntry[];
}

// Interface for RegistrationForm component
interface RegistrationFormEvent {
  id: string;
  title: string;
  description: string | null;
  price: number;
  place: string | null;
  capacity: number;
  from: string;
  to: string;
  visible: boolean;
  bankAccountId?: string | null;
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
  // Check if user has special access to see hidden events
  const userHasSpecialAccess = await hasSpecialAccess();
  // Check if user has permission to view participant details
  const userCanViewParticipants = await isUserModerator();

  const eventData = (await prisma.event.findUnique({
    where: {
      id: params.id,
    },
    select: {
      id: true,
      title: true,
      description: true,
      price: true,
      place: true,
      capacity: true,
      from: true,
      to: true,
      visible: true,
      bankAccountId: true,
      Registration: {
        orderBy: {
          created_at: "asc",
        },
        select: {
          first_name: true,
          last_name: true,
          created_at: true,
        },
      },
      _count: {
        select: {
          Registration: true,
        },
      },
    },
  })) as unknown as
    | (Omit<EventData, "_count"> & {
        _count: { Registration: number };
      })
    | null;

  if (!eventData) {
    notFound();
  }

  // Fetch waiting list entries with raw query
  let waitingListEntries: WaitingListEntry[] = [];

  try {
    console.log(`Attempting to fetch waiting list for event ID: ${params.id}`);

    // Simply use raw query with PascalCase table name as it should work after db reset
    waitingListEntries = await prismaRaw.$queryRaw<WaitingListEntry[]>`
      SELECT first_name, last_name, created_at 
      FROM "WaitingList"
      WHERE event_id = ${params.id}
      ORDER BY created_at ASC
    `;
    console.log(
      `Successfully fetched waiting list: ${waitingListEntries.length} entries`,
    );
  } catch (error) {
    console.error("Error fetching waiting list:", error);
    waitingListEntries = [];
  }

  // Count waiting list entries
  const waitingListCount = waitingListEntries.length;

  // Cast to our Event interface with registrations and waiting list
  const event: EventWithLists = {
    ...eventData,
    registrations: eventData.Registration || [],
    waitingList: waitingListEntries || [],
    _count: {
      ...eventData._count,
      WaitingList: waitingListCount,
    },
  };

  // Check visibility - if event is not visible, only allow access to users with special access
  if (!event.visible && !userHasSpecialAccess) {
    notFound();
  }

  const isEventInPast = new Date(event.to) < new Date();

  // For regular users, filter out the participant data but keep the counts
  const registrationsForComponent = userCanViewParticipants
    ? event.registrations
    : [];

  const waitingListForComponent = userCanViewParticipants
    ? event.waitingList
    : [];

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
            {!event.visible && (
              <div className="mb-4 rounded-lg bg-yellow-500/20 p-3 text-yellow-200">
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="mr-2 h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-medium">Hidden Event</span>
                </div>
                <p className="mt-1 pl-7 text-sm">
                  This event is not publicly visible but you can see it because
                  you have special access.
                </p>
              </div>
            )}
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

              {/* Use the CapacityDisplay component */}
              <CapacityDisplay
                initialRegCount={event._count.Registration}
                capacity={event.capacity}
              />
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
                    } as RegistrationFormEvent
                  }
                  eventId={event.id}
                  eventDate={formatDate(event.from)}
                />
              </>
            )}

            {/* Show participant lists to everyone */}
            <EventParticipantLists
              eventId={event.id}
              initialRegistrations={event.registrations}
              initialWaitingList={event.waitingList}
              initialRegCount={event._count.Registration}
              capacity={event.capacity}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
