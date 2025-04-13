"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import useEventStore, { Event } from "~/stores/eventStore";
import {
  useEvents,
  useDeleteEvent,
  useUpdateEvent,
  useDuplicateEvent,
} from "~/api/events";

export default function EventManagement() {
  const events = useEventStore((state) => state.events);
  const loading = useEventStore((state) => state.loading);
  const error = useEventStore((state) => state.error);
  const sortOrder = useEventStore((state) => state.sortOrder);
  const showPastEvents = useEventStore((state) => state.showPastEvents);
  const setSortOrder = useEventStore((state) => state.setSortOrder);
  const setShowPastEvents = useEventStore((state) => state.setShowPastEvents);

  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [eventToDuplicate, setEventToDuplicate] = useState<Event | null>(null);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);

  const [duplicateFormData, setDuplicateFormData] = useState({
    title: "",
    description: "",
    price: 0,
    place: "",
    from: "",
    to: "",
    visible: true,
    capacity: 0,
  });
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    price: 0,
    place: "",
    from: "",
    to: "",
    visible: true,
    capacity: 0,
  });
  const router = useRouter();

  // React Query hooks
  const { refetch } = useEvents();
  const { mutate: deleteEventMutation } = useDeleteEvent();
  const { mutate: updateEventMutation } = useUpdateEvent();
  const { mutate: duplicateEventMutation } = useDuplicateEvent();

  useEffect(() => {
    async function checkPermission() {
      try {
        const response = await fetch("/api/admin/check");
        const data = await response.json();

        if (!data.isAdmin && !data.isModerator) {
          router.push("/dashboard");
          return;
        }
      } catch (error) {
        console.error("Error checking permissions:", error);
      }
    }

    checkPermission();
  }, [router]);

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

  async function handleEdit(id: string) {
    const eventToModify = events.find((event) => event.id === id);
    if (!eventToModify) return;

    setEventToEdit(eventToModify);
    setEditFormData({
      title: eventToModify.title,
      description: eventToModify.description || "",
      price: eventToModify.price,
      place: eventToModify.place || "",
      capacity: eventToModify.capacity || 0,
      from: toISODateTimeString(eventToModify.from),
      to: toISODateTimeString(eventToModify.to),
      visible: eventToModify.visible,
    });
    setShowEditModal(true);
  }

  async function handleEditSubmit() {
    if (!eventToEdit) return;

    try {
      // Create FormData
      const formData = new FormData();
      formData.append("title", editFormData.title);
      formData.append("description", editFormData.description);
      formData.append("price", editFormData.price.toString());
      formData.append("place", editFormData.place);
      formData.append("capacity", editFormData.capacity.toString());
      formData.append("from", new Date(editFormData.from).toISOString());
      formData.append("to", new Date(editFormData.to).toISOString());
      formData.append("visible", editFormData.visible ? "true" : "false");

      updateEventMutation({ eventId: eventToEdit.id, formData });
      setShowEditModal(false);
    } catch (error) {
      console.error("Error updating event:", error);
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
      capacity: eventToClone.capacity || 0,
      from: toISODateTimeString(eventToClone.from),
      to: toISODateTimeString(eventToClone.to),
      visible: eventToClone.visible,
    });
    setShowDuplicateModal(true);
  }

  async function handleDuplicateSubmit() {
    if (!eventToDuplicate) return;

    try {
      const formData = new FormData();
      formData.append("sourceEventId", eventToDuplicate.id);
      formData.append("title", duplicateFormData.title);
      formData.append("description", duplicateFormData.description);
      formData.append("price", duplicateFormData.price.toString());
      formData.append("place", duplicateFormData.place);
      formData.append("capacity", duplicateFormData.capacity.toString());
      formData.append("from", new Date(duplicateFormData.from).toISOString());
      formData.append("to", new Date(duplicateFormData.to).toISOString());
      formData.append("visible", duplicateFormData.visible ? "true" : "false");

      duplicateEventMutation(formData);
      setShowDuplicateModal(false);
    } catch (error) {
      console.error("Error duplicating event:", error);
    }
  }

  function handleFormChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
    formType: "duplicate" | "edit",
  ) {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    const formData =
      formType === "duplicate" ? duplicateFormData : editFormData;
    const setFormData =
      formType === "duplicate" ? setDuplicateFormData : setEditFormData;

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  }

  async function handleDelete(id: string) {
    if (
      confirm(
        "Are you sure you want to delete this event? This cannot be undone.",
      )
    ) {
      deleteEventMutation(id);
    }
  }

  // Filter and sort events based on user preferences
  const filteredEvents = showPastEvents
    ? events
    : events.filter((event) => new Date(event.to) >= new Date());

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const dateA = new Date(a.from).getTime();
    const dateB = new Date(b.from).getTime();
    return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
  });

  // Render content based on loading state and data
  let content;
  if (loading) {
    // Show skeleton loader when loading
    content = (
      <>
        <div className="mb-6 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <div className="h-8 w-64 animate-pulse rounded bg-gray-200"></div>
            <div className="mt-2 h-5 w-80 animate-pulse rounded bg-gray-200"></div>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="h-10 w-40 animate-pulse rounded bg-gray-200"></div>
            <div className="h-10 w-40 animate-pulse rounded bg-gray-200"></div>
          </div>
        </div>

        {/* Desktop skeleton loader */}
        <div className="hidden overflow-x-auto rounded-lg border border-gray-200 bg-white sm:block">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                <th className="px-6 py-3">Title</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Visibility</th>
                <th className="px-6 py-3">Capacity</th>
                <th className="px-6 py-3">Registrations</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4">
                    <div className="h-5 w-40 animate-pulse rounded bg-gray-200"></div>
                    <div className="mt-1 h-4 w-64 animate-pulse rounded bg-gray-200"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-5 w-32 animate-pulse rounded bg-gray-200"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-5 w-16 animate-pulse rounded-full bg-gray-200"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-5 w-20 animate-pulse rounded-full bg-gray-200"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-5 w-10 animate-pulse rounded-full bg-gray-200"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      <div className="h-7 w-24 animate-pulse rounded bg-gray-200"></div>
                      <div className="h-7 w-16 animate-pulse rounded bg-gray-200"></div>
                      <div className="h-7 w-20 animate-pulse rounded bg-gray-200"></div>
                      <div className="h-7 w-16 animate-pulse rounded bg-gray-200"></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile skeleton loader */}
        <div className="space-y-4 sm:hidden">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow"
            >
              <div className="mb-2">
                <div className="flex items-center justify-between">
                  <div className="h-5 w-40 animate-pulse rounded bg-gray-200"></div>
                  <div className="h-5 w-16 animate-pulse rounded-full bg-gray-200"></div>
                </div>
                <div className="mt-2 h-4 w-full animate-pulse rounded bg-gray-200"></div>
              </div>
              <div className="mb-3 grid grid-cols-1 gap-2 text-sm">
                <div>
                  <div className="h-4 w-10 animate-pulse rounded bg-gray-200"></div>
                  <div className="mt-1 h-4 w-32 animate-pulse rounded bg-gray-200"></div>
                </div>
                <div>
                  <div className="h-4 w-16 animate-pulse rounded bg-gray-200"></div>
                  <div className="mt-1 h-4 w-20 animate-pulse rounded bg-gray-200"></div>
                </div>
                <div>
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-200"></div>
                  <div className="mt-1 h-4 w-10 animate-pulse rounded bg-gray-200"></div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="h-8 w-full animate-pulse rounded bg-gray-200"></div>
                <div className="h-8 w-24 animate-pulse rounded bg-gray-200"></div>
                <div className="h-8 w-24 animate-pulse rounded bg-gray-200"></div>
                <div className="h-8 w-24 animate-pulse rounded bg-gray-200"></div>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  } else if (error) {
    content = <div className="p-8 text-center text-red-600">{error}</div>;
  } else if (sortedEvents.length === 0) {
    // Show "No events found" only after loading is complete
    content = (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-600">No events found</p>
        <Link href="/admin/events/new" className="mt-4 inline-block">
          <Button>Create Your First Event</Button>
        </Link>
      </div>
    );
  } else {
    // Show events when available
    content = (
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
                <th className="px-6 py-3">Capacity</th>
                <th className="px-6 py-3">Registrations</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedEvents.map((event) => (
                <tr
                  key={event.id}
                  className={`hover:bg-gray-50 ${
                    new Date(event.to) < new Date() ? "bg-gray-100" : ""
                  }`}
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
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-medium text-gray-800">
                      {event.capacity || "No limit"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-sm font-medium text-blue-800">
                      {event._count.Registration}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/events/${event.id}/${event.id}/registrations`}
                      >
                        <Button
                          variant="outline"
                          className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50"
                        >
                          Registrations
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        className="px-2 py-1 text-xs"
                        onClick={() => handleEdit(event.id)}
                      >
                        Edit
                      </Button>
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
                  <span className="text-gray-500">Capacity:</span>
                  <div className="font-medium text-gray-800">
                    {event.capacity || "No limit"}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Registrations:</span>
                  <div className="font-medium text-blue-800">
                    {event._count.Registration}
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link
                  href={`/admin/events/${event.id}/${event.id}/registrations`}
                  className="col-span-2"
                >
                  <Button
                    variant="outline"
                    className="w-full text-blue-600 hover:bg-blue-50"
                  >
                    View Registrations
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="w-full py-1 text-xs"
                  onClick={() => handleEdit(event.id)}
                >
                  Edit
                </Button>
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
    );
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-8">{content}</div>;
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

      {/* Content area - will show skeleton, error, "no events", or events list */}
      {content}

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
                  onChange={(e) => handleFormChange(e, "duplicate")}
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
                  onChange={(e) => handleFormChange(e, "duplicate")}
                  className="w-full rounded-md border border-gray-300 p-2"
                  rows={3}
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
                    value={duplicateFormData.price}
                    onChange={(e) => handleFormChange(e, "duplicate")}
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
                    value={duplicateFormData.capacity}
                    onChange={(e) => handleFormChange(e, "duplicate")}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    required
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Place/Address
                  </label>
                  <input
                    type="text"
                    name="place"
                    value={duplicateFormData.place}
                    onChange={(e) => handleFormChange(e, "duplicate")}
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
                    onChange={(e) => handleFormChange(e, "duplicate")}
                    className="w-full rounded-md border border-gray-300 p-2"
                  >
                    <option value="true">Visible</option>
                    <option value="false">Hidden</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    name="from"
                    value={duplicateFormData.from}
                    onChange={(e) => handleFormChange(e, "duplicate")}
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
                    onChange={(e) => handleFormChange(e, "duplicate")}
                    className="w-full rounded-md border border-gray-300 p-2"
                    required
                  />
                </div>
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

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-4 shadow-lg sm:p-6">
            <h2 className="mb-4 text-xl font-semibold">Edit Event</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={editFormData.title}
                  onChange={(e) => handleFormChange(e, "edit")}
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
                  value={editFormData.description}
                  onChange={(e) => handleFormChange(e, "edit")}
                  className="w-full rounded-md border border-gray-300 p-2"
                  rows={3}
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
                    value={editFormData.price}
                    onChange={(e) => handleFormChange(e, "edit")}
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
                    value={editFormData.capacity}
                    onChange={(e) => handleFormChange(e, "edit")}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    required
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Place/Address
                  </label>
                  <input
                    type="text"
                    name="place"
                    value={editFormData.place}
                    onChange={(e) => handleFormChange(e, "edit")}
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
                    value={editFormData.visible ? "true" : "false"}
                    onChange={(e) => handleFormChange(e, "edit")}
                    className="w-full rounded-md border border-gray-300 p-2"
                  >
                    <option value="true">Visible</option>
                    <option value="false">Hidden</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    name="from"
                    value={editFormData.from}
                    onChange={(e) => handleFormChange(e, "edit")}
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
                    value={editFormData.to}
                    onChange={(e) => handleFormChange(e, "edit")}
                    className="w-full rounded-md border border-gray-300 p-2"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse space-y-2 space-y-reverse sm:flex-row sm:justify-end sm:space-x-3 sm:space-y-0">
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button onClick={handleEditSubmit} className="w-full sm:w-auto">
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
