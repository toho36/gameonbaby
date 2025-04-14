"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import useRegistrationStore, { Registration } from "~/stores/registrationStore";
import {
  useRegistrations,
  useUpdateRegistration,
  useDeleteRegistration,
} from "~/api/registrations";
import { toast } from "react-hot-toast";
import { duplicateRegistration } from "./duplicateHelper";
import AddParticipantButton from "~/components/AddParticipantButton";
import {
  EditButton,
  DeleteButton,
  DuplicateButton,
} from "~/components/ActionButtons";

interface Event {
  id: string;
  title: string;
  price: number;
  from: string;
  to: string;
  created_at: string;
}

interface RegistrationSummary {
  total: number;
  paid: number;
  attended: number;
}

export default function EventRegistrationsPage({
  params,
}: {
  params: { id: string; eventId: string };
}) {
  const registrations = useRegistrationStore((state) => state.registrations);
  const loading = useRegistrationStore((state) => state.loading);
  const error = useRegistrationStore((state) => state.error);
  const compactView = useRegistrationStore((state) => state.compactView);
  const setCompactView = useRegistrationStore((state) => state.setCompactView);

  const [event, setEvent] = useState<Event | null>(null);
  const [eventLoading, setEventLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [lastArrivedId, setLastArrivedId] = useState<string | null>(null);
  const router = useRouter();

  const [summary, setSummary] = useState<RegistrationSummary>({
    total: 0,
    paid: 0,
    attended: 0,
  });

  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<"add" | "edit">("add");
  const [currentRegistration, setCurrentRegistration] =
    useState<Registration | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    paymentType: "CASH",
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [registrationToDelete, setRegistrationToDelete] = useState<
    string | null
  >(null);

  // React Query hooks - ensure it uses proper event ID
  const { refetch, isLoading: registrationsLoading } = useRegistrations(
    params.eventId,
  );
  const { mutate: updateRegistration } = useUpdateRegistration();
  const { mutate: deleteRegistration } = useDeleteRegistration();

  // Force update registrations when the page loads
  useEffect(() => {
    if (params.eventId) {
      refetch();
    }
  }, [params.eventId, refetch]);

  // Update summary whenever registrations change
  useEffect(() => {
    setSummary({
      total: registrations.length,
      paid: registrations.filter((reg) => reg.status === "PAID").length,
      attended: registrations.filter((reg) => reg.attended).length,
    });
  }, [registrations]);

  // Handle successful registration updates
  const handleStatusUpdate = useCallback(
    (registrationId: string, updates: Partial<Registration>) => {
      setProcessing(null);

      // Optimistic UI update can be removed as React Query will handle refetching
      // However, we might want to keep lastArrivedId for highlighting
      if (updates.attended && updates.attended === true) {
        setLastArrivedId(registrationId);
      }
    },
    [],
  );

  // Clear the lastArrivedId after 60 seconds
  useEffect(() => {
    if (lastArrivedId) {
      const timer = setTimeout(() => {
        setLastArrivedId(null);
      }, 60000); // 60 seconds = 1 minute

      return () => clearTimeout(timer);
    }
  }, [lastArrivedId]);

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

  // Load event data separately from registrations
  useEffect(() => {
    async function loadEventData() {
      setEventLoading(true);
      try {
        const response = await fetch(`/api/admin/events/${params.eventId}`);
        const data = await response.json();
        if (data.success) {
          setEvent(data.event);
        } else {
          console.error("Error loading event:", data.message);
        }
      } catch (error) {
        console.error("Error loading event:", error);
      } finally {
        setEventLoading(false);
      }
    }

    if (params.eventId) {
      loadEventData();
    }
  }, [params.eventId]);

  async function togglePaymentStatus(registrationId: string) {
    try {
      setProcessing("payment" + registrationId);
      const registration = registrations.find((r) => r.id === registrationId);
      if (!registration) return;

      const newStatus = registration.status === "PAID" ? "UNPAID" : "PAID";

      updateRegistration(
        {
          registrationId,
          updates: {
            status: newStatus,
          },
        },
        {
          onSuccess: () =>
            handleStatusUpdate(registrationId, { status: newStatus }),
          onError: (error) => {
            console.error("Error toggling payment status:", error);
            toast.error(
              error instanceof Error
                ? error.message
                : "Failed to update payment status",
            );
            setProcessing(null);
          },
        },
      );
    } catch (error) {
      console.error("Error toggling payment status:", error);
      toast.error("Failed to update payment status");
      setProcessing(null);
    }
  }

  async function toggleAttendance(registrationId: string) {
    try {
      setProcessing("attendance" + registrationId);
      const registration = registrations.find((r) => r.id === registrationId);
      if (!registration) return;

      const newAttendedStatus = !registration.attended;

      updateRegistration(
        {
          registrationId,
          updates: {
            attended: newAttendedStatus,
          },
        },
        {
          onSuccess: () =>
            handleStatusUpdate(registrationId, { attended: newAttendedStatus }),
          onError: (error) => {
            console.error("Error toggling attendance:", error);
            toast.error(
              error instanceof Error
                ? error.message
                : "Failed to update attendance",
            );
            setProcessing(null);
          },
        },
      );
    } catch (error) {
      console.error("Error toggling attendance:", error);
      toast.error("Failed to update attendance");
      setProcessing(null);
    }
  }

  function handleDeleteClick(registrationId: string) {
    setRegistrationToDelete(registrationId);
    setShowDeleteModal(true);
  }

  async function confirmDelete() {
    if (registrationToDelete) {
      const id = registrationToDelete;
      setProcessing("delete" + id);

      deleteRegistration(id, {
        onSuccess: () => {
          setShowDeleteModal(false);
          setRegistrationToDelete(null);
          setProcessing(null);
          toast.success("Registration deleted successfully");
        },
        onError: (error) => {
          console.error("Error deleting registration:", error);
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to delete registration",
          );
          setProcessing(null);
        },
      });
    }
  }

  function formatDateTime(dateStr: string) {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    }).format(date);
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  // Add a function to handle editing a registration
  function handleEditClick(registration: Registration) {
    setCurrentRegistration(registration);
    setFormData({
      firstName: registration.user?.name?.split(" ")[0] || "",
      lastName: registration.user?.name?.split(" ").slice(1).join(" ") || "",
      email: registration.user?.email || "",
      phoneNumber: registration.user?.phone || "",
      paymentType: registration.paymentMethod || "CASH",
    });
    setFormType("edit");
    setShowForm(true);
  }

  // Add a function to duplicate a registration
  async function handleDuplicateRegistration(registration: Registration) {
    await duplicateRegistration(
      registration,
      params.eventId,
      setProcessing,
      refetch,
    );
  }

  // Add a sorted version of registrations
  const sortedRegistrations = [...registrations].sort((a, b) => {
    // Sort by attended status (not attended first)
    if (a.attended !== b.attended) {
      return a.attended ? 1 : -1;
    }
    // Then sort by payment status (unpaid first)
    if (a.status !== b.status) {
      return a.status === "PAID" ? 1 : -1;
    }
    // Finally sort by creation date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Handle form submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing("form");

    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();

      if (formType === "add") {
        // Call API to add new participant
        const response = await fetch(`/api/admin/registrations/add`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            eventId: params.eventId,
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phoneNumber: formData.phoneNumber,
            paymentType: formData.paymentType,
          }),
        });

        const data = await response.json();

        if (data.success) {
          // Refresh the registration list
          refetch();
          setShowForm(false);
          setFormData({
            firstName: "",
            lastName: "",
            email: "",
            phoneNumber: "",
            paymentType: "CASH",
          });
          toast.success("Participant added successfully");
        } else {
          toast.error(data.message || "Failed to add participant");
        }
      } else if (formType === "edit" && currentRegistration) {
        // Call API to update participant
        // First update the user information
        const response = await fetch(`/api/admin/users/update-user`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: currentRegistration.userId,
            name: fullName,
            email: formData.email,
            phoneNumber: formData.phoneNumber,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update user information");
        }

        // Then update the registration payment method
        updateRegistration(
          {
            registrationId: currentRegistration.id,
            updates: {
              paymentMethod: formData.paymentType,
            },
          },
          {
            onSuccess: () => {
              refetch();
              setShowForm(false);
              setCurrentRegistration(null);
            },
            onError: (error) => {
              console.error("Error updating participant:", error);
              toast.error("Failed to update participant");
            },
          },
        );
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "An error occurred. Please try again.",
      );
    } finally {
      setProcessing(null);
    }
  };

  if (loading || registrationsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <div className="h-8 w-64 animate-pulse rounded bg-gray-200"></div>
            <div className="mt-2 h-5 w-80 animate-pulse rounded bg-gray-200"></div>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="h-10 w-40 animate-pulse rounded bg-gray-200"></div>
            <div className="h-10 w-40 animate-pulse rounded bg-gray-200"></div>
            <div className="h-10 w-40 animate-pulse rounded bg-gray-200"></div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-3 rounded-lg border border-gray-200 bg-white p-4">
          <div className="rounded-lg bg-gray-100 p-3 text-center">
            <div className="mx-auto h-8 w-8 animate-pulse rounded-full bg-gray-300"></div>
            <div className="mx-auto mt-2 h-4 w-24 animate-pulse rounded bg-gray-300"></div>
          </div>
          <div className="rounded-lg bg-gray-100 p-3 text-center">
            <div className="mx-auto h-8 w-8 animate-pulse rounded-full bg-gray-300"></div>
            <div className="mx-auto mt-2 h-4 w-16 animate-pulse rounded bg-gray-300"></div>
          </div>
          <div className="rounded-lg bg-gray-100 p-3 text-center">
            <div className="mx-auto h-8 w-8 animate-pulse rounded-full bg-gray-300"></div>
            <div className="mx-auto mt-2 h-4 w-20 animate-pulse rounded bg-gray-300"></div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="hidden w-full table-auto sm:table">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                <th className="px-6 py-3">Participant</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4">
                    <div className="h-5 w-32 animate-pulse rounded bg-gray-200"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-6 w-20 animate-pulse rounded bg-gray-200"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <div className="h-8 w-16 animate-pulse rounded bg-gray-200"></div>
                      <div className="h-8 w-16 animate-pulse rounded bg-gray-200"></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="divide-y divide-gray-200 sm:hidden">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="h-5 w-32 animate-pulse rounded bg-gray-200"></div>
                  <div className="flex gap-1">
                    <div className="h-7 w-7 animate-pulse rounded-full bg-gray-200"></div>
                    <div className="h-7 w-7 animate-pulse rounded-full bg-gray-200"></div>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  <div className="h-5 w-16 animate-pulse rounded-full bg-gray-200"></div>
                  <div className="h-5 w-16 animate-pulse rounded-full bg-gray-200"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {event ? `Event Registrations - ${event.title}` : "Loading..."}
          </h1>
          {event && !eventLoading ? (
            <p className="mt-2 text-gray-600">
              <span className="font-semibold">{event.title}</span> |
              {formatDateTime(event.from).split(",")[0]} |
              {formatDateTime(event.from).split(",")[1]} -
              {formatDateTime(event.to).split(",")[1]} |{event.price} Kč
            </p>
          ) : eventLoading ? (
            <p className="mt-2 text-gray-600">
              <span className="inline-block h-4 w-40 animate-pulse rounded bg-gray-200 align-middle"></span>{" "}
              |
              <span className="ml-1 mr-1 inline-block h-4 w-24 animate-pulse rounded bg-gray-200 align-middle"></span>{" "}
              |
              <span className="inline-block h-4 w-32 animate-pulse rounded bg-gray-200 align-middle"></span>
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <AddParticipantButton
            onClick={() => setShowForm(true)}
            className="w-full sm:w-auto"
          />
          <Button
            variant="outline"
            onClick={() => setCompactView(!compactView)}
            className="w-full sm:w-auto"
          >
            {compactView ? "Show Details" : "Compact View"}
          </Button>
          <Link
            href={`/admin/events`}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <svg
              className="-ml-1 mr-2 h-5 w-5 text-gray-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Back to Events
          </Link>
          <Link
            href={`/admin/events/${params.id}/waitinglist`}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <svg
              className="-ml-1 mr-2 h-5 w-5 text-gray-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            View Waiting List
          </Link>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <div className="rounded-lg bg-blue-50 p-3 text-center">
          <span className="block text-2xl font-bold text-blue-700">
            {summary.total}
          </span>
          <span className="text-xs text-blue-600 sm:text-sm">
            <span className="hidden sm:inline">Total </span>Registrations
          </span>
        </div>
        <div className="rounded-lg bg-green-50 p-3 text-center">
          <span className="block text-2xl font-bold text-green-700">
            {summary.paid}
          </span>
          <span className="text-xs text-green-600 sm:text-sm">Paid</span>
        </div>
        <div className="rounded-lg bg-purple-50 p-3 text-center">
          <span className="block text-2xl font-bold text-purple-700">
            {summary.attended}
          </span>
          <span className="text-xs text-purple-600 sm:text-sm">Attended</span>
        </div>
      </div>

      {showForm && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
          <h2 className="mb-4 text-xl font-semibold">
            {formType === "add" ? "Add New Participant" : "Edit Participant"}
          </h2>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  First Name*
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  required
                  className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Email*
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, phoneNumber: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Payment Type*
              </label>
              <select
                name="paymentType"
                value={formData.paymentType}
                onChange={(e) =>
                  setFormData({ ...formData, paymentType: e.target.value })
                }
                required
                className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="CASH">Cash</option>
                <option value="CARD">Card (QR)</option>
              </select>
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setCurrentRegistration(null);
                }}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={processing === "form"}
                className="w-full sm:w-auto"
              >
                {processing === "form"
                  ? "Processing..."
                  : formType === "add"
                    ? "Add Participant"
                    : "Update Participant"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-lg font-medium text-gray-900">
              Confirm Deletion
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to delete this registration? This action
              cannot be undone.
            </p>
            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setRegistrationToDelete(null);
                }}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="delete"
                onClick={confirmDelete}
                disabled={processing === "delete" + registrationToDelete}
                className="w-full sm:w-auto"
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
                {processing === "delete" + registrationToDelete
                  ? "Deleting..."
                  : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-red-700">
          <p>{error}</p>
          <Button onClick={() => refetch()} className="mt-2" variant="outline">
            Try Again
          </Button>
        </div>
      ) : registrations.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-600">No registrations found for this event</p>
          <AddParticipantButton
            isFirst
            onClick={() => setShowForm(true)}
            className="mt-4"
          />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="hidden w-full table-auto sm:table">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                <th className="px-6 py-3">Participant</th>
                {!compactView && <th className="px-6 py-3">Email</th>}
                {!compactView && <th className="px-6 py-3">Phone</th>}
                {!compactView && <th className="px-6 py-3">Payment</th>}
                {!compactView && <th className="px-6 py-3">Attendance</th>}
                {compactView && <th className="px-6 py-3">Status</th>}
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedRegistrations.map((registration: Registration) => (
                <tr
                  key={registration.id}
                  className={`hover:bg-gray-50 ${registration.id === lastArrivedId ? "bg-purple-50" : ""}`}
                >
                  <td className="max-w-[200px] px-6 py-4">
                    <div
                      className="truncate font-medium"
                      title={registration.user?.name || "No name"}
                    >
                      {registration.user?.name || "No name"}
                      {registration.id === lastArrivedId && (
                        <span className="ml-2 text-xs text-purple-600">
                          (recently marked)
                        </span>
                      )}
                    </div>
                  </td>

                  {!compactView && (
                    <td className="max-w-[200px] px-6 py-4">
                      <div
                        className="truncate"
                        title={registration.user?.email || "No email"}
                      >
                        {registration.user?.email || "No email"}
                      </div>
                    </td>
                  )}

                  {!compactView && (
                    <td className="max-w-[150px] px-6 py-4">
                      <div
                        className="truncate"
                        title={registration.user?.phone || "No phone"}
                      >
                        {registration.user?.phone || "No phone"}
                      </div>
                    </td>
                  )}

                  {!compactView && (
                    <td className="px-6 py-4">
                      <Button
                        variant="outline"
                        onClick={() => togglePaymentStatus(registration.id)}
                        disabled={processing === "payment" + registration.id}
                        className={`px-3 py-1 text-xs ${
                          registration.status === "PAID"
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                        }`}
                      >
                        {processing === "payment" + registration.id
                          ? "Processing..."
                          : registration.status === "PAID"
                            ? "✓ Paid"
                            : "⚠ Pending"}
                      </Button>
                    </td>
                  )}

                  {!compactView && (
                    <td className="px-6 py-4">
                      <Button
                        variant="outline"
                        onClick={() => toggleAttendance(registration.id)}
                        disabled={processing === "attendance" + registration.id}
                        className={`px-3 py-1 text-xs ${
                          registration.attended
                            ? "bg-purple-100 text-purple-800 hover:bg-purple-200"
                            : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                        }`}
                      >
                        {processing === "attendance" + registration.id
                          ? "Processing..."
                          : registration.attended
                            ? "✓ Arrived"
                            : "◯ Not arrived"}
                      </Button>
                    </td>
                  )}

                  {compactView && (
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <span
                          className={`inline-flex cursor-pointer items-center rounded-full px-2 py-0.5 text-xs ${
                            registration.status === "PAID"
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                          }`}
                          onClick={() => togglePaymentStatus(registration.id)}
                        >
                          {processing === "payment" + registration.id
                            ? "..."
                            : registration.status === "PAID"
                              ? "Paid"
                              : "Pending"}
                        </span>
                        <span
                          className={`inline-flex cursor-pointer items-center rounded-full px-2 py-0.5 text-xs ${
                            registration.attended
                              ? "bg-purple-100 text-purple-800 hover:bg-purple-200"
                              : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                          }`}
                          onClick={() => toggleAttendance(registration.id)}
                        >
                          {processing === "attendance" + registration.id
                            ? "..."
                            : registration.attended
                              ? "Arrived"
                              : "Not arrived"}
                        </span>
                      </div>
                    </td>
                  )}

                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="edit"
                        onClick={() => handleEditClick(registration)}
                        className="px-3 py-1 text-xs"
                        size="sm"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="mr-1 h-3 w-3"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                        Edit
                      </Button>
                      {!compactView && (
                        <Button
                          variant="duplicate"
                          onClick={() =>
                            handleDuplicateRegistration(registration)
                          }
                          disabled={
                            processing === "duplicate" + registration.id
                          }
                          className="px-3 py-1 text-xs"
                          size="sm"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="mr-1 h-3 w-3"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
                            <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" />
                          </svg>
                          {processing === "duplicate" + registration.id
                            ? "..."
                            : "Duplicate"}
                        </Button>
                      )}
                      <Button
                        variant="delete"
                        onClick={() => handleDeleteClick(registration.id)}
                        disabled={
                          processing === "payment" + registration.id ||
                          processing === "attendance" + registration.id ||
                          processing === "delete" + registration.id
                        }
                        className="px-3 py-1 text-xs"
                        size="sm"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="mr-1 h-3 w-3"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {processing === "delete" + registration.id
                          ? "..."
                          : "Delete"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="divide-y divide-gray-200 sm:hidden">
            {sortedRegistrations.map((registration: Registration) => (
              <div
                key={registration.id}
                className={`p-3 ${registration.id === lastArrivedId ? "bg-purple-50" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div className="max-w-[75%]">
                    <h3 className="truncate font-medium">
                      {registration.user?.name || "No name"}
                      {registration.id === lastArrivedId && (
                        <span className="ml-2 text-xs text-purple-600">
                          (recent)
                        </span>
                      )}
                    </h3>
                    {!compactView && (
                      <>
                        <p className="truncate text-sm text-gray-500">
                          {registration.user?.email || "No email"}
                        </p>
                        {registration.user?.phone && (
                          <p className="truncate text-sm text-gray-500">
                            {registration.user?.phone}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="edit"
                      onClick={() => handleEditClick(registration)}
                      className="h-7 w-7 rounded-full p-0"
                    >
                      <span className="sr-only">Edit</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                      </svg>
                    </Button>
                    <Button
                      variant="delete"
                      onClick={() => handleDeleteClick(registration.id)}
                      disabled={
                        processing === "payment" + registration.id ||
                        processing === "attendance" + registration.id ||
                        processing === "delete" + registration.id
                      }
                      className="h-7 w-7 rounded-full p-0 text-red-500"
                    >
                      <span className="sr-only">Delete</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                      </svg>
                    </Button>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap gap-1">
                  <span
                    className={`inline-flex cursor-pointer items-center rounded-full px-2 py-0.5 text-xs ${
                      registration.status === "PAID"
                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                        : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                    }`}
                    onClick={() => togglePaymentStatus(registration.id)}
                  >
                    {processing === "payment" + registration.id
                      ? "..."
                      : registration.status === "PAID"
                        ? "Paid"
                        : "Pending"}
                  </span>
                  <span
                    className={`inline-flex cursor-pointer items-center rounded-full px-2 py-0.5 text-xs ${
                      registration.attended
                        ? "bg-purple-100 text-purple-800 hover:bg-purple-200"
                        : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                    }`}
                    onClick={() => toggleAttendance(registration.id)}
                  >
                    {processing === "attendance" + registration.id
                      ? "..."
                      : registration.attended
                        ? "Arrived"
                        : "Not arrived"}
                  </span>
                </div>

                {!compactView && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button
                      variant="edit"
                      onClick={() => handleEditClick(registration)}
                      disabled={processing === "payment" + registration.id}
                      className={`text-xs ${
                        registration.status === "PAID"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {processing === "payment" + registration.id
                        ? "Processing..."
                        : registration.status === "PAID"
                          ? "✓ Paid"
                          : "⚠ Pending"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => toggleAttendance(registration.id)}
                      disabled={processing === "attendance" + registration.id}
                      className={`text-xs ${
                        registration.attended
                          ? "bg-purple-100 text-purple-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {processing === "attendance" + registration.id
                        ? "Processing..."
                        : registration.attended
                          ? "✓ Arrived"
                          : "◯ Not arrived"}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
