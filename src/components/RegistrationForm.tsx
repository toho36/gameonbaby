// components/RegistrationForm.tsx
import { createRegistration } from "~/actions/actions";
import prisma from "~/lib/db";
export default async function RegistrationForm() {
  const events = await prisma.event.findMany();

  return (
    <div className="mx-auto max-w-md rounded bg-white p-4 shadow-md">
      <h2 className="mb-4 text-2xl font-bold">Register for Event</h2>
      <form action={createRegistration} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Select Event
          </label>
          <select
            name="event_id" // Renamed to "event_id" to capture the correct event ID
            required
            className="w-full rounded border border-gray-300 p-2"
          >
            <option value="">Choose an event</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                Event from {new Date(event.from).toLocaleDateString()} to{" "}
                {new Date(event.to).toLocaleDateString()} - ${event.price}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            First Name
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
            Last Name
          </label>
          <input
            type="text"
            name="last_name"
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
            Phone Number
          </label>
          <input
            type="tel"
            name="phone_number"
            className="w-full rounded border border-gray-300 p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Payment Type
          </label>
          <select
            name="payment_type"
            className="w-full rounded border border-gray-300 p-2"
          >
            <option value="CASH">CASH</option>
            <option value="CARD">CARD</option>
          </select>
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
