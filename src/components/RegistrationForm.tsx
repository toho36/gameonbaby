// components/RegistrationForm.tsx
import { createRegistration } from "~/actions/actions";
// import prisma from "~/lib/db";
export default async function RegistrationForm() {
  // const events = await prisma.event.findMany();

  return (
    <div className="mx-auto w-full max-w-md rounded bg-white p-4 shadow-md">
      <h2 className="mb-4 text-2xl font-bold">
        26.10 18:15-21:15 GameOn Volleyball Registrace
      </h2>
      <h3>
        Kde: Sportovní hala TJ JM Chodov, Mírového hnutí 2137
        <br />
        Vstupné : 150Kč
        <br />
        {/* Kapacita: 32 / 42 */}
      </h3>
      <br />
      <form action={createRegistration} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Jméno
          </label>
          <input
            type="text"
            name="first_name"
            required
            className="w-full rounded border border-gray-300 p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            name="email"
            required
            className="w-full rounded border border-gray-300 p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Telefoní číslo
          </label>
          <input
            type="tel"
            name="phone_number"
            className="w-full rounded border border-gray-300 p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Způsob platby
          </label>
          <div className="flex flex-col space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="payment_type"
                value="CARD"
                required
                className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">QR</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="payment_type"
                value="CASH"
                required
                className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Hotově</span>
            </label>
          </div>
        </div>
        <button
          type="submit"
          className="w-full rounded bg-blue-600 p-2 text-white transition hover:bg-blue-700"
        >
          Register
        </button>
      </form>
    </div>
  );
}
