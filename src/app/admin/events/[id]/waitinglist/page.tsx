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

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="flex animate-pulse items-center justify-center py-20">
          <svg
            className="h-10 w-10 animate-spin text-indigo-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span className="ml-3 text-lg font-medium text-gray-500">
            Loading waiting list...
          </span>
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
                href={`/admin/events/${params.id}`}
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
                Back to Event
              </Link>
              <Link
                href={`/admin/events/${params.id}/registrations`}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                View Registrations
              </Link>
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
                          <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold uppercase leading-5 text-green-800">
                            {entry.paymentType}
                          </span>
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
    </div>
  );
}
