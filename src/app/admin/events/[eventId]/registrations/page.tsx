"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "~/components/ui/button";

interface Registration {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  phoneNumber: string | null;
  paymentType: string;
  createdAt: string;
  paid: boolean;
}

interface Event {
  id: string;
  price: number;
  from: string;
  to: string;
  created_at: string;
}

export default function RegistrationManagement({
  params,
}: {
  params: { eventId: string };
}) {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
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

        fetchRegistrations();
      } catch (error) {
        console.error("Error checking permissions:", error);
        setError("Failed to verify permissions");
        setLoading(false);
      }
    }

    checkPermission();
  }, [router, params.eventId]);

  async function fetchRegistrations() {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/events/${params.eventId}/registrations`,
      );
      const data = await response.json();

      if (data.success) {
        setRegistrations(data.registrations);
        setEvent(data.event);
      } else {
        setError(data.message || "Failed to load registrations");
      }
    } catch (error) {
      console.error("Error fetching registrations:", error);
      setError("Failed to load registrations");
    } finally {
      setLoading(false);
    }
  }

  async function markAsPaid(registrationId: string) {
    try {
      setProcessing(registrationId);
      const response = await fetch("/api/admin/registrations/mark-paid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ registrationId }),
      });

      const data = await response.json();

      if (data.success) {
        setRegistrations(
          registrations.map((reg) =>
            reg.id === registrationId ? { ...reg, paid: true } : reg,
          ),
        );
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error("Error marking registration as paid:", error);
      alert("Failed to mark registration as paid");
    } finally {
      setProcessing(null);
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
    return <div className="p-8 text-center">Loading registrations...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Event Registrations</h1>
          {event && (
            <p className="mt-2 text-gray-600">
              {formatDateTime(event.from).split(",")[0]} |
              {formatDateTime(event.from).split(",")[1]} -
              {formatDateTime(event.to).split(",")[1]} |{event.price} Kč
            </p>
          )}
        </div>
        <div className="flex space-x-2">
          <Link href="/admin/events">
            <Button variant="outline">Back to Events</Button>
          </Link>
          <Link href={`/admin/events/${params.eventId}`}>
            <Button variant="outline">Edit Event</Button>
          </Link>
        </div>
      </div>

      {registrations.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-600">No registrations found for this event</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3">Payment</th>
                <th className="px-6 py-3">Registration Date</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {registrations.map((registration) => (
                <tr key={registration.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {registration.firstName} {registration.lastName}
                  </td>
                  <td className="px-6 py-4">{registration.email}</td>
                  <td className="px-6 py-4">
                    {registration.phoneNumber || "N/A"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm">
                        {registration.paymentType}
                      </span>
                      <span
                        className={`mt-1 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          registration.paid
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {registration.paid ? "Paid" : "Pending"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {formatDateTime(registration.createdAt)}
                  </td>
                  <td className="px-6 py-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (!registration.paid) {
                          markAsPaid(registration.id);
                        }
                      }}
                      disabled={
                        registration.paid || processing === registration.id
                      }
                    >
                      {processing === registration.id
                        ? "Processing..."
                        : registration.paid
                          ? "Paid"
                          : "Mark as Paid"}
                    </Button>
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
