"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { toast } from "react-hot-toast";
import Link from "next/link";

interface EventStat {
    id: string;
    title: string;
    from: string;
    registrations: number;
    attendees: number;
    paid: number;
}

interface Summary {
    totalEvents: number;
    totalRegistrations: number;
    totalAttendees: number;
    totalPaid: number;
}

export default function EventStatsPage() {
    const [events, setEvents] = useState<EventStat[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [hasFetched, setHasFetched] = useState(false);

    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useKindeBrowserClient();

    const fetchEventStats = useCallback(async () => {
        if (!fromDate || !toDate) {
            toast.error("Please select both from and to dates");
            return;
        }

        try {
            setIsLoading(true);
            setHasFetched(true);
            const url = `/api/admin/event-stats?from=${encodeURIComponent(fromDate)}&to=${encodeURIComponent(toDate)}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                setEvents(data.events);
                setSummary(data.summary);
            } else {
                toast.error(data.message || "Failed to fetch event statistics");
            }
        } catch (error) {
            console.error("Error fetching event stats:", error);
            toast.error("Failed to fetch event statistics");
        } finally {
            setIsLoading(false);
        }
    }, [fromDate, toDate]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("cs-CZ", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString("cs-CZ", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (authLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
                <div className="text-white">Loading...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        router.push("/api/auth/login");
        return null;
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-[#2e026d] to-[#15162c] p-8">
            <div className="mx-auto max-w-7xl">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-white">Event Statistics</h1>
                    <Link
                        href="/admin"
                        className="rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
                    >
                        ← Back to Admin
                    </Link>
                </div>

                {/* Date Range Picker */}
                <div className="mb-6 flex flex-wrap items-end gap-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-white/80">
                            From
                        </label>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="rounded-lg bg-white/10 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-white/80">
                            To
                        </label>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="rounded-lg bg-white/10 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <button
                        onClick={fetchEventStats}
                        disabled={isLoading}
                        className="rounded-lg bg-purple-600 px-6 py-2 font-medium text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isLoading ? "Loading..." : "Search"}
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-xl bg-white/10 backdrop-blur-sm">
                    <table className="w-full text-left text-white">
                        <thead className="border-b border-white/20 bg-white/5">
                            <tr>
                                <th className="px-4 py-3 font-medium">Date</th>
                                <th className="px-4 py-3 font-medium">Time</th>
                                <th className="px-4 py-3 font-medium">Event</th>
                                <th className="px-4 py-3 font-medium text-center">Registrations</th>
                                <th className="px-4 py-3 font-medium text-center">Attendees</th>
                                <th className="px-4 py-3 font-medium text-center">Paid</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!hasFetched ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-white/60">
                                        Select a date range and click Search to view event statistics
                                    </td>
                                </tr>
                            ) : isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-white/60">
                                        Loading...
                                    </td>
                                </tr>
                            ) : events.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-white/60">
                                        No events found in the selected date range
                                    </td>
                                </tr>
                            ) : (
                                events.map((event) => (
                                    <tr
                                        key={event.id}
                                        className="border-b border-white/10 hover:bg-white/5"
                                    >
                                        <td className="px-4 py-3">{formatDate(event.from)}</td>
                                        <td className="px-4 py-3 text-white/70">{formatTime(event.from)}</td>
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/admin/events/${event.id}/${event.id}/registrations`}
                                                className="text-indigo-300 hover:text-indigo-200 hover:underline"
                                            >
                                                {event.title}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="inline-flex items-center rounded-full bg-blue-500/20 px-2 py-1 text-xs font-medium text-blue-300">
                                                {event.registrations}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="inline-flex items-center rounded-full bg-green-500/20 px-2 py-1 text-xs font-medium text-green-300">
                                                {event.attendees}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="inline-flex items-center rounded-full bg-purple-500/20 px-2 py-1 text-xs font-medium text-purple-300">
                                                {event.paid}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Summary */}
                {summary && events.length > 0 && (
                    <div className="mt-6 rounded-xl bg-white/10 p-4 backdrop-blur-sm">
                        <h2 className="mb-3 text-lg font-semibold text-white">Summary</h2>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                            <div className="rounded-lg bg-white/5 p-3 text-center">
                                <div className="text-2xl font-bold text-white">{summary.totalEvents}</div>
                                <div className="text-sm text-white/60">Events</div>
                            </div>
                            <div className="rounded-lg bg-blue-500/10 p-3 text-center">
                                <div className="text-2xl font-bold text-blue-300">{summary.totalRegistrations}</div>
                                <div className="text-sm text-white/60">Registrations</div>
                            </div>
                            <div className="rounded-lg bg-green-500/10 p-3 text-center">
                                <div className="text-2xl font-bold text-green-300">{summary.totalAttendees}</div>
                                <div className="text-sm text-white/60">Attendees</div>
                            </div>
                            <div className="rounded-lg bg-purple-500/10 p-3 text-center">
                                <div className="text-2xl font-bold text-purple-300">{summary.totalPaid}</div>
                                <div className="text-sm text-white/60">Paid</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
