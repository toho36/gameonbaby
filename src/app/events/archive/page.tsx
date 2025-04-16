import Link from "next/link";
import prisma from "~/lib/db";
import { Button } from "~/shared/components/ui/button";
import { EventList } from "~/features/events";
import { hasSpecialAccess } from "~/server/service/userService";

export default async function PastEventsPage() {
  // Get special access status
  const userHasSpecialAccess = await hasSpecialAccess();

  // Determine visibility filter based on user access level
  const visibilityFilter = userHasSpecialAccess
    ? {} // No filter for users with special access - they see all events
    : { visible: true }; // Regular users only see visible events

  const pastEvents = await prisma.event.findMany({
    where: {
      ...visibilityFilter,
      to: {
        lt: new Date(),
      },
    },
    orderBy: {
      from: "desc", // Most recent past events first
    },
    include: {
      _count: {
        select: {
          Registration: true,
        },
      },
    },
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-10 text-center">
          <h1 className="mb-2 text-4xl font-bold sm:text-5xl">Past Events</h1>
          <p className="text-white/70">Event History</p>
        </header>

        <section className="mx-auto max-w-5xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Archive</h2>
            {userHasSpecialAccess && (
              <div className="text-sm text-purple-300">
                <span className="rounded-full bg-purple-800/50 px-3 py-1">
                  Showing all events (including hidden)
                </span>
              </div>
            )}
            <Link href="/">
              <Button
                variant="outline"
                className="px-3 py-1 text-sm text-white hover:bg-white/10"
              >
                Upcoming Events
              </Button>
            </Link>
          </div>

          <EventList events={pastEvents} />
        </section>
      </div>
    </main>
  );
}
