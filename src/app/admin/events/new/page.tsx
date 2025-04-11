"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { createEvent } from "~/actions/actions";

export default function CreateEventPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
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

        setLoading(false);
      } catch (error) {
        console.error("Error checking permissions:", error);
        setError("Failed to verify permissions");
        setLoading(false);
      }
    }

    checkPermission();
  }, [router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
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

  if (loading) {
    return <div className="p-8 text-center">Checking permissions...</div>;
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Create New Event</h1>
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
              defaultChecked={true}
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
              {submitting ? "Creating..." : "Create Event"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
