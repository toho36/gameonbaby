// components/EventForm.tsx
import { createEvent } from "~/actions/actions";

const EventForm: React.FC = () => {
  return (
    <div className="mx-auto max-w-2xl rounded-lg bg-white p-8 shadow-lg">
      <h2 className="mb-6 text-3xl font-bold text-indigo-800">
        Create New Event
      </h2>

      <form action={createEvent} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Event Name
            </label>
            <input
              type="text"
              className="w-full rounded-md border border-gray-300 p-3 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              required
              name="name"
              placeholder="Enter event name"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Location
            </label>
            <input
              type="text"
              className="w-full rounded-md border border-gray-300 p-3 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              required
              name="location"
              placeholder="Enter event location"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              From
            </label>
            <input
              type="datetime-local"
              className="w-full rounded-md border border-gray-300 p-3 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              required
              name="from"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              To
            </label>
            <input
              type="datetime-local"
              className="w-full rounded-md border border-gray-300 p-3 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              required
              name="to"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Price (Kč)
            </label>
            <div className="relative">
              <input
                type="number"
                className="w-full rounded-md border border-gray-300 p-3 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                required
                name="price"
                min="0"
                placeholder="0"
              />
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <span className="text-gray-500">Kč</span>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Capacity
            </label>
            <input
              type="number"
              className="w-full rounded-md border border-gray-300 p-3 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              required
              name="capacity"
              min="0"
              placeholder="0"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Event Description
          </label>
          <textarea
            className="w-full rounded-md border border-gray-300 p-3 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            rows={4}
            name="description"
            placeholder="Describe your event..."
          ></textarea>
        </div>

        <div className="hidden">
          <input
            type="datetime-local"
            name="created_at"
            value={new Date().toISOString().slice(0, 16)}
            readOnly
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-md bg-indigo-600 p-3 text-white transition duration-200 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
        >
          Create Event
        </button>
      </form>
    </div>
  );
};

export default EventForm;
