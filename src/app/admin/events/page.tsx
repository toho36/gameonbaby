"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "~/components/ui/button";

interface Event {
  id: string;
  price: number;
  from: string;
  to: string;
  created_at: string;
  registrationCount: number;
}

export default function EventManagement() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function checkPermission() {
      try {
        const response = await fetch("/api/admin/check");
        const data = await response.json();

        if (!data.isAdmin) {
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
          <Link href="/admin">
            <Button variant="outline">User Management</Button>
          </Link>
          <Link href="/admin/events/new">
            <Button>Create New Event</Button>
          </Link>
        </div>
      </div>

      {events.length === 0 ? (
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
                <th className="px-6 py-3">Event Date</th>
                <th className="px-6 py-3">Time</th>
                <th className="px-6 py-3">Price</th>
                <th className="px-6 py-3">Registrations</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {formatDateTime(event.from).split(",")[0]}
                  </td>
                  <td className="px-6 py-4">
                    {formatDateTime(event.from).split(",")[1]} -
                    {formatDateTime(event.to).split(",")[1]}
                  </td>
                  <td className="px-6 py-4">{event.price} Kč</td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-sm font-medium text-blue-800">
                      {event.registrationCount}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <Link href={`/admin/events/${event.id}/registrations`}>
                        <Button variant="outline" className="px-2 py-1 text-xs">
                          View Registrations
                        </Button>
                      </Link>
                      <Link href={`/admin/events/${event.id}`}>
                        <Button variant="outline" className="px-2 py-1 text-xs">
                          Edit
                        </Button>
                      </Link>
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
