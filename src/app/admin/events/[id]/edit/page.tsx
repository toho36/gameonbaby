"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";

interface Event {
  id: string;
  title: string;
  description: string | null;
  price: number;
  place: string | null;
  capacity: number;
  from: string;
  to: string;
  visible: boolean;
}

export default function EditEventPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
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
    async function fetchEvent() {
      try {
        const response = await fetch(`/api/admin/events/${params.id}`);
        const data = await response.json();
        if (data.success) {
          setEvent(data.event);
          setFormData({
            title: data.event.title,
            description: data.event.description || "",
            price: data.event.price,
            place: data.event.place || "",
            capacity: data.event.capacity,
            from: data.event.from,
            to: data.event.to,
            visible: data.event.visible,
            manualDateInput: false,
          });
        }
      } catch (error) {
        console.error("Error fetching event:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchEvent();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/admin/events/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        router.push("/admin/events");
      }
    } catch (error) {
      console.error("Error updating event:", error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!event) {
    return <div>Event not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="px-4 py-5 sm:px-6">
            <h1 className="text-lg font-medium leading-6 text-gray-900">
              Edit Event
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 px-4 py-5 sm:p-6">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700"
              >
                Title
              </label>
              <input
                type="text"
                name="title"
                id="title"
                value={formData.title}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Description
              </label>
              <textarea
                name="description"
                id="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-purple-500 focus:ring-purple-500"
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

            <div>
              <label
                htmlFor="place"
                className="block text-sm font-medium text-gray-700"
              >
                Location
              </label>
              <input
                type="text"
                name="place"
                id="place"
                value={formData.place}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="from"
                  className="block text-sm font-medium text-gray-700"
                >
                  Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  name="from"
                  id="from"
                  value={formData.from}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="to"
                  className="block text-sm font-medium text-gray-700"
                >
                  End Date & Time
                </label>
                <input
                  type="datetime-local"
                  name="to"
                  id="to"
                  value={formData.to}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  required
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="visible"
                id="visible"
                checked={formData.visible}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    visible: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <label
                htmlFor="visible"
                className="ml-2 block text-sm text-gray-900"
              >
                Visible to users
              </label>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/events")}
              >
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
