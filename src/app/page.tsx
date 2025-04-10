import Link from "next/link";
import prisma from "~/lib/db";
import { Button } from "~/components/ui/button";
import EventList from "~/components/EventList";

export default async function HomePage() {
  const upcomingEvents = await prisma.event.findMany({
    where: {
      visible: true,
      to: {
        gte: new Date(),
      },
    },
    orderBy: {
      from: "asc",
    },
  });

  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
          Game <span className="text-[hsl(280,100%,70%)]">On</span> Registration
        </h1>

        <section className="w-full max-w-4xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-3xl font-bold">Upcoming Events</h2>
            <Link href="/events/archive">
              <Button
                variant="outline"
                className="text-white hover:bg-white/10"
              >
                View Past Events
              </Button>
            </Link>
          </div>

          <EventList events={upcomingEvents} />
        </section>
      </div>
    </main>
  );
}
