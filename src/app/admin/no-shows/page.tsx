"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { toast } from "react-hot-toast";
import Link from "next/link";
import DeleteConfirmationModal from "~/features/admin/components/DeleteConfirmationModal";

interface NoShow {
    id: string;
    email: string;
    eventId: string;
    eventTitle: string;
    eventDate: string;
    firstName: string;
    lastName: string | null;
    createdAt: string;
    feePaid: boolean;
    paidAt: string | null;
    notes: string | null;
}

interface PastEvent {
    id: string;
    title: string;
    from: string;
}

interface Candidate {
    id: string;
    email: string;
    firstName: string;
    lastName: string | null;
    paymentType: string;
}

type FilterType = "all" | "paid" | "unpaid";
type ViewMode = "events" | "players";

export default function NoShowsPage() {
    const [noShows, setNoShows] = useState<NoShow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<FilterType>("all");
    const [viewMode, setViewMode] = useState<ViewMode>("events");
    const [searchEmail, setSearchEmail] = useState("");
    const [isCheckingRole, setIsCheckingRole] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    // Bulk Import State
    const [showImportModal, setShowImportModal] = useState(false);
    const [pastEvents, setPastEvents] = useState<PastEvent[]>([]);
    const [selectedEventId, setSelectedEventId] = useState("");
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
    const [isImporting, setIsImporting] = useState(false);
    const [isLoadingEvents, setIsLoadingEvents] = useState(false);
    const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [noShowToDelete, setNoShowToDelete] = useState<string | null>(null);
    const [noShowNameToDelete, setNoShowNameToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useKindeBrowserClient();

    const fetchNoShows = useCallback(async () => {
        try {
            setIsLoading(true);
            let url = "/api/admin/no-shows?";
            if (filter === "paid") {
                url += "feePaid=true&";
            } else if (filter === "unpaid") {
                url += "feePaid=false&";
            }
            if (searchEmail) {
                url += `email=${encodeURIComponent(searchEmail)}`;
            }

            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                setNoShows(data.noShows);
            } else {
                toast.error(data.message || "Failed to fetch no-shows");
            }
        } catch (error) {
            console.error("Error fetching no-shows:", error);
            toast.error("Failed to fetch no-shows");
        } finally {
            setIsLoading(false);
        }
    }, [filter, searchEmail]);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/api/auth/login");
            return;
        }
        if (isAuthenticated) {
            checkAdminRole();
        }
    }, [isAuthenticated, authLoading, router]);

    const checkAdminRole = async () => {
        try {
            const response = await fetch("/api/admin/check");
            const data = await response.json();
            setIsAdmin(data.isAdmin);
            setIsCheckingRole(false);

            if (!data.isAdmin) {
                router.push("/admin");
                return;
            }

            fetchNoShows();
        } catch (error) {
            console.error("Error checking admin role:", error);
            router.push("/admin");
        }
    };

    // Bulk Import Functions
    const openImportModal = async () => {
        setShowImportModal(true);
        setIsLoadingEvents(true);
        try {
            const response = await fetch("/api/admin/events/past");
            const data = await response.json();
            if (data.success) {
                setPastEvents(data.events);
            } else {
                toast.error("Failed to load past events");
            }
        } catch (error) {
            toast.error("Error loading events");
        } finally {
            setIsLoadingEvents(false);
        }
    };

    const handleEventSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const eventId = e.target.value;
        setSelectedEventId(eventId);
        if (!eventId) {
            setCandidates([]);
            return;
        }

        setIsLoadingCandidates(true);
        try {
            const response = await fetch(`/api/admin/events/${eventId}/potential-no-shows`);
            const data = await response.json();
            if (data.success) {
                setCandidates(data.candidates);
                // Auto-select all by default
                setSelectedCandidates(new Set(data.candidates.map((c: any) => c.id)));
            } else {
                toast.error("Failed to load candidates");
            }
        } catch (error) {
            toast.error("Error loading candidates");
        } finally {
            setIsLoadingCandidates(false);
        }
    };

    const toggleCandidate = (id: string) => {
        const newSelected = new Set(selectedCandidates);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedCandidates(newSelected);
    };

    const toggleAllCandidates = () => {
        if (selectedCandidates.size === candidates.length) {
            setSelectedCandidates(new Set());
        } else {
            setSelectedCandidates(new Set(candidates.map((c) => c.id)));
        }
    };

    const handleImport = async () => {
        if (selectedCandidates.size === 0) return;

        setIsImporting(true);
        const event = pastEvents.find(e => e.id === selectedEventId);
        if (!event) return;

        const candidatesToImport = candidates.filter(c => selectedCandidates.has(c.id));

        try {
            const response = await fetch("/api/admin/no-shows/bulk-import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    candidates: candidatesToImport,
                    eventId: event.id,
                    eventTitle: event.title,
                    eventDate: event.from,
                }),
            });

            const data = await response.json();
            if (data.success) {
                toast.success(`Imported ${data.count} records`);
                setShowImportModal(false);
                fetchNoShows(); // Refresh list
                // Reset state
                setSelectedEventId("");
                setCandidates([]);
                setSelectedCandidates(new Set());
            } else {
                toast.error(data.message || "Import failed");
            }
        } catch (error) {
            toast.error("Error during import");
        } finally {
            setIsImporting(false);
        }
    };


    const handleMarkAsPaid = async (id: string, currentStatus: boolean) => {
        try {
            const response = await fetch(`/api/admin/no-shows/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ feePaid: !currentStatus }),
            });

            const data = await response.json();
            if (data.success) {
                toast.success(currentStatus ? "Marked as unpaid" : "Marked as paid");
                fetchNoShows();
            } else {
                toast.error(data.message || "Failed to update");
            }
        } catch (error) {
            console.error("Error updating no-show:", error);
            toast.error("Failed to update");
        }
    };

    const handleDelete = async (id: string) => {
        // find the noShow to get the name
        const ns = noShows.find(n => n.id === id);
        const displayName = ns ? `${ns.firstName} ${ns.lastName || ""}`.trim() : null;
        setNoShowToDelete(id);
        setNoShowNameToDelete(displayName);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!noShowToDelete) return;
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/admin/no-shows/${noShowToDelete}`, {
                method: "DELETE",
            });

            const data = await response.json();
            if (data.success) {
                toast.success("Record deleted");
                setShowDeleteModal(false);
                setNoShowToDelete(null);
                setNoShowNameToDelete(null);
                fetchNoShows();
            } else {
                toast.error(data.message || "Failed to delete");
            }
        } catch (error) {
            console.error("Error deleting no-show:", error);
            toast.error("Failed to delete");
        } finally {
            setIsDeleting(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("cs-CZ", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    // Aggregate stats by email
    const playerStats = noShows.reduce((acc, curr) => {
        const email = curr.email;
        if (!acc[email]) {
            acc[email] = {
                email: email,
                lastKnownName: `${curr.firstName} ${curr.lastName || ""}`.trim(),
                totalNoShows: 0,
                unpaidCount: 0,
                paidCount: 0,
                lastNoShowDate: curr.eventDate,
            };
        }

        const player = acc[email];
        // Check if player exists to satisfy TS, though logic guarantees it
        if (player) {
            player.totalNoShows++;
            if (curr.feePaid) {
                player.paidCount++;
            } else {
                player.unpaidCount++;
            }

            // Keep the most recent name and date
            if (new Date(curr.eventDate) > new Date(player.lastNoShowDate)) {
                player.lastNoShowDate = curr.eventDate;
                player.lastKnownName = `${curr.firstName} ${curr.lastName || ""}`.trim();
            }
        }

        return acc;
    }, {} as Record<string, { email: string; lastKnownName: string; totalNoShows: number; unpaidCount: number; paidCount: number; lastNoShowDate: string }>);

    const sortedPlayers = Object.values(playerStats).sort((a, b) => b.unpaidCount - a.unpaidCount);

    if (authLoading || isLoading || isCheckingRole) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
                <div className="text-white">Loading...</div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-[#2e026d] to-[#15162c] p-8">
            <div className="mx-auto max-w-7xl">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-white">No-Shows</h1>
                    <div className="flex gap-2">
                        <button
                            onClick={openImportModal}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
                        >
                            + Import Candidates
                        </button>
                        <Link
                            href="/admin"
                            className="rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
                        >
                            ← Back to Admin
                        </Link>
                    </div>
                </div>

                {/* View Mode Toggle & Filters */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex gap-4">
                        {/* View Switcher */}
                        <div className="flex rounded-lg bg-white/10 p-1">
                            <button
                                onClick={() => setViewMode("events")}
                                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${viewMode === "events"
                                    ? "bg-purple-600 text-white"
                                    : "text-white/70 hover:text-white"
                                    }`}
                            >
                                By Event
                            </button>
                            <button
                                onClick={() => setViewMode("players")}
                                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${viewMode === "players"
                                    ? "bg-purple-600 text-white"
                                    : "text-white/70 hover:text-white"
                                    }`}
                            >
                                By Player
                            </button>
                        </div>

                        {/* Status Filter (only for events view) */}
                        {viewMode === "events" && (
                            <div className="flex rounded-lg bg-white/10 p-1">
                                {(["all", "unpaid", "paid"] as const).map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${filter === f
                                            ? "bg-purple-600 text-white"
                                            : "text-white/70 hover:text-white"
                                            }`}
                                    >
                                        {f === "all" ? "All" : f === "paid" ? "✅ Paid" : "❌ Not Paid"}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Search by email..."
                            value={searchEmail}
                            onChange={(e) => setSearchEmail(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && fetchNoShows()}
                            className="rounded-lg bg-white/10 px-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <button
                            onClick={fetchNoShows}
                            className="rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
                        >
                            Search
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-xl bg-white/10 backdrop-blur-sm">
                    {viewMode === "events" ? (
                        <table className="w-full text-left text-white">
                            <thead className="border-b border-white/20 bg-white/5">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Event Date</th>
                                    <th className="px-4 py-3 font-medium">Event</th>
                                    <th className="px-4 py-3 font-medium">Name</th>
                                    <th className="px-4 py-3 font-medium">Email</th>
                                    <th className="px-4 py-3 font-medium">Fee Status</th>
                                    <th className="px-4 py-3 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {noShows.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-white/60">
                                            No records found
                                        </td>
                                    </tr>
                                ) : (
                                    noShows.map((noShow) => (
                                        <tr
                                            key={noShow.id}
                                            className="border-b border-white/10 hover:bg-white/5"
                                        >
                                            <td className="px-4 py-3">{formatDate(noShow.eventDate)}</td>
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={`/admin/events/${noShow.eventId}/${noShow.eventId}/registrations`}
                                                    className="text-indigo-300 hover:text-indigo-200 hover:underline"
                                                >
                                                    {noShow.eventTitle}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3">
                                                {noShow.firstName} {noShow.lastName || ""}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-sm">{noShow.email}</td>
                                            <td className="px-4 py-3">
                                                {noShow.feePaid ? (
                                                    <span className="inline-flex items-center rounded-full bg-green-500/20 px-2 py-1 text-xs font-medium text-green-300">
                                                        ✅ Paid {noShow.paidAt && `(${formatDate(noShow.paidAt)})`}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center rounded-full bg-red-500/20 px-2 py-1 text-xs font-medium text-red-300">
                                                        ❌ Not Paid
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleMarkAsPaid(noShow.id, noShow.feePaid)}
                                                        className={`rounded px-3 py-1 text-sm font-medium transition-colors ${noShow.feePaid
                                                            ? "bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30"
                                                            : "bg-green-500/20 text-green-300 hover:bg-green-500/30"
                                                            }`}
                                                    >
                                                        {noShow.feePaid ? "Undo" : "Mark Paid"}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(noShow.id)}
                                                        className="rounded bg-red-500/20 px-3 py-1 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/30"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full text-left text-white">
                            <thead className="border-b border-white/20 bg-white/5">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Email</th>
                                    <th className="px-4 py-3 font-medium">Name (Last Known)</th>
                                    <th className="px-4 py-3 font-medium text-center">Total No-Shows</th>
                                    <th className="px-4 py-3 font-medium text-center">Unpaid</th>
                                    <th className="px-4 py-3 font-medium text-center">Paid</th>
                                    <th className="px-4 py-3 font-medium">Last No-Show</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedPlayers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-white/60">
                                            No records found
                                        </td>
                                    </tr>
                                ) : (
                                    sortedPlayers.map((player) => (
                                        <tr
                                            key={player.email}
                                            className="border-b border-white/10 hover:bg-white/5"
                                        >
                                            <td className="px-4 py-3 font-mono text-sm">{player.email}</td>
                                            <td className="px-4 py-3">{player.lastKnownName}</td>
                                            <td className="px-4 py-3 text-center text-lg font-bold">
                                                {player.totalNoShows}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${player.unpaidCount > 0 ? "bg-red-500/20 text-red-300" : "bg-white/10 text-white/50"
                                                    }`}>
                                                    {player.unpaidCount}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${player.paidCount > 0 ? "bg-green-500/20 text-green-300" : "bg-white/10 text-white/50"
                                                    }`}>
                                                    {player.paidCount}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-white/70">
                                                {formatDate(player.lastNoShowDate)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Summary */}
                <div className="mt-4 text-white/60">
                    {viewMode === "events" ? (
                        <>
                            Total: {noShows.length} records
                            {filter === "all" && noShows.length > 0 && (
                                <span className="ml-4">
                                    ({noShows.filter((n) => !n.feePaid).length} unpaid, {noShows.filter((n) => n.feePaid).length} paid)
                                </span>
                            )}
                        </>
                    ) : (
                        <>
                            Total: {sortedPlayers.length} unique players found
                        </>
                    )}
                </div>
            </div>

            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
                    <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-[#1e1f3a] text-white shadow-2xl">
                        <div className="border-b border-white/10 p-6">
                            <h2 className="text-xl font-bold">Import No-Shows Candidates</h2>
                            <p className="mt-1 text-sm text-white/60">
                                Select a past event to find people who registered but didn't attend and haven't paid.
                            </p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="mb-6">
                                <label className="mb-2 block text-sm font-medium text-white/80">
                                    Select Event
                                </label>
                                {isLoadingEvents ? (
                                    <div className="text-white/60">Loading events...</div>
                                ) : (
                                    <select
                                        value={selectedEventId}
                                        onChange={handleEventSelect}
                                        className="w-full rounded-lg bg-white/10 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="" className="text-black">Select an event...</option>
                                        {pastEvents.map((event) => (
                                            <option key={event.id} value={event.id} className="text-black">
                                                {formatDate(event.from)} - {event.title}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {selectedEventId && (
                                <div>
                                    <div className="mb-3 flex items-center justify-between">
                                        <h3 className="font-semibold text-white/90">
                                            Candidates ({candidates.length})
                                        </h3>
                                        <button
                                            onClick={toggleAllCandidates}
                                            className="text-sm text-indigo-300 hover:text-indigo-200"
                                        >
                                            {selectedCandidates.size === candidates.length ? "Deselect All" : "Select All"}
                                        </button>
                                    </div>

                                    {isLoadingCandidates ? (
                                        <div className="py-8 text-center text-white/60">Loading candidates...</div>
                                    ) : candidates.length === 0 ? (
                                        <div className="rounded-lg bg-white/5 py-8 text-center text-white/60">
                                            No unpaid non-attendees found for this event.
                                        </div>
                                    ) : (
                                        <div className="max-h-60 space-y-2 overflow-y-auto">
                                            {candidates.map((candidate) => (
                                                <div
                                                    key={candidate.id}
                                                    className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-all ${selectedCandidates.has(candidate.id)
                                                        ? "border-indigo-500 bg-indigo-500/20"
                                                        : "border-white/10 bg-white/5 hover:bg-white/10"
                                                        }`}
                                                    onClick={() => toggleCandidate(candidate.id)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`flex h-5 w-5 items-center justify-center rounded border ${selectedCandidates.has(candidate.id) ? "border-indigo-500 bg-indigo-500" : "border-white/30"
                                                            }`}>
                                                            {selectedCandidates.has(candidate.id) && (
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium">{candidate.firstName} {candidate.lastName}</div>
                                                            <div className="text-sm text-white/60">{candidate.email}</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-xs text-white/50">{candidate.paymentType}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 border-t border-white/10 p-6">
                            <button
                                onClick={() => setShowImportModal(false)}
                                className="rounded-lg px-4 py-2 text-white/70 hover:bg-white/10 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={isImporting || selectedCandidates.size === 0}
                                className="flex items-center rounded-lg bg-indigo-600 px-6 py-2 font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isImporting ? (
                                    <>
                                        <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                                        Importing...
                                    </>
                                ) : (
                                    `Import Selected (${selectedCandidates.size})`
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showDeleteModal && (
                <DeleteConfirmationModal
                    onConfirm={confirmDelete}
                    onCancel={() => {
                        setShowDeleteModal(false);
                        setNoShowToDelete(null);
                        setNoShowNameToDelete(null);
                    }}
                    title="Delete No-show Record"
                    message={
                        noShowNameToDelete
                            ? `Are you sure you want to delete ${noShowNameToDelete}?`
                            : "Are you sure you want to delete this no-show record?"
                    }
                    confirmButtonText="Delete"
                    isProcessing={isDeleting}
                />
            )}
        </main>
    );
}
