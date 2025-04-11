"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";

interface Event {
  id: string;
  title: string;
  description: string | null;
  price: number;
  place: string | null;
  capacity: number;
  from: string;
  to: string;
  visible: boolean;
}

function formatDateForInput(dateStr: string): string {
  try {
    // Parse the UTC date string
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return "";
    }

    // Format date string in format DD.MM.YYYY, HH:MM for display
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${day}.${month}.${year}, ${hours}:${minutes}`;
  } catch (error) {
    console.error("Error converting to display date:", error);
    return "";
  }
}

function formatDateForDatetimeInput(dateStr: string): string {
  try {
    // Parse the UTC date string
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return "";
    }

    // Get local timezone offset in minutes
    const tzOffset = date.getTimezoneOffset();

    // Adjust the date to local timezone
    const localDate = new Date(date.getTime() - tzOffset * 60000);

    // Format in local timezone exactly as yyyy-MM-ddThh:mm
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, "0");
    const day = String(localDate.getDate()).padStart(2, "0");
    const hours = String(localDate.getHours()).padStart(2, "0");
    const minutes = String(localDate.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (error) {
    console.error("Error converting to ISO date:", error);
    return "";
  }
}

export default function EditEventPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: 0,
    place: "",
    capacity: 0,
    from: "",
    to: "",
    fromDisplay: "",
    toDisplay: "",
    visible: true,
    manualDateInput: false,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "price" || name === "capacity" ? Number(value) : value,
    }));
  };

  useEffect(() => {
    async function fetchEvent() {
      try {
        const response = await fetch(`/api/admin/events/${params.id}`);
        const data = await response.json();
        if (data.success) {
          setEvent(data.event);

          // Format dates for input and display
          const fromInputFormat = formatDateForDatetimeInput(data.event.from);
          const toInputFormat = formatDateForDatetimeInput(data.event.to);

          // Format for display (like in duplicate page)
          const fromDisplayFormat = formatDateForInput(data.event.from);
          const toDisplayFormat = formatDateForInput(data.event.to);

          setFormData({
            title: data.event.title,
            description: data.event.description || "",
            price: data.event.price,
            place: data.event.place || "",
            capacity: data.event.capacity,
            from: fromInputFormat,
            to: toInputFormat,
            fromDisplay: fromDisplayFormat,
            toDisplay: toDisplayFormat,
            visible: data.event.visible,
            manualDateInput: false,
          });
        }
      } catch (error) {
        console.error("Error fetching event:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchEvent();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formElement = e.target as HTMLFormElement;
      const formData = new FormData(formElement);

      const fromInput = formData.get("from") as string;
      const toInput = formData.get("to") as string;

      // Validate date inputs
      if (!fromInput || !toInput) {
        console.error("Please select both start and end dates");
        return;
      }

      // Create dates in local timezone
      const fromDate = new Date(fromInput);
      const toDate = new Date(toInput);

      // Validate dates are valid
      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        console.error("Invalid date format");
        return;
      }

      // Convert to ISO for API
      formData.set("from", fromDate.toISOString());
      formData.set("to", toDate.toISOString());

      // Convert FormData to an object for API
      const formObject: Record<string, any> = {};
      formData.forEach((value, key) => {
        formObject[key] =
          key === "price" || key === "capacity"
            ? Number(value)
            : key === "visible"
              ? value === "on" || value === "true"
              : value;
      });

      const response = await fetch(`/api/admin/events/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formObject),
      });
      const data = await response.json();
      if (data.success) {
        router.push("/admin/events");
      }
    } catch (error) {
      console.error("Error updating event:", error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!event) {
    return <div>Event not found</div>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black bg-opacity-50">
      <div className="relative mx-auto w-full max-w-3xl px-4">
        <div className="rounded-lg bg-white shadow">
          <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold">Edit Event</h1>
              <button
                type="button"
                onClick={() => router.push("/admin/events")}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700"
                >
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  defaultValue={formData.title}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700"
                >
                  Description
                </label>
                <textarea
                  name="description"
                  id="description"
                  defaultValue={formData.description}
                  rows={4}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="price"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Price (CZK)
                  </label>
                  <input
                    type="number"
                    name="price"
                    id="price"
                    defaultValue={formData.price}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="capacity"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Capacity
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    id="capacity"
                    defaultValue={formData.capacity}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    required
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="place"
                  className="block text-sm font-medium text-gray-700"
                >
                  Location
                </label>
                <input
                  type="text"
                  name="place"
                  id="place"
                  defaultValue={formData.place}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="from"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Start Date & Time
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      aria-label="Start date display"
                      value={formData.fromDisplay}
                      readOnly
                      className="mt-1 block w-full rounded-md border border-gray-300 p-2 pr-10 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    />
                    <input
                      type="datetime-local"
                      name="from"
                      id="from"
                      defaultValue={formData.from}
                      className="sr-only" /* Hidden but still part of the form */
                      required
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="to"
                    className="block text-sm font-medium text-gray-700"
                  >
                    End Date & Time
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      aria-label="End date display"
                      value={formData.toDisplay}
                      readOnly
                      className="mt-1 block w-full rounded-md border border-gray-300 p-2 pr-10 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    />
                    <input
                      type="datetime-local"
                      name="to"
                      id="to"
                      defaultValue={formData.to}
                      className="sr-only" /* Hidden but still part of the form */
                      required
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="visible"
                  id="visible"
                  defaultChecked={formData.visible}
                  className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <label
                  htmlFor="visible"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Visible to users
                </label>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/admin/events")}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
