"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";

interface WaitingListEntry {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  phoneNumber: string | null;
  paymentType: string;
  createdAt: string;
}

interface Event {
  id: string;
  title: string;
  from: string;
  to: string;
  price: number;
}

// Component to display payment type with icon
const PaymentTypeIndicator = ({ type }: { type?: string | null }) => {
  if (!type) return null;

  const isQR = type === "QR" || type === "CARD"; // Support both new and old values

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${isQR ? "bg-blue-100 text-blue-800" : "bg-yellow-100 text-yellow-800"}`}
    >
      {isQR ? (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mr-1 h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
            />
          </svg>
          QR
        </>
      ) : (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mr-1 h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z"
            />
          </svg>
          Cash
        </>
      )}
    </span>
  );
};

export default function WaitingListPage({
  params,
}: {
  params: { id: string };
}) {
  const [event, setEvent] = useState<Event | null>(null);
  const [waitingList, setWaitingList] = useState<WaitingListEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPromoting, setIsPromoting] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const router = useRouter();

  // Format a date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("cs-CZ");
  };

  // Format a time
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("cs-CZ", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format date and time together
  const formatDateTime = (dateStr: string) => {
    return `${formatDate(dateStr)} at ${formatTime(dateStr)}`;
  };

  useEffect(() => {
    fetchWaitingList();
  }, [params.id]);

  const fetchWaitingList = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/admin/events/${params.id}/waitinglist`,
      );
      const data = await response.json();

      if (data.success) {
        setEvent(data.event);
        setWaitingList(data.waitingList);
      } else {
        toast.error("Failed to load waiting list data");
      }
    } catch (error) {
      console.error("Error fetching waiting list:", error);
      toast.error("An error occurred while loading waiting list data");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromote = async (entryId: string) => {
    try {
      setIsPromoting(entryId);
      const response = await fetch(
        `/api/admin/events/${params.id}/waitinglist`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ entryId }),
        },
      );

      const data = await response.json();

      if (data.success) {
        toast.success("User promoted to registered successfully");
        // Refresh the waiting list
        fetchWaitingList();
      } else {
        toast.error(data.message || "Failed to promote user");
      }
    } catch (error) {
      console.error("Error promoting user:", error);
      toast.error("An error occurred while promoting user");
    } finally {
      setIsPromoting(null);
    }
  };

  const handleDelete = async (entryId: string) => {
    if (
      confirm(
        "Are you sure you want to remove this user from the waiting list?",
      )
    ) {
      try {
        setIsDeleting(entryId);
        const response = await fetch(
          `/api/admin/events/${params.id}/waitinglist?entryId=${entryId}`,
          {
            method: "DELETE",
          },
        );

        const data = await response.json();

        if (data.success) {
          toast.success("User removed from waiting list");
          // Refresh the waiting list
          fetchWaitingList();
        } else {
          toast.error(data.message || "Failed to remove user");
        }
      } catch (error) {
        console.error("Error removing user:", error);
        toast.error("An error occurred while removing user");
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const handleAddToWaitingList = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    const phoneNumber = formData.get("phoneNumber") as string;
    const paymentType = formData.get("paymentType") as string;

    if (!firstName || !email) {
      toast.error("First name and email are required");
      return;
    }

    try {
      setIsAddingUser(true);
      const response = await fetch("/api/waitinglist/guest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName: lastName || "",
          email,
          phoneNumber: phoneNumber || "",
          eventId: params.id,
          paymentType,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("User added to the waiting list successfully!");
        setShowAddForm(false);
        form.reset();
        fetchWaitingList();
      } else {
        toast.error(data.message || "Failed to add user to waiting list");
      }
    } catch (error) {
      console.error("Error adding user to waiting list:", error);
      toast.error("An error occurred while adding user to waiting list");
    } finally {
      setIsAddingUser(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-white p-4 shadow-sm sm:p-6">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex flex-col justify-between sm:flex-row sm:items-center">
              <div>
                <div className="h-8 w-64 animate-pulse rounded bg-gray-200"></div>
                <div className="mt-1 h-5 w-80 animate-pulse rounded bg-gray-200"></div>
              </div>
              <div className="mt-4 flex space-x-3 sm:mt-0">
                <div className="h-10 w-32 animate-pulse rounded bg-gray-200"></div>
                <div className="h-10 w-40 animate-pulse rounded bg-gray-200"></div>
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Payment Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Added On
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {[...Array(5)].map((_, i) => (
                      <tr key={i}>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <div className="h-10 w-10 animate-pulse rounded-full bg-indigo-100"></div>
                            </div>
                            <div className="ml-4">
                              <div className="h-5 w-32 animate-pulse rounded bg-gray-200"></div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="h-5 w-48 animate-pulse rounded bg-gray-200"></div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="h-5 w-24 animate-pulse rounded-full bg-gray-200"></div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="h-5 w-32 animate-pulse rounded bg-gray-200"></div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          <div className="flex space-x-2">
                            <div className="h-5 w-36 animate-pulse rounded bg-gray-200"></div>
                            <div className="h-5 w-20 animate-pulse rounded bg-gray-200"></div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white p-4 shadow-sm sm:p-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col justify-between sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Waiting List Management
              </h1>
              {event && (
                <p className="mt-1 text-sm text-gray-500">
                  For event: {event.title} on {formatDateTime(event.from)}
                </p>
              )}
            </div>
            <div className="mt-4 flex space-x-3 sm:mt-0">
              <Link
                href={`/admin/events/${params.id}/registrations`}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                View Registrations
              </Link>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <svg
                  className="-ml-1 mr-2 h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Add to Waiting List
              </button>
            </div>
          </div>

          {waitingList.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No users on waiting list
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                There are currently no users on the waiting list for this event.
              </p>
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Name
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Email
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Payment Method
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Added On
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {waitingList.map((entry) => (
                      <tr key={entry.id}>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
                                <span className="font-medium text-indigo-800">
                                  {entry.firstName.charAt(0)}
                                  {entry.lastName
                                    ? entry.lastName.charAt(0)
                                    : ""}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {entry.firstName} {entry.lastName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {entry.email}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <PaymentTypeIndicator type={entry.paymentType} />
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {formatDateTime(entry.createdAt)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handlePromote(entry.id)}
                              disabled={isPromoting === entry.id}
                              className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                            >
                              {isPromoting === entry.id ? (
                                <span>Promoting...</span>
                              ) : (
                                <span>Promote to Registered</span>
                              )}
                            </button>
                            <button
                              onClick={() => handleDelete(entry.id)}
                              disabled={isDeleting === entry.id}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            >
                              {isDeleting === entry.id ? (
                                <span>Removing...</span>
                              ) : (
                                <span>Remove</span>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add to Waiting List Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
              onClick={() => setShowAddForm(false)}
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span
              className="hidden sm:inline-block sm:h-screen sm:align-middle"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <h3
                      className="text-lg font-medium leading-6 text-gray-900"
                      id="modal-title"
                    >
                      Add User to Waiting List
                    </h3>
                    <div className="mt-2">
                      <form
                        id="add-waiting-list-form"
                        onSubmit={handleAddToWaitingList}
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2 sm:col-span-1">
                            <label
                              htmlFor="firstName"
                              className="block text-sm font-medium text-gray-700"
                            >
                              First Name *
                            </label>
                            <input
                              type="text"
                              name="firstName"
                              id="firstName"
                              required
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                          <div className="col-span-2 sm:col-span-1">
                            <label
                              htmlFor="lastName"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Last Name
                            </label>
                            <input
                              type="text"
                              name="lastName"
                              id="lastName"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                          <div className="col-span-2">
                            <label
                              htmlFor="email"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Email *
                            </label>
                            <input
                              type="email"
                              name="email"
                              id="email"
                              required
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                          <div className="col-span-2">
                            <label
                              htmlFor="phoneNumber"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Phone Number
                            </label>
                            <input
                              type="tel"
                              name="phoneNumber"
                              id="phoneNumber"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Payment Method *
                            </label>
                            <div className="mt-2 space-y-2">
                              <div className="flex items-center">
                                <input
                                  id="card"
                                  name="paymentType"
                                  type="radio"
                                  value="QR"
                                  defaultChecked
                                  className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <label
                                  htmlFor="card"
                                  className="ml-3 text-sm text-gray-700"
                                >
                                  QR Code Payment
                                </label>
                              </div>
                              <div className="flex items-center">
                                <input
                                  id="cash"
                                  name="paymentType"
                                  type="radio"
                                  value="CASH"
                                  className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <label
                                  htmlFor="cash"
                                  className="ml-3 text-sm text-gray-700"
                                >
                                  Cash on Site
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="submit"
                  form="add-waiting-list-form"
                  disabled={isAddingUser}
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {isAddingUser ? "Adding..." : "Add to Waiting List"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:ml-3 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
