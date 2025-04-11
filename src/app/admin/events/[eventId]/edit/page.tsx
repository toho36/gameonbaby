"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { updateEvent } from "~/actions/actions";

interface EventData {
  id: string;
  title: string;
  description: string | null;
  price: number;
  place: string | null;
  from: string;
  to: string;
  visible: boolean;
}

export default function EditEventPage({
  params,
}: {
  params: { eventId: string };
}) {
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

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
        const eventResponse = await fetch(
          `/api/admin/events/${params.eventId}`,
        );
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
        const fromDate = new Date(eventData.event.from);
        const toDate = new Date(eventData.event.to);

        setEvent({
          ...eventData.event,
          from: formatDateForInput(fromDate),
          to: formatDateForInput(toDate),
          place: eventData.event.place || "",
          description: eventData.event.description || "",
        });
      } catch (error) {
        console.error("Error loading event:", error);
        setError("An error occurred while loading event data");
      } finally {
        setLoading(false);
      }
    }

    checkPermissionAndLoadEvent();
  }, [params.eventId, router]);

  function formatDateForInput(date: Date) {
    // Fix timezone issues by using local timezone format
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);

      // Log the dates for debugging
      console.log("Form from date:", formData.get("from"));
      console.log("Form to date:", formData.get("to"));

      const result = await updateEvent(params.eventId, formData);

      if (result.success) {
        router.push("/admin/events");
      } else {
        setError(result.error || "Failed to update event");
      }
    } catch (error) {
      console.error("Error updating event:", error);
      setError("An error occurred while updating the event");
    } finally {
      setSubmitting(false);
    }
  }

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
        <h1 className="text-2xl font-bold">Edit Event</h1>
        <Link href="/admin/events">
          <Button variant="outline">Back to Events</Button>
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="mb-1 block text-sm font-medium">
              Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              defaultValue={event.title}
              required
              className="w-full rounded-md border border-gray-300 px-4 py-2"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-1 block text-sm font-medium"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              defaultValue={event.description || ""}
              rows={4}
              className="w-full rounded-md border border-gray-300 px-4 py-2"
            />
          </div>

          <div>
            <label htmlFor="place" className="mb-1 block text-sm font-medium">
              Place/Address
            </label>
            <input
              type="text"
              id="place"
              name="place"
              value={event.place || ""}
              onChange={(e) => {
                const newEvent = { ...event, place: e.target.value };
                setEvent(newEvent);
              }}
              className="w-full rounded-md border border-gray-300 px-4 py-2"
              placeholder="e.g., Sportovní hala TJ JM Chodov, Mírového hnutí 2137"
            />
          </div>

          <div>
            <label htmlFor="price" className="mb-1 block text-sm font-medium">
              Price (CZK)
            </label>
            <input
              type="number"
              id="price"
              name="price"
              defaultValue={event.price}
              required
              min="0"
              className="w-full rounded-md border border-gray-300 px-4 py-2"
              placeholder="Enter price in CZK"
            />
          </div>

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

          <div className="flex items-center">
            <input
              type="checkbox"
              id="visible"
              name="visible"
              value="true"
              defaultChecked={event.visible}
              className="h-4 w-4 text-blue-600"
            />
            <label htmlFor="visible" className="ml-2 block text-sm">
              Visible on public pages
            </label>
          </div>

          <div className="flex justify-end space-x-4">
            <Link href="/admin/events">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
