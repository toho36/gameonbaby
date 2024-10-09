import Link from "next/link";
import PaymentForm from "~/components/PaymentForm";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
          Game <span className="text-[hsl(280,100%,70%)]">On</span> Registration
        </h1>
        <PaymentForm />
      </div>
    </main>
  );
}
