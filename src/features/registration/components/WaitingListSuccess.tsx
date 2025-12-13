"use client";

import React from "react";
import UnregisterButton from "./UnregisterButton";

interface WaitingListSuccessProps {
  eventId: string;
  eventFromDate?: string;
  profileImage: string | null;
  resetFormState: () => void;
}

export default function WaitingListSuccess({
  eventId,
  eventFromDate,
  profileImage,
  resetFormState,
}: WaitingListSuccessProps) {
  return (
    <div className="rounded-xl border border-white/20 bg-gradient-to-br from-purple-900/70 to-indigo-900/70 p-6 text-white shadow-lg backdrop-blur-sm">
      <div className="flex flex-col items-center text-center">
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="rounded-full bg-indigo-500/20 p-4">
            {profileImage ? (
              <div className="h-16 w-16 overflow-hidden rounded-full border-4 border-white/30">
                <img
                  src={profileImage}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-indigo-400"
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
            )}
          </div>
          <h3 className="text-2xl font-bold text-white">
            You're on the Waiting List!
          </h3>
          <p className="text-lg text-white/90">
            We'll notify you if a spot becomes available.
          </p>
        </div>

        <div className="mt-4 w-full rounded-lg border border-white/20 bg-white/10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/30">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </div>
              <span className="font-medium">Email Notification</span>
            </div>
            <span className="text-indigo-300">Enabled</span>
          </div>
        </div>

        <div className="mt-6 w-full">
          <div className="flex items-center justify-center">
            <UnregisterButton eventId={eventId} eventFromDate={eventFromDate} refreshForm={resetFormState} />
          </div>
        </div>
      </div>
    </div>
  );
}
