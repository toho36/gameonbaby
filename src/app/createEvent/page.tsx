// components/EventForm.tsx
import { createEvent } from "~/actions/actions";
const EventForm: React.FC = () => {
  return (
    <div className="mx-auto max-w-md rounded bg-white p-4 shadow-md">
      <h2 className="mb-4 text-2xl font-bold">Create New Event</h2>
      <form action={createEvent} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Price
          </label>
          <input
            type="number"
            className="w-full rounded border border-gray-300 p-2"
            required
            name="price"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Capacity
          </label>
          <input
            type="number"
            className="w-full rounded border border-gray-300 p-2"
            required
            name="capacity"
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            From
          </label>
          <input
            type="datetime-local"
            className="w-full rounded border border-gray-300 p-2"
            required
            name="from"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">To</label>
          <input
            type="datetime-local"
            className="w-full rounded border border-gray-300 p-2"
            required
            name="to"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Created At
          </label>
          <input
            type="datetime-local"
            className="w-full rounded border border-gray-300 p-2"
            required
            name="created_at"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded bg-blue-600 p-2 text-white transition hover:bg-blue-700"
        >
          Create Event
        </button>
      </form>
    </div>
  );
};

export default EventForm;
