"use client";

import {
  useState,
  useEffect,
  useCallback,
  Suspense,
  lazy,
  useMemo,
} from "react";
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
import { useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";

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

// Lazy load some components to improve initial load time
// Using dynamic import with next/dynamic instead of React.lazy for better Next.js compatibility
const RegistrationFormModal = dynamic(
  () => import("~/components/RegistrationFormModal"),
  {
    loading: () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="rounded-lg bg-white p-4">
          <div className="flex items-center space-x-2">
            <svg
              className="h-5 w-5 animate-spin text-blue-600"
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
            <span>Loading...</span>
          </div>
        </div>
      </div>
    ),
  },
);

const DeleteConfirmationModal = dynamic(
  () => import("~/components/DeleteConfirmationModal"),
  {
    loading: () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="rounded-lg bg-white p-4">
          <div className="flex items-center space-x-2">
            <svg
              className="h-5 w-5 animate-spin text-blue-600"
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
            <span>Loading...</span>
          </div>
        </div>
      </div>
    ),
  },
);

// Loading Skeleton component
const LoadingSkeleton = () => (
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
    </div>
  </div>
);

// Extracted RegistrationTable component for better code organization
interface RegistrationTableProps {
  registrations: Registration[];
  compactView: boolean;
  lastArrivedId: string | null;
  processing: string | null;
  togglePaymentStatus: (id: string) => void;
  toggleAttendance: (id: string) => void;
  handleEditClick: (registration: Registration) => void;
  handleDuplicateRegistration: (registration: Registration) => void;
  handleDeleteClick: (id: string) => void;
}

const RegistrationTable: React.FC<RegistrationTableProps> = ({
  registrations,
  compactView,
  lastArrivedId,
  processing,
  togglePaymentStatus,
  toggleAttendance,
  handleEditClick,
  handleDuplicateRegistration,
  handleDeleteClick,
}) => {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto divide-y divide-gray-200">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              <th className="px-6 py-4">Participant</th>
              <th className="px-6 py-4">
                {compactView ? "Status" : "Payment & Attendance"}
              </th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {registrations.map((registration) => (
              <tr
                key={registration.id}
                className={`transition-colors duration-200 ${
                  lastArrivedId === registration.id
                    ? "bg-green-50"
                    : "hover:bg-gray-50"
                }`}
              >
                <td className="whitespace-nowrap px-6 py-4">
                  <div
                    className={`text-sm font-medium text-gray-900 ${compactView ? "text-lg" : ""}`}
                  >
                    {registration.user.name || "No name provided"}
                  </div>
                  {!compactView && (
                    <div className="mt-1 text-xs text-gray-500">
                      <div>{registration.user.email || "No email"}</div>
                      <div>{registration.user.phone || "No phone"}</div>
                    </div>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex flex-col gap-2 text-sm">
                    <button
                      onClick={() => togglePaymentStatus(registration.id)}
                      disabled={processing === "payment" + registration.id}
                      className={`${
                        compactView
                          ? `mr-2 rounded-md px-3 py-2 text-sm font-medium ${
                              registration.status === "PAID"
                                ? "bg-green-100 text-green-800 hover:bg-green-200"
                                : "bg-red-100 text-red-800 hover:bg-red-200"
                            }`
                          : `mr-2 rounded-md px-2 py-1 text-xs font-medium ${
                              registration.status === "PAID"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`
                      }`}
                    >
                      {processing === "payment" + registration.id ? (
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em]"></span>
                      ) : (
                        <>
                          {registration.status === "PAID" ? (
                            <>
                              <span className="inline-flex items-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="mr-1 h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                                {compactView ? "Paid" : "Paid"}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="inline-flex items-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="mr-1 h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                {compactView ? "Not Paid" : "Not Paid"}
                              </span>
                            </>
                          )}
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => toggleAttendance(registration.id)}
                      disabled={processing === "attendance" + registration.id}
                      className={`${
                        compactView
                          ? `rounded-md px-3 py-2 text-sm font-medium ${
                              registration.attended
                                ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                            }`
                          : `rounded-md px-2 py-1 text-xs font-medium ${
                              registration.attended
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`
                      }`}
                    >
                      {processing === "attendance" + registration.id ? (
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em]"></span>
                      ) : (
                        <>
                          {registration.attended ? (
                            <>
                              <span className="inline-flex items-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="mr-1 h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                                {compactView ? "Checked In" : "Attended"}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="inline-flex items-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="mr-1 h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                                {compactView ? "Check In" : "Not Attended"}
                              </span>
                            </>
                          )}
                        </>
                      )}
                    </button>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditClick(registration)}
                      className={`${compactView ? "hidden" : "bg-blue-50 text-blue-700 hover:bg-blue-100"} ${
                        compactView ? "px-4 py-2 text-sm" : "px-3 py-1 text-xs"
                      } inline-flex items-center rounded-md font-medium`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="mr-1 h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(registration.id)}
                      className={`${compactView ? "hidden" : "bg-red-50 text-red-700 hover:bg-red-100"} ${
                        compactView ? "px-4 py-2 text-sm" : "px-3 py-1 text-xs"
                      } inline-flex items-center rounded-md font-medium`}
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
                      Delete
                    </button>

                    {!compactView && (
                      <button
                        onClick={() =>
                          handleDuplicateRegistration(registration)
                        }
                        disabled={processing === "duplicate" + registration.id}
                        className="inline-flex items-center rounded-md bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 hover:bg-purple-100"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="mr-1 h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
                          <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" />
                        </svg>
                        {processing === "duplicate" + registration.id
                          ? "Processing..."
                          : "Duplicate"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Define improved header styling
const PageHeader = ({
  event,
  eventLoading,
  setShowForm,
  compactView,
  setCompactView,
  params,
  formatDateTime,
}: {
  event: Event | null;
  eventLoading: boolean;
  setShowForm: (show: boolean) => void;
  compactView: boolean;
  setCompactView: (compact: boolean) => void;
  params: { id: string; eventId: string };
  formatDateTime: (dateStr: string) => string;
}) => {
  return (
    <div className="mb-8 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
          {event ? event.title : "Loading..."}
        </h1>
        {event && !eventLoading ? (
          <div className="mt-2 flex flex-wrap items-center text-sm text-gray-600">
            <span className="flex items-center text-gray-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mr-1 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {formatDateTime(event.from).split(",")[0]}
            </span>
            <span className="mx-2 text-gray-400">|</span>
            <span className="flex items-center text-gray-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mr-1 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {formatDateTime(event.from).split(",")[1]} -{" "}
              {formatDateTime(event.to).split(",")[1]}
            </span>
            <span className="mx-2 text-gray-400">|</span>
            <span className="flex items-center text-gray-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mr-1 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {event.price} Kč
            </span>
          </div>
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
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mr-1.5 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Add Participant
        </button>
        <button
          onClick={() => setCompactView(!compactView)}
          className={`inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
            compactView
              ? "border-green-500 bg-green-50 text-green-700 hover:bg-green-100"
              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`mr-1.5 h-4 w-4 ${compactView ? "text-green-500" : "text-gray-500"}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={
                compactView
                  ? "M4 6h16M4 10h16M4 14h16M4 18h16"
                  : "M4 6h16M4 12h8m-8 6h16"
              }
            />
          </svg>
          {compactView ? "Event Mode Active" : "Enable Event Mode"}
        </button>
        <Link
          href={`/admin/events`}
          className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <svg
            className="mr-1.5 h-4 w-4 text-gray-500"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
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
          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <svg
            className="mr-1.5 h-4 w-4 text-gray-500"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
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
  );
};

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
  const queryClient = useQueryClient();

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
        // Error handling without console.error
        toast.error("Failed to check permissions");
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
          // Error handling without console.error
          toast.error(data.message || "Failed to load event");
        }
      } catch (error) {
        // Error handling without console.error
        toast.error("Failed to load event");
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
            // Error handling without console.error
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
      // Error handling without console.error
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
            // Error handling without console.error
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
      // Error handling without console.error
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
          // Error handling without console.error
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
      queryClient,
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

  // Add a new state for search functionality
  const [searchQuery, setSearchQuery] = useState("");

  // Add filtered registrations based on search query
  const filteredRegistrations = useMemo(() => {
    if (!searchQuery.trim()) return sortedRegistrations;

    return sortedRegistrations.filter((registration) =>
      registration.user.name?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [sortedRegistrations, searchQuery]);

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
              // Error handling without console.error
              toast.error("Failed to update participant");
            },
          },
        );
      }
    } catch (error) {
      // Error handling without console.error
      toast.error(
        error instanceof Error
          ? error.message
          : "An error occurred. Please try again.",
      );
    } finally {
      setProcessing(null);
    }
  };

  // Update the memoizedRender function to use the new PageHeader component
  const memoizedRender = useCallback(() => {
    if (loading || registrationsLoading) {
      return <LoadingSkeleton />;
    }

    if (error) {
      return <div className="p-8 text-center text-red-600">{error}</div>;
    }

    return (
      <div className="min-h-screen bg-gray-50 pb-12">
        <div className="container mx-auto px-4 py-8">
          <PageHeader
            event={event}
            eventLoading={eventLoading}
            setShowForm={setShowForm}
            compactView={compactView}
            setCompactView={setCompactView}
            params={params}
            formatDateTime={formatDateTime}
          />

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-blue-100 p-4 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-700">
                  Total Registrations
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </span>
              </div>
              <p className="mt-2 text-3xl font-bold text-blue-700">
                {summary.total}
              </p>
            </div>

            <div className="rounded-xl border border-green-100 bg-gradient-to-br from-green-50 to-green-100 p-4 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-700">Paid</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-700">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </span>
              </div>
              <p className="mt-2 text-3xl font-bold text-green-700">
                {summary.paid}
              </p>
            </div>

            <div className="rounded-xl border border-purple-100 bg-gradient-to-br from-purple-50 to-purple-100 p-4 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-purple-700">
                  Attended
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-700">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </span>
              </div>
              <p className="mt-2 text-3xl font-bold text-purple-700">
                {summary.attended}
              </p>
            </div>
          </div>

          {/* Add a search filter at the top of the table for quickly finding participants in compact mode */}
          <div className="mb-4">
            {compactView && (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Quick search by name..."
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>
            )}
          </div>

          {/* Desktop view */}
          <div className="sm:block">
            <div className="min-w-full overflow-hidden overflow-x-auto align-middle shadow sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className={`${
                        compactView ? "w-1/2" : "w-1/4"
                      } bg-gray-50 px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500`}
                    >
                      Name
                    </th>
                    {!compactView && (
                      <>
                        <th
                          scope="col"
                          className="w-1/4 bg-gray-50 px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                        >
                          Email
                        </th>
                        <th
                          scope="col"
                          className="w-1/4 bg-gray-50 px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                        >
                          Phone
                        </th>
                        <th
                          scope="col"
                          className="w-1/4 bg-gray-50 px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500"
                        >
                          Status
                        </th>
                      </>
                    )}
                    <th
                      scope="col"
                      className={`${
                        compactView ? "w-1/2" : "w-1/4"
                      } bg-gray-50 px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500`}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredRegistrations.map((registration) => (
                    <tr
                      key={registration.id}
                      className={
                        lastArrivedId === registration.id
                          ? "bg-green-50 transition-colors duration-1000"
                          : ""
                      }
                    >
                      <td
                        className={`whitespace-nowrap px-6 py-4 ${compactView ? "text-base font-medium" : ""}`}
                      >
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-gray-200 text-center">
                              <span className="inline-block pt-2 text-lg font-medium text-gray-600">
                                {registration.user.name
                                  ? registration.user.name.charAt(0)
                                  : "?"}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {registration.user.name || "No name provided"}
                            </div>
                          </div>
                        </div>
                      </td>
                      {!compactView && (
                        <>
                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {registration.user.email || "No email"}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {registration.user.phone || "No phone"}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-center">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <button
                                onClick={() =>
                                  togglePaymentStatus(registration.id)
                                }
                                disabled={
                                  processing === "payment" + registration.id
                                }
                                className={`${
                                  registration.status === "PAID"
                                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                                    : "bg-red-100 text-red-800 hover:bg-red-200"
                                } inline-flex items-center rounded-md px-3 py-1 text-xs font-medium`}
                              >
                                {processing === "payment" + registration.id ? (
                                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em]"></span>
                                ) : (
                                  <>
                                    {registration.status === "PAID" ? (
                                      <>
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          className="mr-1 h-4 w-4"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M5 13l4 4L19 7"
                                          />
                                        </svg>
                                        Paid
                                      </>
                                    ) : (
                                      <>
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          className="mr-1 h-4 w-4"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                          />
                                        </svg>
                                        Not Paid
                                      </>
                                    )}
                                  </>
                                )}
                              </button>

                              <button
                                onClick={() =>
                                  toggleAttendance(registration.id)
                                }
                                disabled={
                                  processing === "attendance" + registration.id
                                }
                                className={`${
                                  registration.attended
                                    ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                                } inline-flex items-center rounded-md px-3 py-1 text-xs font-medium`}
                              >
                                {processing ===
                                "attendance" + registration.id ? (
                                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em]"></span>
                                ) : (
                                  <>
                                    {registration.attended ? (
                                      <>
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          className="mr-1 h-4 w-4"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M5 13l4 4L19 7"
                                          />
                                        </svg>
                                        Attended
                                      </>
                                    ) : (
                                      <>
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          className="mr-1 h-4 w-4"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                          />
                                        </svg>
                                        Check In
                                      </>
                                    )}
                                  </>
                                )}
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                      <td className="flex-wrap whitespace-nowrap px-6 py-4 text-center text-sm font-medium">
                        <div className="flex flex-wrap justify-center gap-2">
                          {compactView && (
                            <>
                              <button
                                onClick={() =>
                                  togglePaymentStatus(registration.id)
                                }
                                disabled={
                                  processing === "payment" + registration.id
                                }
                                className={`${
                                  registration.status === "PAID"
                                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                                    : "bg-red-100 text-red-800 hover:bg-red-200"
                                } inline-flex items-center rounded-md px-4 py-2 text-sm font-medium`}
                              >
                                {processing === "payment" + registration.id ? (
                                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em]"></span>
                                ) : (
                                  <>
                                    {registration.status === "PAID" ? (
                                      <>
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          className="mr-1 h-4 w-4"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M5 13l4 4L19 7"
                                          />
                                        </svg>
                                        Paid
                                      </>
                                    ) : (
                                      <>
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          className="mr-1 h-4 w-4"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                          />
                                        </svg>
                                        Not Paid
                                      </>
                                    )}
                                  </>
                                )}
                              </button>

                              <button
                                onClick={() =>
                                  toggleAttendance(registration.id)
                                }
                                disabled={
                                  processing === "attendance" + registration.id
                                }
                                className={`${
                                  registration.attended
                                    ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                                } inline-flex items-center rounded-md px-4 py-2 text-sm font-medium`}
                              >
                                {processing ===
                                "attendance" + registration.id ? (
                                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em]"></span>
                                ) : (
                                  <>
                                    {registration.attended ? (
                                      <>
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          className="mr-1 h-4 w-4"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M5 13l4 4L19 7"
                                          />
                                        </svg>
                                        Attended
                                      </>
                                    ) : (
                                      <>
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          className="mr-1 h-4 w-4"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                          />
                                        </svg>
                                        Check In
                                      </>
                                    )}
                                  </>
                                )}
                              </button>
                            </>
                          )}

                          {!compactView && (
                            <>
                              <button
                                onClick={() => handleEditClick(registration)}
                                className="inline-flex items-center rounded-md bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="mr-1 h-4 w-4"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                                Edit
                              </button>

                              <button
                                onClick={() =>
                                  handleDeleteClick(registration.id)
                                }
                                className="inline-flex items-center rounded-md bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
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
                                Delete
                              </button>

                              <button
                                onClick={() =>
                                  handleDuplicateRegistration(registration)
                                }
                                disabled={
                                  processing === "duplicate" + registration.id
                                }
                                className="inline-flex items-center rounded-md bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 hover:bg-purple-100"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="mr-1 h-4 w-4"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
                                  <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" />
                                </svg>
                                {processing === "duplicate" + registration.id
                                  ? "Processing..."
                                  : "Duplicate"}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile view */}
          <div className="sm:hidden">
            <div className="space-y-3">
              {filteredRegistrations.map((registration) => (
                <div
                  key={registration.id}
                  className={`rounded-lg border bg-white p-4 shadow-sm ${
                    lastArrivedId === registration.id
                      ? "border-green-300 bg-green-50"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-200 text-center">
                          <span className="inline-block pt-2 text-lg font-medium text-gray-600">
                            {registration.user.name
                              ? registration.user.name.charAt(0)
                              : "?"}
                          </span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="font-medium text-gray-900">
                          {registration.user.name || "No name provided"}
                        </div>
                        {!compactView && (
                          <div className="mt-1 text-xs text-gray-500">
                            <div>{registration.user.email || "No email"}</div>
                            <div>{registration.user.phone || "No phone"}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => togglePaymentStatus(registration.id)}
                      disabled={processing === "payment" + registration.id}
                      className={`${
                        registration.status === "PAID"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      } flex-1 rounded-md px-3 py-2 text-sm font-medium`}
                    >
                      {processing === "payment" + registration.id ? (
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em]"></span>
                      ) : (
                        <>
                          {registration.status === "PAID" ? (
                            <>
                              <span className="inline-flex items-center justify-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="mr-1 h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                                Paid
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="inline-flex items-center justify-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="mr-1 h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                Not Paid
                              </span>
                            </>
                          )}
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => toggleAttendance(registration.id)}
                      disabled={processing === "attendance" + registration.id}
                      className={`${
                        registration.attended
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      } flex-1 rounded-md px-3 py-2 text-sm font-medium`}
                    >
                      {processing === "attendance" + registration.id ? (
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em]"></span>
                      ) : (
                        <>
                          {registration.attended ? (
                            <>
                              <span className="inline-flex items-center justify-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="mr-1 h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                                Checked In
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="inline-flex items-center justify-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="mr-1 h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                                Check In
                              </span>
                            </>
                          )}
                        </>
                      )}
                    </button>
                  </div>

                  {!compactView && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => handleEditClick(registration)}
                        className="flex-1 rounded-md bg-blue-50 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="mr-1 inline-block h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(registration.id)}
                        className="flex-1 rounded-md bg-red-50 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="mr-1 inline-block h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Forms and modals */}
          <Suspense fallback={null}>
            {showForm && (
              <RegistrationFormModal
                formType={formType}
                currentRegistration={currentRegistration}
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleFormSubmit}
                onCancel={() => {
                  setShowForm(false);
                  setCurrentRegistration(null);
                }}
                processing={!!processing}
              />
            )}

            {showDeleteModal && (
              <DeleteConfirmationModal
                onConfirm={confirmDelete}
                onCancel={() => {
                  setShowDeleteModal(false);
                  setRegistrationToDelete(null);
                }}
                title="Delete Registration"
                message="Are you sure you want to delete this registration? This action cannot be undone."
                confirmButtonText="Delete"
                isProcessing={!!processing}
              />
            )}
          </Suspense>
        </div>
      </div>
    );
  }, [
    loading,
    registrationsLoading,
    error,
    registrations,
    event,
    compactView,
    lastArrivedId,
    processing,
    showForm,
    formType,
    currentRegistration,
    formData,
    showDeleteModal,
    searchQuery,
  ]);

  return memoizedRender();
}
