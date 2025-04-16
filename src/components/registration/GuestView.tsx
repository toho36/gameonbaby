import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Event } from "~/types/Event";
import DuplicateRegistrationModal from "./DuplicateRegistrationModal";

interface GuestViewProps {
  event: Event;
  eventDate: string;
  onGuestRegistrationClick: () => void;
  email?: string;
  showDuplicateModal?: boolean;
  onCloseDuplicateModal?: () => void;
  nameError?: boolean;
  duplicateName?: string;
}

export default function GuestView({
  event,
  eventDate,
  onGuestRegistrationClick,
  email = "",
  showDuplicateModal = false,
  onCloseDuplicateModal = () => {},
  nameError = false,
  duplicateName = "",
}: GuestViewProps) {
  const router = useRouter();

  return (
    <div className="rounded-xl border border-white/20 bg-gradient-to-br from-purple-900/70 to-indigo-900/70 p-6 text-white shadow-lg backdrop-blur-sm">
      <div className="grid grid-cols-1 gap-4">
        <div className="mb-4 text-center">
          <h3 className="mb-2 text-xl font-bold">Join the Event</h3>
          <p className="text-white/80">
            {event._count.Registration >= event.capacity
              ? "Event is full, but you can join the waiting list"
              : "Register for this exciting event"}
          </p>
        </div>
        <button
          onClick={() => router.push("/api/auth/login")}
          className="w-full rounded-lg bg-white/20 px-5 py-3.5 font-medium text-white transition-all hover:bg-white/30 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-1 focus:ring-offset-purple-900"
        >
          <div className="flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mr-2 h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
              />
            </svg>
            {event._count.Registration >= event.capacity
              ? "Sign In to Join Waiting List"
              : "Sign In to Register"}
          </div>
        </button>
        <button
          onClick={onGuestRegistrationClick}
          className="w-full rounded-lg border border-white/20 bg-transparent px-5 py-3.5 font-medium text-white transition-all hover:bg-white/10 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-white/20"
        >
          <div className="flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mr-2 h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            {event._count.Registration >= event.capacity
              ? "Join Waiting List as Guest"
              : "Register as Guest"}
          </div>
        </button>
      </div>

      {/* Duplicate Registration Modal */}
      <DuplicateRegistrationModal
        isOpen={showDuplicateModal}
        onClose={onCloseDuplicateModal}
        email={email}
        nameError={nameError}
        duplicateName={duplicateName}
      />
    </div>
  );
}
