import Link from "next/link";
import prisma from "~/lib/db";
import { Button } from "~/shared";
import { EventList } from "~/features/events";
import { hasSpecialAccess } from "~/server/service/userService";

export default async function HomePage() {
  // Get special access status
  const userHasSpecialAccess = await hasSpecialAccess();

  // Determine visibility filter based on user access level
  const visibilityFilter = userHasSpecialAccess
    ? {} // No filter for users with special access - they see all events
    : { visible: true }; // Regular users only see visible events

  const upcomingEvents = await prisma.event.findMany({
    where: {
      ...visibilityFilter,
      to: {
        gte: new Date(),
      },
    },
    orderBy: {
      from: "asc",
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
          <h1 className="mb-2 text-4xl font-bold sm:text-5xl">
            Game <span className="text-[hsl(280,100%,70%)]">On</span>
          </h1>
          <p className="text-white/70">Event Registration System</p>
        </header>

        <section className="mx-auto max-w-5xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Upcoming Events</h2>
            {userHasSpecialAccess && (
              <div className="text-sm text-purple-300">
                <span className="rounded-full bg-purple-800/50 px-3 py-1">
                  Showing all events (including hidden)
                </span>
              </div>
            )}
            <Link href="/events/archive">
              <Button
                variant="outline"
                className="px-3 py-1 text-sm text-white hover:bg-white/10"
              >
                Past Events
              </Button>
            </Link>
          </div>

          <EventList events={upcomingEvents} />
        </section>

        <footer className="mt-16 border-t border-white/10 pt-8 pb-6 text-center text-white/70">
          <p className="mb-4">Follow us on social media</p>
          <div className="flex justify-center space-x-6">
            <a
              href="https://www.facebook.com/groups/1181887420384375"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[hsl(280,100%,70%)] transition-colors"
            >
              Facebook
            </a>
            <a
              href="https://www.instagram.com/gameon.vb/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[hsl(280,100%,70%)] transition-colors"
            >
              Instagram
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}
