import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "~/lib/db";
import { Button } from "~/components/ui/button";
import RegistrationForm from "~/components/RegistrationForm";

export default async function EventPage({
  params,
}: {
  params: { id: string };
}) {
  const event = await prisma.event.findUnique({
    where: {
      id: params.id,
    },
  });

  if (!event || !event.visible) {
    notFound();
  }

  // Check if event is in the past
  const isPastEvent = new Date(event.to) < new Date();

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat("cs-CZ", {
      dateStyle: "full",
      timeStyle: "short",
    }).format(new Date(date));
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <div className="flex w-full max-w-4xl flex-col">
          <div className="mb-8">
            <Link href="/">
              <Button
                variant="outline"
                className="mb-4 text-white hover:bg-white/10"
              >
                ← Back to Events
              </Button>
            </Link>
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
              {event.title}
            </h1>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-6 rounded-lg border border-white/10 bg-white/5 p-6">
              <div>
                <h2 className="mb-2 text-xl font-semibold">Event Details</h2>
                <div className="space-y-3 text-gray-300">
                  <p>
                    <span className="font-medium text-white">Date:</span>{" "}
                    {formatDateTime(event.from).split(",")[0]}
                  </p>
                  <p>
                    <span className="font-medium text-white">Time:</span>{" "}
                    {formatDateTime(event.from).split(",")[1]} -{" "}
                    {formatDateTime(event.to).split(",")[1]}
                  </p>
                  <p>
                    <span className="font-medium text-white">Price:</span>{" "}
                    {event.price} Kč
                  </p>
                </div>
              </div>

              {event.description && (
                <div>
                  <h2 className="mb-2 text-xl font-semibold">Description</h2>
                  <p className="whitespace-pre-line text-gray-300">
                    {event.description}
                  </p>
                </div>
              )}
            </div>

            <div>
              {isPastEvent ? (
                <div className="rounded-lg border border-yellow-400/30 bg-yellow-400/10 p-6 text-center">
                  <h2 className="mb-3 text-xl font-semibold text-yellow-300">
                    This event has ended
                  </h2>
                  <p className="mb-4 text-gray-300">
                    Registration is no longer available for this event.
                  </p>
                  <Link href="/">
                    <Button>View Upcoming Events</Button>
                  </Link>
                </div>
              ) : (
                <div className="rounded-lg border border-white/10 bg-white/5 p-6">
                  <h2 className="mb-4 text-xl font-semibold">
                    Register for this Event
                  </h2>
                  <RegistrationForm eventId={event.id} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
