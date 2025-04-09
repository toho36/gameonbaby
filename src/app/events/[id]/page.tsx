import prisma from "~/lib/db";
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
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
          Game <span className="text-[hsl(280,100%,70%)]">On</span> Registration
        </h1>
        <div>
          <h2>{event?.price}</h2>
          <h2>{event?.from.toISOString()}</h2>
          <h2>{event?.to.toISOString()}</h2>
        </div>
      </div>
    </main>
  );
}
