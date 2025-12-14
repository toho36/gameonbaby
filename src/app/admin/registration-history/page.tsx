"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { RegistrationHistoryEntry } from "~/utils/registrationHistory";
import Link from "next/link";

export default function RegistrationHistoryPage() {
  const [history, setHistory] = useState<RegistrationHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [events, setEvents] = useState<Array<{ id: string; title: string }>>(
    [],
  );
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    isLoading: kindIsLoading,
  } = useKindeBrowserClient();

  useEffect(() => {
    // Check if user is authenticated
    if (!kindIsLoading && !isAuthenticated) {
      console.log("User not authenticated, redirecting to home");
      router.push("/");
      return;
    }

    console.log("User authenticated, checking access");

    // Check user role - will fetch from DB in API calls
    const checkUserAccess = async () => {
      try {
        console.log("Checking registration history access...");
        const response = await fetch(
          "/api/admin/check-registration-history-access",
        );

        if (!response.ok) {
          console.error(`Access check failed with status: ${response.status}`);
          router.push("/");
          return false;
        }

        const data = await response.json();
        console.log("Access check response:", data);

        if (!data.success || !data.hasAccess) {
          console.log(`User does not have access to registration history`);
          router.push("/");
          return false;
        }

        console.log(`User has access with role: ${data.role}`);
        return true;
      } catch (error) {
        console.error("Error checking access:", error);
        router.push("/");
        return false;
      }
    };

    // Fetch registration history
    const fetchHistory = async () => {
      // First check if user has access
      const hasAccess = await checkUserAccess();
      if (!hasAccess) {
        console.log("User does not have access, stopping data fetch");
        return;
      }

      try {
        setIsLoading(true);
        const url = selectedEvent
          ? `/api/registration-history?eventId=${selectedEvent}`
          : "/api/registration-history";

        console.log(`Fetching history from: ${url}`);
        const response = await fetch(url);

        if (!response.ok) {
          console.error(`Failed to fetch history: ${response.status}`);
          return;
        }

        const data = await response.json();
        console.log(`Received ${data.history?.length || 0} history entries`);

        if (data.success) {
          setHistory(data.history);
        } else {
          console.error("History API returned error:", data.error);
        }
      } catch (error) {
        console.error("Error fetching registration history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch events for filter
    const fetchEvents = async () => {
      try {
        console.log("Fetching events for dropdown");
        const response = await fetch("/api/events");

        if (!response.ok) {
          console.error(`Failed to fetch events: ${response.status}`);
          return;
        }

        const data = await response.json();
        console.log(`Received ${data.events?.length || 0} events`);

        if (data.success && data.events) {
          setEvents(
            data.events.map((event: any) => ({
              id: event.id,
              title: event.title,
            })),
          );
        } else {
          console.error("Events API returned error:", data.error);
        }
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };

    fetchHistory();
    fetchEvents();
  }, [isAuthenticated, kindIsLoading, router, selectedEvent, user]);

  // Format date and time
  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString("cs-CZ", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Get action color class
  const getActionColor = (action: string) => {
    switch (action) {
      case "REGISTERED":
        return "text-green-500";
      case "UNREGISTERED":
        return "text-red-500";
      case "MOVED_TO_WAITLIST":
        return "text-orange-500";
      case "MOVED_FROM_WAITLIST":
        return "text-blue-500";
      case "DELETED_BY_MODERATOR":
        return "text-red-700";
      case "EVENT_CREATED":
        return "text-purple-500";
      case "EVENT_DELETED":
        return "text-red-800";
      case "EVENT_UPDATED":
        return "text-yellow-500";
      default:
        return "text-gray-500";
    }
  };

  // Format action type for display
  const formatActionType = (action: string) => {
    return action.replace(/_/g, " ");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Registration History</h1>

      {/* Event filter */}
      <div className="mb-6">
        <label htmlFor="eventFilter" className="mb-2 block text-sm font-medium">
          Filter by Event:
        </label>
        <select
          id="eventFilter"
          className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
          value={selectedEvent || ""}
          onChange={(e) => setSelectedEvent(e.target.value || null)}
        >
          <option value="">All Events</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.title}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900"></div>
        </div>
      ) : history.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          No registration history found.
        </div>
      ) : (
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
          <table className="w-full text-left text-sm text-gray-500 rtl:text-right">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Time
                </th>
                <th scope="col" className="px-6 py-3">
                  Action
                </th>
                <th scope="col" className="px-6 py-3">
                  Name
                </th>
                <th scope="col" className="px-6 py-3">
                  Email
                </th>
                <th scope="col" className="px-6 py-3">
                  Event
                </th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b bg-white hover:bg-gray-50"
                >
                  <td className="px-6 py-4">
                    {formatDateTime(entry.timestamp)}
                  </td>
                  <td
                    className={`px-6 py-4 font-medium ${getActionColor(entry.action_type)}`}
                  >
                    {formatActionType(entry.action_type)}
                  </td>
                  <td className="px-6 py-4">
                    {entry.first_name} {entry.last_name}
                  </td>
                  <td className="px-6 py-4">{entry.email}</td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/events/${entry.event_id}/${entry.event_id}/registrations`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {entry.event_title || entry.event_id}
                    </Link>
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
