"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "~/shared/components/ui/button";
import { useCreateEvent } from "~/api/events";

export default function CreateEventPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const { mutate: createEventMutation, isPending: submitting } =
    useCreateEvent();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: 0,
    place: "",
    capacity: 0,
    from: "",
    to: "",
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

    try {
      const formData = new FormData(e.currentTarget);

      // Use the mutation instead of server action
      createEventMutation(formData, {
        onSuccess: () => {
          // Navigate back to events page after successful creation
          router.push("/admin/events");
        },
        onError: (error) => {
          setError(error.message || "Failed to create event");
        },
      });
    } catch (error) {
      console.error("Error creating event:", error);
      setError("An error occurred while creating the event");
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
                value={formData.price}
                onChange={handleInputChange}
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
                value={formData.capacity}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                required
                min="0"
              />
            </div>
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

          <div>
            <label
              htmlFor="visible"
              className="block text-sm font-medium text-gray-700"
            >
              Visibility
            </label>
            <select
              name="visible"
              id="visible"
              defaultValue="true"
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="true">Visible</option>
              <option value="false">Hidden</option>
            </select>
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
