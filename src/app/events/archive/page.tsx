import Link from "next/link";
import prisma from "~/lib/db";
import { Button } from "~/components/ui/button";
import EventList from "~/components/EventList";

export default async function PastEventsPage() {
  const pastEvents = await prisma.event.findMany({
    where: {
      visible: true,
      to: {
        lt: new Date(),
      },
    },
    orderBy: {
      from: "desc", // Most recent past events first
    },
  });

  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Past Events
        </h1>

        <section className="w-full max-w-4xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Archive</h2>
            <Link href="/">
              <Button
                variant="outline"
                className="text-white hover:bg-white/10"
              >
                View Upcoming Events
              </Button>
            </Link>
          </div>

          <EventList events={pastEvents} />
        </section>
      </div>
    </main>
  );
}
