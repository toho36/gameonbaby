"use client";

import { useState, useEffect, useCallback } from "react";
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
  attended: boolean;
}

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
  params: { id: string };
}) {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [compactView, setCompactView] = useState(true);
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

  const fetchRegistrations = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/admin/events/${params.id}/registrations`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch registrations");
      }
      const data = await response.json();
      setRegistrations(data.registrations);
      if (data.event) {
        setEvent(data.event);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  // Refresh data when user returns to the page
  useEffect(() => {
    const handleFocus = () => {
      fetchRegistrations();
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchRegistrations]);

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

        fetchRegistrations();
      } catch (error) {
        console.error("Error checking permissions:", error);
        setError("Failed to verify permissions");
        setLoading(false);
      }
    }

    checkPermission();
  }, [router, params.id]);

  useEffect(() => {
    setSummary({
      total: registrations.length,
      paid: registrations.filter((reg) => reg.paid).length,
      attended: registrations.filter((reg) => reg.attended).length,
    });
  }, [registrations]);

  async function togglePaymentStatus(registrationId: string) {
    try {
      setProcessing("payment" + registrationId);
      const registration = registrations.find((r) => r.id === registrationId);
      if (!registration) return;

      const newPaidStatus = !registration.paid;

      const response = await fetch("/api/admin/registrations/toggle-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          registrationId,
          paid: newPaidStatus,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update the local state first for immediate UI feedback
        setRegistrations(
          registrations.map((reg) =>
            reg.id === registrationId ? { ...reg, paid: newPaidStatus } : reg,
          ),
        );

        // Then refresh data from the server to ensure consistency
        await fetchRegistrations();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error("Error toggling payment status:", error);
      alert("Failed to update payment status");
    } finally {
      setProcessing(null);
    }
  }

  async function toggleAttendance(registrationId: string) {
    try {
      setProcessing("attendance" + registrationId);
      const registration = registrations.find((r) => r.id === registrationId);
      if (!registration) return;

      const newAttendedStatus = !registration.attended;

      const response = await fetch(
        "/api/admin/registrations/toggle-attendance",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            registrationId,
            attended: newAttendedStatus,
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        if (newAttendedStatus) {
          setLastArrivedId(registrationId);
        } else if (lastArrivedId === registrationId) {
          setLastArrivedId(null);
        }

        // Update the local state first for immediate UI feedback
        setRegistrations(
          registrations.map((reg) =>
            reg.id === registrationId
              ? { ...reg, attended: newAttendedStatus }
              : reg,
          ),
        );

        // Then refresh data from the server to ensure consistency
        await fetchRegistrations();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error("Error toggling attendance status:", error);
      alert("Failed to update attendance");
    } finally {
      setProcessing(null);
    }
  }

  function handleDeleteClick(registrationId: string) {
    setRegistrationToDelete(registrationId);
    setShowDeleteModal(true);
  }

  async function confirmDelete() {
    if (!registrationToDelete) return;

    try {
      setProcessing("delete" + registrationToDelete);
      const response = await fetch(
        `/api/admin/registrations/${registrationToDelete}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (data.success) {
        setRegistrations(
          registrations.filter((reg) => reg.id !== registrationToDelete),
        );
        setShowDeleteModal(false);
        setRegistrationToDelete(null);
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error("Error deleting registration:", error);
      alert("Failed to delete registration");
    } finally {
      setProcessing(null);
      setShowDeleteModal(false);
    }
  }

  async function duplicateRegistration(registration: Registration) {
    try {
      setProcessing("duplicate" + registration.id);

      // Generate a unique email if none exists
      let email = registration.email;
      if (!email) {
        // Create an email like firstname.lastname.timestamp@noemail.com
        const timestamp = new Date().getTime();
        const baseName = registration.firstName
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "");
        email = `${baseName}.${timestamp}@noemail.com`;
      } else {
        // If email exists, append "_copy" before the @ symbol
        const parts = registration.email.split("@");
        email = `${parts[0]}_copy@${parts[1]}`;
      }

      const response = await fetch("/api/admin/registrations/duplicate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: params.id,
          firstName: registration.firstName,
          lastName: registration.lastName,
          email: email,
          phoneNumber: registration.phoneNumber,
          paymentType: registration.paymentType,
        }),
      });

      const data = await response.json();

      if (data.success) {
        fetchRegistrations();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error("Error duplicating registration:", error);
      alert("Failed to duplicate registration");
    } finally {
      setProcessing(null);
    }
  }

  async function addRegistration(e: React.FormEvent) {
    e.preventDefault();
    try {
      setProcessing("form");

      // Generate a unique email if none provided
      let email = formData.email;
      if (!email) {
        // Create an email like firstname.timestamp@noemail.com
        const timestamp = new Date().getTime();
        const baseName = formData.firstName
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "");
        email = `${baseName}.${timestamp}@noemail.com`;
      }

      const response = await fetch("/api/admin/registrations/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: params.id,
          firstName: formData.firstName,
          lastName: formData.lastName || null,
          email: email,
          phoneNumber: formData.phoneNumber || null,
          paymentType: formData.paymentType,
        }),
      });

      const data = await response.json();

      if (data.success) {
        fetchRegistrations();
        setShowForm(false);
        resetForm();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error("Error adding registration:", error);
      alert("Failed to add registration");
    } finally {
      setProcessing(null);
    }
  }

  async function editRegistration(e: React.FormEvent) {
    e.preventDefault();
    if (!currentRegistration) return;

    try {
      setProcessing("form");
      const response = await fetch(
        `/api/admin/registrations/${currentRegistration.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName || null,
            email: formData.email,
            phoneNumber: formData.phoneNumber || null,
            paymentType: formData.paymentType,
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        fetchRegistrations();
        setShowForm(false);
        resetForm();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error("Error updating registration:", error);
      alert("Failed to update registration");
    } finally {
      setProcessing(null);
    }
  }

  function handleAddClick() {
    setFormType("add");
    resetForm();
    setShowForm(true);
  }

  function handleEditClick(registration: Registration) {
    setFormType("edit");
    setCurrentRegistration(registration);
    setFormData({
      firstName: registration.firstName,
      lastName: registration.lastName || "",
      email: registration.email,
      phoneNumber: registration.phoneNumber || "",
      paymentType: registration.paymentType,
    });
    setShowForm(true);
  }

  function resetForm() {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      paymentType: "CASH",
    });
    setCurrentRegistration(null);
  }

  function handleFormChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  // Format date and time together
  function formatDateTime(dateStr: string) {
    return `${formatDate(dateStr)} at ${formatTime(dateStr)}`;
  }

  // Format a date
  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString("cs-CZ");
  }

  // Format a time
  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("cs-CZ", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Sort registrations: non-arrived first, then last arrived, then the rest
  const sortedRegistrations = [...registrations].sort((a, b) => {
    // Non-arrived people come first
    if (!a.attended && b.attended) return -1;
    if (a.attended && !b.attended) return 1;

    // Then the most recently marked as arrived
    if (a.attended && a.id === lastArrivedId) return -1;
    if (b.attended && b.id === lastArrivedId) return 1;

    // Then sort by creation date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (loading) {
    return <div className="p-8 text-center">Loading registrations...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold">
            Event Registrations {event && `- ${event.title}`}
          </h1>
          {event && (
            <p className="mt-2 text-gray-600">
              <span className="font-semibold">{event.title}</span> |
              {formatDateTime(event.from).split(",")[0]} |
              {formatDateTime(event.from).split(",")[1]} -
              {formatDateTime(event.to).split(",")[1]} |{event.price} Kč
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="default"
            onClick={handleAddClick}
            className="w-full sm:w-auto"
          >
            Add Participant
          </Button>
          <Button
            variant="outline"
            onClick={() => setCompactView(!compactView)}
            className="w-full sm:w-auto"
          >
            {compactView ? "Show Details" : "Compact View"}
          </Button>
          <Link
            href={`/admin/events`}
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
          <span className="text-sm text-blue-600">Total Registrations</span>
        </div>
        <div className="rounded-lg bg-green-50 p-3 text-center">
          <span className="block text-2xl font-bold text-green-700">
            {summary.paid}
          </span>
          <span className="text-sm text-green-600">Paid</span>
        </div>
        <div className="rounded-lg bg-purple-50 p-3 text-center">
          <span className="block text-2xl font-bold text-purple-700">
            {summary.attended}
          </span>
          <span className="text-sm text-purple-600">Attended</span>
        </div>
      </div>

      {showForm && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
          <h2 className="mb-4 text-xl font-semibold">
            {formType === "add" ? "Add New Participant" : "Edit Participant"}
          </h2>
          <form
            onSubmit={formType === "add" ? addRegistration : editRegistration}
            className="space-y-4"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  First Name*
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleFormChange}
                  required
                  className="w-full rounded-md border border-gray-300 p-2"
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
                  onChange={handleFormChange}
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  className="w-full rounded-md border border-gray-300 p-2"
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
                  onChange={handleFormChange}
                  className="w-full rounded-md border border-gray-300 p-2"
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
                onChange={handleFormChange}
                required
                className="w-full rounded-md border border-gray-300 p-2"
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
                  resetForm();
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
                variant="outline"
                onClick={confirmDelete}
                disabled={processing === "delete" + registrationToDelete}
                className="w-full bg-red-100 text-red-700 hover:bg-red-200 sm:w-auto"
              >
                {processing === "delete" + registrationToDelete
                  ? "Deleting..."
                  : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {registrations.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-600">No registrations found for this event</p>
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
              {sortedRegistrations.map((registration) => (
                <tr
                  key={registration.id}
                  className={`hover:bg-gray-50 ${registration.id === lastArrivedId ? "bg-purple-50" : ""}`}
                >
                  <td className="px-6 py-4">
                    <div className="font-medium">
                      {registration.firstName} {registration.lastName}
                      {registration.id === lastArrivedId && (
                        <span className="ml-2 text-xs text-purple-600">
                          (recently marked)
                        </span>
                      )}
                    </div>
                  </td>

                  {!compactView && (
                    <td className="px-6 py-4">{registration.email}</td>
                  )}

                  {!compactView && (
                    <td className="px-6 py-4">{registration.phoneNumber}</td>
                  )}

                  {!compactView && (
                    <td className="px-6 py-4">
                      <Button
                        variant="outline"
                        onClick={() => togglePaymentStatus(registration.id)}
                        disabled={processing === "payment" + registration.id}
                        className={`px-3 py-1 text-xs ${
                          registration.paid
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                        }`}
                      >
                        {processing === "payment" + registration.id
                          ? "Processing..."
                          : registration.paid
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
                            registration.paid
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                          }`}
                          onClick={() => togglePaymentStatus(registration.id)}
                        >
                          {processing === "payment" + registration.id
                            ? "..."
                            : registration.paid
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
                        variant="outline"
                        onClick={() => handleEditClick(registration)}
                        className="px-3 py-1 text-xs"
                      >
                        Edit
                      </Button>
                      {!compactView && (
                        <Button
                          variant="outline"
                          onClick={() => duplicateRegistration(registration)}
                          disabled={
                            processing === "duplicate" + registration.id
                          }
                          className="px-3 py-1 text-xs"
                        >
                          {processing === "duplicate" + registration.id
                            ? "..."
                            : "Duplicate"}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => handleDeleteClick(registration.id)}
                        disabled={
                          processing === "payment" + registration.id ||
                          processing === "attendance" + registration.id
                        }
                        className="px-3 py-1 text-xs text-red-500 hover:bg-red-50 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="divide-y divide-gray-200 sm:hidden">
            {sortedRegistrations.map((registration) => (
              <div
                key={registration.id}
                className={`p-3 ${registration.id === lastArrivedId ? "bg-purple-50" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">
                      {registration.firstName} {registration.lastName}
                      {registration.id === lastArrivedId && (
                        <span className="ml-2 text-xs text-purple-600">
                          (recently marked)
                        </span>
                      )}
                    </h3>
                    {!compactView && (
                      <>
                        <p className="text-sm text-gray-500">
                          {registration.email}
                        </p>
                        {registration.phoneNumber && (
                          <p className="text-sm text-gray-500">
                            {registration.phoneNumber}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex gap-1">
                    <Button
                      variant="outline"
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
                      variant="outline"
                      onClick={() => handleDeleteClick(registration.id)}
                      disabled={
                        processing === "payment" + registration.id ||
                        processing === "attendance" + registration.id
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
                      registration.paid
                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                        : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                    }`}
                    onClick={() => togglePaymentStatus(registration.id)}
                  >
                    {processing === "payment" + registration.id
                      ? "..."
                      : registration.paid
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
                      variant="outline"
                      onClick={() => togglePaymentStatus(registration.id)}
                      disabled={processing === "payment" + registration.id}
                      className={`text-xs ${
                        registration.paid
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {processing === "payment" + registration.id
                        ? "Processing..."
                        : registration.paid
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
