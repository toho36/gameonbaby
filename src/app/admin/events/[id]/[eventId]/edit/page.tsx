"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "~/shared/components/ui/button";
import { updateEvent } from "~/actions/actions";

interface EventData {
  id: string;
  title: string;
  description: string | null;
  price: number;
  place: string | null;
  visible: boolean;
  capacity: number;
}

export default function EditEventPage({ params }: { params: { id: string } }) {
  const [event, setEvent] = useState<Omit<EventData, "from" | "to"> | null>(
    null,
  );
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

        // Update the main event state (excluding dates)
        const { from, to, ...restOfEventData } = eventData.event;
        setEvent({
          ...restOfEventData,
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);

      const result = await updateEvent(params.id, formData);

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

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
            <div>
              <label
                htmlFor="capacity"
                className="mb-1 block text-sm font-medium"
              >
                Capacity
              </label>
              <input
                type="number"
                id="capacity"
                name="capacity"
                defaultValue={event.capacity}
                min="0"
                className="w-full rounded-md border border-gray-300 px-4 py-2"
                placeholder="Enter maximum capacity (optional)"
              />
            </div>
          </div>

          <div>
            <label htmlFor="place" className="mb-1 block text-sm font-medium">
              Place/Address
            </label>
            <input
              type="text"
              id="place"
              name="place"
              defaultValue={event.place || ""}
              className="w-full rounded-md border border-gray-300 px-4 py-2"
              placeholder="e.g., Sportovní hala TJ JM Chodov, Mírového hnutí 2137"
            />
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
