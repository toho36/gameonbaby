"use client";

import React from "react";
import { Event } from "~/features/events/types";

interface GuestRegistrationSuccessProps {
  event: Event;
  eventDate: string;
  qrCodeUrl: string | null;
  resetFormState: () => void;
}

export default function GuestRegistrationSuccess({
  event,
  eventDate,
  qrCodeUrl,
  resetFormState,
}: GuestRegistrationSuccessProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-br from-purple-900/40 to-indigo-900/40 p-6 shadow-xl backdrop-blur-lg">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-green-400"
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
        </div>
        <h3 className="text-xl font-bold text-white">
          Registration Successful!
        </h3>
        <p className="mt-2 text-white/80">
          Thank you for registering for the event. Your spot has been secured.
        </p>
        <div className="mt-4 rounded-lg bg-white/10 p-3 text-left">
          <p className="mb-1 text-sm text-white/70">Event Details:</p>
          <p className="font-medium text-white">{event.title}</p>
          <p className="text-sm text-white/90">{eventDate}</p>
          {event.place && (
            <p className="text-sm text-white/90">{event.place}</p>
          )}
        </div>
      </div>

      {qrCodeUrl && (
        <div className="mb-6 flex flex-col items-center">
          <h4 className="mb-3 text-lg font-semibold text-white">
            Your Payment QR Code
          </h4>
          <div className="rounded-lg bg-white p-4">
            <img src={qrCodeUrl} alt="Payment QR Code" className="h-48 w-48" />
          </div>
          <p className="mt-2 text-center text-sm text-white/80">
            Please make your payment of {event.price} Kč by scanning this QR
            code.
          </p>
        </div>
      )}

      <div className="text-center">
        <button
          onClick={() => {
            resetFormState();
          }}
          className="rounded-lg bg-white/20 px-4 py-2 font-medium text-white transition hover:bg-white/30"
        >
          Register Another Person
        </button>
      </div>
    </div>
  );
}
