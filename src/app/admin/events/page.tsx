"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "~/shared/components/ui/button";
import useEventStore, { Event } from "~/stores/eventStore";
import {
  useEvents,
  useDeleteEvent,
  useUpdateEvent,
  useDuplicateEvent,
} from "~/api/events";
import BankAccountSelector from "~/components/admin/BankAccountSelector";

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [eventToDuplicate, setEventToDuplicate] = useState<Event | null>(null);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [duplicateFormData, setDuplicateFormData] = useState({
    title: "",
    description: "",
    price: 0,
    place: "",
    from: "",
    to: "",
    visible: "true",
    capacity: 0,
    autoPromote: false,
    bankAccountId: "",
  });
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    price: 0,
    place: "",
    from: "",
    to: "",
    visible: "true",
    capacity: 0,
    autoPromote: false,
    bankAccountId: "",
  });
  const router = useRouter();

  // React Query hooks
  const { refetch } = useEvents();
  const { mutate: deleteEventMutation } = useDeleteEvent();
  const { mutate: updateEventMutation } = useUpdateEvent();
  const { mutate: duplicateEventMutation } = useDuplicateEvent();

  // Refresh data when component mounts to ensure registration counts are up-to-date
  useEffect(() => {
    refetch();
  }, [refetch]);

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
      visible: eventToModify.visible ? "true" : "false",
      autoPromote: eventToModify.autoPromote || false,
      bankAccountId: eventToModify.bankAccountId || "",
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
      formData.append("visible", editFormData.visible);
      formData.append("autoPromote", editFormData.autoPromote.toString());
      formData.append("bankAccountId", editFormData.bankAccountId || "");

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
      visible: eventToClone.visible ? "true" : "false",
      autoPromote: false,
      bankAccountId: eventToClone.bankAccountId || "",
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
      formData.append("visible", duplicateFormData.visible);
      formData.append("autoPromote", duplicateFormData.autoPromote.toString());
      formData.append("bankAccountId", duplicateFormData.bankAccountId || "");

      duplicateEventMutation(formData);
      setShowDuplicateModal(false);
    } catch (error) {
      console.error("Error duplicating event:", error);
    }
  }

  function handleFormChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    formType: "duplicate" | "edit",
  ) {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    const { name } = target;
    
    if (formType === "duplicate") {
      setDuplicateFormData((prev) => ({ 
        ...prev, 
        [name]: name === "autoPromote" 
          ? (target as HTMLInputElement).checked ?? false 
          : name === "visible" 
          ? target.value 
          : target.value
      }));
    } else {
      setEditFormData((prev) => ({ 
        ...prev, 
        [name]: name === "autoPromote" 
          ? (target as HTMLInputElement).checked ?? false 
          : name === "visible" 
          ? target.value 
          : target.value
      }));
    }
  }

  async function handleDelete(id: string) {
    setEventToDelete(id);
    setDeleteError(null);
    setShowDeleteModal(true);
  }

  async function confirmDelete() {
    if (eventToDelete) {
      try {
        deleteEventMutation(eventToDelete, {
          onSuccess: (data: any) => {
            if (data && data.error) {
              setDeleteError(data.error);
            } else {
              setShowDeleteModal(false);
              setEventToDelete(null);
              setDeleteError(null);
            }
          },
          onError: () => {
            setDeleteError("Failed to delete event. Please try again.");
          },
        });
      } catch (error) {
        setDeleteError("An unexpected error occurred. Please try again.");
      }
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
        <div className="space-y-2 sm:hidden">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-gray-200 bg-white p-2 shadow"
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
                  <td className="px-4 py-2 sm:px-6 sm:py-4">
                    <div className="flex flex-col">
                      <span className="whitespace-nowrap font-medium text-gray-900">
                        {event.title}
                      </span>
                    </div>
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
                    <Link
                      href={`/admin/events/${event.id}/${event.id}/registrations`}
                      className="font-medium text-blue-600 hover:text-blue-900"
                    >
                      {event._count?.Registration || 0}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
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
        <div className="space-y-2 sm:hidden">
          {sortedEvents.map((event) => (
            <div
              key={event.id}
              className={`rounded-lg border border-gray-200 bg-white p-2 shadow sm:p-4 ${
                new Date(event.to) < new Date() ? "bg-gray-50" : ""
              }`}
            >
              <div className="mb-2">
                <div className="flex min-w-0 items-center justify-between">
                  <h3 className="truncate font-medium">{event.title}</h3>
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
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-3xl font-bold">Event Management</h1>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showPastEvents"
              checked={showPastEvents}
              onChange={(e) => setShowPastEvents(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="showPastEvents"
              className="text-sm font-medium text-gray-700"
            >
              Show past events
            </label>
          </div>
          <div className="flex items-center gap-2">
            <label
              htmlFor="sortOrder"
              className="text-sm font-medium text-gray-700"
            >
              Sort by date:
            </label>
            <select
              id="sortOrder"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
              className="rounded-md border-gray-300 py-1 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            >
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>
          </div>
          <Link
            href="/admin/events/new"
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Create New Event
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="mt-6 rounded-md bg-white p-4 shadow-sm">
          <p className="text-center text-gray-500">Loading events...</p>
        </div>
      ) : error ? (
        <div className="mt-6 rounded-md bg-red-50 p-4 shadow-sm">
          <p className="text-center text-red-500">{error}</p>
        </div>
      ) : sortedEvents.length === 0 ? (
        <div className="mt-6 rounded-md bg-white p-8 text-center shadow-sm">
          <p className="text-gray-500">
            {showPastEvents
              ? "No events found"
              : "No upcoming events found. Try showing past events."}
          </p>
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6 sm:py-3"
                  >
                    Event
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6 sm:py-3"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6 sm:py-3"
                  >
                    Time
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6 sm:py-3"
                  >
                    Price
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6 sm:py-3"
                  >
                    Registrations
                  </th>
                  <th
                    scope="col"
                    className="relative px-3 py-2 sm:px-6 sm:py-3"
                  >
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {sortedEvents.map((event) => (
                  <tr key={event.id}>
                    <td className="px-3 py-2 sm:px-6 sm:py-4">
                      <div className="flex flex-col">
                        <span className="whitespace-nowrap font-medium text-gray-900">
                          {event.title}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500 sm:px-6 sm:py-4">
                      {formatDateTime(new Date(event.from))}
                    </td>
                    <td className="px-3 py-2 text-sm sm:px-6 sm:py-4">
                      {formatDateTime(new Date(event.from)).split(" - ")[1]}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500 sm:px-6 sm:py-4">
                      {event.price ? `CZK ${event.price}` : "Free"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500 sm:px-6 sm:py-4">
                      <Link
                        href={`/admin/events/${event.id}/${event.id}/registrations`}
                        className="font-medium text-blue-600 hover:text-blue-900"
                      >
                        {event._count?.Registration || 0}
                      </Link>
                    </td>
                    <td className="flex space-x-2 px-3 py-2 text-right text-sm font-medium sm:px-6 sm:py-4">
                      <Link
                        href={`/admin/events/${event.id}/${event.id}/registrations`}
                        className="inline-flex items-center rounded-md bg-purple-600 px-3 py-1 text-xs font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="mr-1 h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906zm6.5 0A5.973 5.973 0 0010 15v3h6v-3a5.973 5.973 0 00-.75-2.906A3.001 3.001 0 0111.25 12.094z" />
                        </svg>
                        Participants
                      </Link>
                      <Button
                        variant="edit"
                        onClick={() => handleEdit(event.id)}
                        size="sm"
                        className="flex items-center"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="mr-1 h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                        Edit
                      </Button>
                      <Button
                        variant="duplicate"
                        onClick={() => handleDuplicate(event.id)}
                        size="sm"
                        className="flex items-center"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="mr-1 h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
                          <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" />
                        </svg>
                        Duplicate
                      </Button>
                      <Button
                        variant="delete"
                        onClick={() => handleDelete(event.id)}
                        size="sm"
                        className="flex items-center"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="mr-1 h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
                    value={duplicateFormData.visible}
                    onChange={(e) => handleFormChange(e, "duplicate")}
                    className="w-full rounded-md border border-gray-300 p-2"
                  >
                    <option value="true">Visible</option>
                    <option value="false">Hidden</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="duplicateAutoPromote"
                  name="autoPromote"
                  checked={duplicateFormData.autoPromote}
                  onChange={(e) => handleFormChange(e, "duplicate")}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="duplicateAutoPromote" className="text-sm font-medium text-gray-700">
                  Auto-promote from waiting list (default: off)
                </label>
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

              {/* Bank Account Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bank Account for Payment QR Code
                  <span className="block text-xs text-gray-500 font-normal">
                    This account will be used for generating the payment QR code for this event.
                  </span>
                </label>
                <BankAccountSelector
                  selectedAccountId={duplicateFormData.bankAccountId || ""}
                  onAccountChange={(id) => setDuplicateFormData((prev) => ({ ...prev, bankAccountId: id }))}
                />
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
                    value={editFormData.visible}
                    onChange={(e) => handleFormChange(e, "edit")}
                    className="w-full rounded-md border border-gray-300 p-2"
                  >
                    <option value="true">Visible</option>
                    <option value="false">Hidden</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="editAutoPromote"
                  name="autoPromote"
                  checked={editFormData.autoPromote}
                  onChange={(e) => handleFormChange(e, "edit")}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="editAutoPromote" className="text-sm font-medium text-gray-700">
                  Auto-promote from waiting list (default: off)
                </label>
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

              {/* Bank Account Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bank Account for Payment QR Code
                  <span className="block text-xs text-gray-500 font-normal">
                    This account will be used for generating the payment QR code for this event.
                  </span>
                </label>
                <BankAccountSelector
                  selectedAccountId={editFormData.bankAccountId || ""}
                  onAccountChange={(id) => setEditFormData((prev) => ({ ...prev, bankAccountId: id }))}
                />
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

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="mx-auto w-full max-w-md overflow-hidden rounded-lg bg-white shadow-xl">
            <div className="p-6">
              <div className="mb-4 flex items-center">
                <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">
                  Delete Event
                </h3>
              </div>

              {deleteError ? (
                <div className="mb-4 rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{deleteError}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mb-6 text-sm text-gray-500">
                  Are you sure you want to delete this event? This action cannot
                  be undone and all registrations will be affected.
                </p>
              )}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setEventToDelete(null);
                    setDeleteError(null);
                  }}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  {deleteError ? "Close" : "Cancel"}
                </Button>
                {!deleteError && (
                  <Button
                    onClick={confirmDelete}
                    className="w-full bg-red-600 text-white hover:bg-red-700 sm:w-auto"
                  >
                    Delete Event
                  </Button>
                )}
                {deleteError && deleteError.includes("registrations") && (
                  <Button
                    onClick={() => {
                      // Handle hiding the event instead
                      if (eventToDelete) {
                        const eventToHide = events.find(
                          (e) => e.id === eventToDelete,
                        );
                        if (eventToHide) {
                          const formData = new FormData();
                          formData.append("title", eventToHide.title);
                          formData.append(
                            "description",
                            eventToHide.description || "",
                          );
                          formData.append(
                            "price",
                            eventToHide.price.toString(),
                          );
                          formData.append("place", eventToHide.place || "");
                          formData.append(
                            "capacity",
                            (eventToHide.capacity || 0).toString(),
                          );
                          formData.append(
                            "from",
                            new Date(eventToHide.from).toISOString(),
                          );
                          formData.append(
                            "to",
                            new Date(eventToHide.to).toISOString(),
                          );
                          formData.append("visible", "false"); // Set to hidden

                          updateEventMutation({
                            eventId: eventToDelete,
                            formData,
                          });

                          setShowDeleteModal(false);
                          setEventToDelete(null);
                          setDeleteError(null);
                        }
                      }
                    }}
                    className="w-full bg-yellow-600 text-white hover:bg-yellow-700 sm:w-auto"
                  >
                    Hide Event Instead
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
