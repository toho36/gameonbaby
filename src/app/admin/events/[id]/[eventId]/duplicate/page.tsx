"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "~/shared/components/ui/button";
import { createEvent } from "~/actions/actions";

interface EventData {
  id: string;
  title: string;
  description: string | null;
  price: number;
  place: string | null;
  from: string;
  to: string;
  visible: boolean;
  capacity: number;
}

export default function DuplicateEventPage({
  params,
}: {
  params: { id: string };
}) {
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const fromInput = formData.get("from") as string;
      const toInput = formData.get("to") as string;

      // Validate date inputs
      if (!fromInput || !toInput) {
        setError("Please select both start and end dates");
        return;
      }

      // Create dates in local timezone
      const fromDate = new Date(fromInput);
      const toDate = new Date(toInput);

      // Validate dates are valid
      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        setError("Invalid date format");
        return;
      }

      formData.set("from", fromDate.toISOString());
      formData.set("to", toDate.toISOString());

      const result = await createEvent(formData);

      if (result.success) {
        router.push("/admin/events");
      } else {
        setError(result.error || "Failed to create event");
      }
    } catch (error) {
      console.error("Error creating event:", error);
      setError("An error occurred while creating the event");
    } finally {
      setSubmitting(false);
    }
  }

  function toISODateTimeString(dateStr: string) {
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

      // Format in local timezone
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

  useEffect(() => {
    async function checkPermissionAndLoadEvent() {
      try {
        // Check permissions
        const permResponse = await fetch("/api/admin/check");
        const permData = await permResponse.json();

        if (!permData.isAdmin && !permData.isModerator) {
          router.push("/dashboard");
          return;
        }

        // Load event data
        const eventResponse = await fetch(`/api/admin/events/${params.id}`);
        if (!eventResponse.ok) {
          setError("Failed to load event data");
          setLoading(false);
          return;
        }

        const eventData = await eventResponse.json();
        if (!eventData.success) {
          setError(eventData.message || "Failed to load event data");
          setLoading(false);
          return;
        }

        // Format dates for input
        const fromFormatted = toISODateTimeString(eventData.event.from);
        const toFormatted = toISODateTimeString(eventData.event.to);

        if (!fromFormatted || !toFormatted) {
          setError("Invalid date format received from server");
          setLoading(false);
          return;
        }

        setEvent({
          ...eventData.event,
          from: fromFormatted,
          to: toFormatted,
          place: eventData.event.place || "",
          description: eventData.event.description || "",
          capacity: eventData.event.capacity || 0,
        });
      } catch (error) {
        console.error("Error loading event:", error);
        setError("An error occurred while loading event data");
      } finally {
        setLoading(false);
      }
    }

    checkPermissionAndLoadEvent();
  }, [params.id, router]);

  if (loading) {
    return <div className="p-8 text-center">Loading event data...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="mb-4 text-red-600">{error}</div>
        <Link href="/admin/events">
          <Button>Back to Events</Button>
        </Link>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-8 text-center">
        <div className="mb-4">Event not found</div>
        <Link href="/admin/events">
          <Button>Back to Events</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Duplicate Event</h1>
        <Link href="/admin/events">
          <Button variant="outline">Back to Events</Button>
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Other form fields */}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="from" className="mb-1 block text-sm font-medium">
                Start Date & Time
              </label>
              <input
                type="datetime-local"
                id="from"
                name="from"
                defaultValue={event.from}
                required
                className="w-full rounded-md border border-gray-300 px-4 py-2"
              />
            </div>

            <div>
              <label htmlFor="to" className="mb-1 block text-sm font-medium">
                End Date & Time
              </label>
              <input
                type="datetime-local"
                id="to"
                name="to"
                defaultValue={event.to}
                required
                className="w-full rounded-md border border-gray-300 px-4 py-2"
              />
            </div>
          </div>

          {/* Rest of the form */}
        </form>
      </div>
    </div>
  );
}
