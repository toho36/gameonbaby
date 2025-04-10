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

  function formatDateTime(dateStr: string) {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("cs-CZ", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  }

  async function handleDuplicate(id: string) {
    const result = await duplicateEvent(id);
    if (result.success) {
      fetchEvents();
    } else {
      setError(result.error || "Failed to duplicate event");
    }
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

  if (loading) {
    return <div className="p-8 text-center">Loading events...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Event Management</h1>
        <div className="flex space-x-4">
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
          <Link href="/admin">
            <Button variant="outline">User Management</Button>
          </Link>
          <Link href="/admin/events/new">
            <Button>Create New Event</Button>
          </Link>
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-600">No events found</p>
          <Link href="/admin/events/new" className="mt-4 inline-block">
            <Button>Create Your First Event</Button>
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                <th className="px-6 py-3">Title</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Time</th>
                <th className="px-6 py-3">Price</th>
                <th className="px-6 py-3">Visibility</th>
                <th className="px-6 py-3">Registrations</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredEvents.map((event) => (
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
                    {formatDateTime(event.from).split(",")[0]}
                  </td>
                  <td className="px-6 py-4">
                    {formatDateTime(event.from).split(",")[1]} -
                    {formatDateTime(event.to).split(",")[1]}
                  </td>
                  <td className="px-6 py-4">{event.price} Kč</td>
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
                        <Button variant="outline" className="px-2 py-1 text-xs">
                          View Registrations
                        </Button>
                      </Link>
                      <Link href={`/admin/events/${event.id}/edit`}>
                        <Button variant="outline" className="px-2 py-1 text-xs">
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
                        variant="destructive"
                        className="px-2 py-1 text-xs"
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
      )}
    </div>
  );
}
