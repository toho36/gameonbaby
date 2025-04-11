"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { duplicateEvent, deleteEvent } from "~/actions/actions";

interface Event {
  id: string;
  title: string;
  description: string | null;
  price: number;
  place: string | null;
  from: string;
  to: string;
  created_at: string;
  visible: boolean;
  registrationCount: number;
}

export default function EventManagement() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [eventToDuplicate, setEventToDuplicate] = useState<Event | null>(null);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [duplicateFormData, setDuplicateFormData] = useState({
    title: "",
    description: "",
    price: 0,
    place: "",
    from: "",
    to: "",
    visible: true,
    manualDateInput: false,
  });
  const router = useRouter();

  useEffect(() => {
    async function checkPermission() {
      try {
        const response = await fetch("/api/admin/check");
        const data = await response.json();

        if (!data.isAdmin && !data.isModerator) {
          router.push("/dashboard");
          return;
        }

        fetchEvents();
      } catch (error) {
        console.error("Error checking permissions:", error);
        setError("Failed to verify permissions");
        setLoading(false);
      }
    }

    checkPermission();
  }, [router]);

  async function fetchEvents() {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/events");
      const data = await response.json();

      if (data.success) {
        setEvents(data.events);
      } else {
        setError(data.message || "Failed to load events");
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      setError("Failed to load events");
    } finally {
      setLoading(false);
    }
  }

  function formatDateTime(date: Date) {
    // Format: DD.MM.YY - HH:MM
    // Use local time instead of UTC to match the edit form
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(2);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${day}.${month}.${year} - ${hours}:${minutes}`;
  }

  function toISODateTimeString(dateStr: string) {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return "";
      }

      // Format in local timezone instead of UTC
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");

      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (error) {
      console.error("Error converting to ISO date:", error);
      return "";
    }
  }

  function parseManualDateInput(value: string) {
    try {
      const [datePart, timePart] = value.split(" ");
      if (datePart && timePart) {
        const [day, month, year] = datePart.split(".");
        const [hours, minutes] = timePart.split(":");

        if (day && month && year && hours && minutes) {
          let yearVal = year.length === 2 ? "20" + year : year;

          // Create a date string in local format instead of UTC
          return `${yearVal}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
        }
      }
      return "";
    } catch (error) {
      console.error("Error parsing manual date:", error);
      return "";
    }
  }

  async function handleDuplicate(id: string) {
    const eventToClone = events.find((event) => event.id === id);
    if (!eventToClone) return;

    setEventToDuplicate(eventToClone);
    setDuplicateFormData({
      title: `${eventToClone.title} (Copy)`,
      description: eventToClone.description || "",
      price: eventToClone.price,
      place: eventToClone.place || "",
      from: toISODateTimeString(eventToClone.from),
      to: toISODateTimeString(eventToClone.to),
      visible: eventToClone.visible,
      manualDateInput: false,
    });
    setShowDuplicateModal(true);
  }

  async function handleDuplicateSubmit() {
    if (!eventToDuplicate) return;

    try {
      const response = await fetch("/api/admin/events/duplicate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceEventId: eventToDuplicate.id,
          title: duplicateFormData.title,
          description: duplicateFormData.description || null,
          price: duplicateFormData.price,
          place: duplicateFormData.place || null,
          from: duplicateFormData.from,
          to: duplicateFormData.to,
          visible: duplicateFormData.visible,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowDuplicateModal(false);
        fetchEvents();
      } else {
        setError(data.message || "Failed to duplicate event");
      }
    } catch (error) {
      console.error("Error duplicating event:", error);
      setError("Failed to duplicate event");
    }
  }

  function handleFormChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value, type } = e.target;

    setDuplicateFormData({
      ...duplicateFormData,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : name === "price"
            ? parseInt(value, 10) || 0
            : value,
    });
  }

  async function handleDelete(id: string) {
    if (confirm("Are you sure you want to delete this event?")) {
      const result = await deleteEvent(id);
      if (result.success) {
        fetchEvents();
      } else {
        alert(result.error || "Failed to delete event");
      }
    }
  }

  const filteredEvents = showPastEvents
    ? events
    : events.filter((event) => new Date(event.to) >= new Date());

  // Sort the filtered events by date
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const dateA = new Date(a.from).getTime();
    const dateB = new Date(b.from).getTime();
    return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
  });

  if (loading) {
    return <div className="p-8 text-center">Loading events...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <h1 className="text-2xl font-bold">Event Management</h1>
        <div className="flex flex-col space-y-3 sm:flex-row sm:space-x-4 sm:space-y-0">
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showPastEvents"
                checked={showPastEvents}
                onChange={() => setShowPastEvents(!showPastEvents)}
                className="mr-2"
              />
              <label htmlFor="showPastEvents">Show past events</label>
            </div>
            <div className="flex items-center">
              <span className="mr-2 text-sm">Sort by date:</span>
              <Button
                variant="outline"
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="flex items-center space-x-1 px-2 py-1 text-xs"
              >
                {sortOrder === "asc" ? (
                  <>
                    <span>Oldest first</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m3 8 4-4 4 4" />
                      <path d="M7 4v16" />
                    </svg>
                  </>
                ) : (
                  <>
                    <span>Newest first</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m3 16 4 4 4-4" />
                      <path d="M7 20V4" />
                    </svg>
                  </>
                )}
              </Button>
            </div>
          </div>
          <div className="flex space-x-2">
            <Link href="/admin" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full">
                User Management
              </Button>
            </Link>
            <Link href="/admin/events/new" className="w-full sm:w-auto">
              <Button className="w-full">Create New Event</Button>
            </Link>
          </div>
        </div>
      </div>

      {sortedEvents.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-600">No events found</p>
          <Link href="/admin/events/new" className="mt-4 inline-block">
            <Button>Create Your First Event</Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Desktop view - Table */}
          <div className="hidden overflow-x-auto rounded-lg border border-gray-200 bg-white sm:block">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-3">Title</th>
                  <th className="px-6 py-3">
                    <div className="flex items-center">
                      Date
                      <button
                        onClick={() =>
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                        }
                        className="ml-1 text-gray-400 hover:text-gray-600"
                      >
                        {sortOrder === "asc" ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="m3 8 4-4 4 4" />
                            <path d="M7 4v16" />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="m3 16 4 4 4-4" />
                            <path d="M7 20V4" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </th>
                  <th className="px-6 py-3">Visibility</th>
                  <th className="px-6 py-3">Registrations</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedEvents.map((event) => (
                  <tr
                    key={event.id}
                    className={`hover:bg-gray-50 ${new Date(event.to) < new Date() ? "bg-gray-100" : ""}`}
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium">{event.title}</div>
                      {event.description && (
                        <div className="mt-1 max-w-xs truncate text-sm text-gray-500">
                          {event.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {formatDateTime(new Date(event.from))}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          event.visible
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {event.visible ? "Visible" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-sm font-medium text-blue-800">
                        {event.registrationCount}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/admin/events/${event.id}/registrations`}>
                          <Button
                            variant="outline"
                            className="px-2 py-1 text-xs"
                          >
                            View Registrations
                          </Button>
                        </Link>
                        <Link href={`/admin/events/${event.id}/edit`}>
                          <Button
                            variant="outline"
                            className="px-2 py-1 text-xs"
                          >
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          className="px-2 py-1 text-xs"
                          onClick={() => handleDuplicate(event.id)}
                        >
                          Duplicate
                        </Button>
                        <Button
                          variant="outline"
                          className="px-2 py-1 text-xs text-red-500 hover:bg-red-50"
                          onClick={() => handleDelete(event.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile view - Cards */}
          <div className="space-y-4 sm:hidden">
            {sortedEvents.map((event) => (
              <div
                key={event.id}
                className={`rounded-lg border border-gray-200 bg-white p-4 shadow ${
                  new Date(event.to) < new Date() ? "bg-gray-50" : ""
                }`}
              >
                <div className="mb-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{event.title}</h3>
                    <span
                      className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        event.visible
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {event.visible ? "Visible" : "Hidden"}
                    </span>
                  </div>
                  {event.description && (
                    <p className="mt-1 text-sm text-gray-600">
                      {event.description}
                    </p>
                  )}
                </div>

                <div className="mb-3 grid grid-cols-1 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Date:</span>
                    <div>{formatDateTime(new Date(event.from))}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Registrations:</span>
                    <div className="font-medium text-blue-800">
                      {event.registrationCount}
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link
                    href={`/admin/events/${event.id}/registrations`}
                    className="col-span-2"
                  >
                    <Button variant="outline" className="w-full py-1 text-xs">
                      View Registrations
                    </Button>
                  </Link>
                  <Link href={`/admin/events/${event.id}/edit`}>
                    <Button variant="outline" className="w-full py-1 text-xs">
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="w-full py-1 text-xs"
                    onClick={() => handleDuplicate(event.id)}
                  >
                    Duplicate
                  </Button>
                  <Button
                    variant="outline"
                    className="col-span-2 w-full py-1 text-xs text-red-500 hover:bg-red-50"
                    onClick={() => handleDelete(event.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showDuplicateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-4 shadow-lg sm:p-6">
            <h2 className="mb-4 text-xl font-semibold">Duplicate Event</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={duplicateFormData.title}
                  onChange={handleFormChange}
                  className="w-full rounded-md border border-gray-300 p-2"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  value={duplicateFormData.description}
                  onChange={handleFormChange}
                  className="w-full rounded-md border border-gray-300 p-2"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Price (Kč)
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={duplicateFormData.price}
                    onChange={handleFormChange}
                    className="w-full rounded-md border border-gray-300 p-2"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Place/Address
                  </label>
                  <input
                    type="text"
                    name="place"
                    value={duplicateFormData.place}
                    onChange={handleFormChange}
                    className="w-full rounded-md border border-gray-300 p-2"
                    placeholder="e.g., Sportovní hala TJ JM Chodov"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Visibility
                  </label>
                  <select
                    name="visible"
                    value={duplicateFormData.visible ? "true" : "false"}
                    onChange={handleFormChange}
                    className="w-full rounded-md border border-gray-300 p-2"
                  >
                    <option value="true">Visible</option>
                    <option value="false">Hidden</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="manualDateInput"
                    name="manualDateInput"
                    checked={duplicateFormData.manualDateInput}
                    onChange={(e) =>
                      setDuplicateFormData({
                        ...duplicateFormData,
                        manualDateInput: e.target.checked,
                      })
                    }
                    className="mr-2"
                  />
                  <label htmlFor="manualDateInput" className="text-sm">
                    Manually enter date and time
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {duplicateFormData.manualDateInput ? (
                  <>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Start Date & Time (DD.MM.YYYY HH:MM)
                      </label>
                      <input
                        type="text"
                        name="fromManual"
                        placeholder="e.g., 15.06.2023 14:30"
                        onChange={(e) => {
                          const value = e.target.value;
                          try {
                            const parsedDate = parseManualDateInput(value);
                            if (parsedDate) {
                              setDuplicateFormData({
                                ...duplicateFormData,
                                from: parsedDate,
                              });
                            }
                          } catch (error) {
                            console.error("Error parsing manual date:", error);
                          }
                        }}
                        className="w-full rounded-md border border-gray-300 p-2"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        End Date & Time (DD.MM.YYYY HH:MM)
                      </label>
                      <input
                        type="text"
                        name="toManual"
                        placeholder="e.g., 15.06.2023 16:30"
                        onChange={(e) => {
                          const value = e.target.value;
                          try {
                            const parsedDate = parseManualDateInput(value);
                            if (parsedDate) {
                              setDuplicateFormData({
                                ...duplicateFormData,
                                to: parsedDate,
                              });
                            }
                          } catch (error) {
                            console.error("Error parsing manual date:", error);
                          }
                        }}
                        className="w-full rounded-md border border-gray-300 p-2"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Start Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        name="from"
                        value={duplicateFormData.from}
                        onChange={handleFormChange}
                        className="w-full rounded-md border border-gray-300 p-2"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        End Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        name="to"
                        value={duplicateFormData.to}
                        onChange={handleFormChange}
                        className="w-full rounded-md border border-gray-300 p-2"
                        required
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse space-y-2 space-y-reverse sm:flex-row sm:justify-end sm:space-x-3 sm:space-y-0">
              <Button
                variant="outline"
                onClick={() => setShowDuplicateModal(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDuplicateSubmit}
                className="w-full sm:w-auto"
              >
                Duplicate Event
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
