"use client";

import { useEffect, useState } from "react";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import UnregisterButton from "./UnregisterButton";
import Link from "next/link";

interface CheckRegistrationStatusProps {
  eventId: string;
  eventFromDate?: string;
}

export default function CheckRegistrationStatus({
  eventId,
  eventFromDate,
}: CheckRegistrationStatusProps) {
  const { user, isAuthenticated } = useKindeBrowserClient();
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function checkRegistration() {
      if (!isAuthenticated || !user || !user.email) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/events/${eventId}/participants`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Check if user's email is in registrations
            const isUserRegistered = data.registrations.some(
              (reg: { email: string }) => reg.email === user.email,
            );
            setIsRegistered(isUserRegistered);
          }
        }
      } catch (error) {
        console.error("Error checking registration status:", error);
      } finally {
        setIsLoading(false);
      }
    }

    checkRegistration();
  }, [eventId, isAuthenticated, user]);

  if (isLoading) {
    return (
      <div className="inline-flex items-center rounded-full bg-purple-800/50 px-4 py-2 text-sm font-medium text-white">
        <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
        Loading...
      </div>
    );
  }

  if (isRegistered) {
    return <UnregisterButton eventId={eventId} eventFromDate={eventFromDate} />;
  }

  return (
    <Link
      href="/"
      className="inline-flex items-center rounded-full bg-purple-800/50 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-purple-700/70 hover:text-white"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="mr-2 h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 19l-7-7 7-7"
        />
      </svg>
      Back to Events
    </Link>
  );
}

