import RegistrationForm from "~/components/RegistrationForm";
import prisma from "~/lib/db";
export default async function HomePage() {
  const allUsers = await prisma.event.findMany();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
          Game <span className="text-[hsl(280,100%,70%)]">On</span> Registration
        </h1>
        {allUsers.map((user) => (
          <div key={user.id}>
            {user.price} {user.from.toISOString()} {user.to.toISOString()}
            test
          </div>
        ))}
        {/* <PaymentForm />
         */}
        <RegistrationForm />
      </div>
    </main>
  );
}
