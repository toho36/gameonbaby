"use client";

import { useState } from "react";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useEventRegistrationStore } from "~/stores/eventRegistrationStore";

interface UnregisterButtonProps {
  eventId: string;
  refreshForm?: () => void;
}

export default function UnregisterButton({
  eventId,
  refreshForm,
}: UnregisterButtonProps) {
  const { user, isAuthenticated } = useKindeBrowserClient();
  const [isUnregistering, setIsUnregistering] = useState<boolean>(false);
  const router = useRouter();
  const decrementRegistrationCount = useEventRegistrationStore(
    (state) => state.decrementRegistrationCount,
  );

  // Function to handle unregistration
  const handleUnregister = async () => {
    if (!isAuthenticated || !user) {
      toast.error("You must be logged in to unregister");
      return;
    }

    try {
      setIsUnregistering(true);
      const response = await fetch(`/api/events/${eventId}/unregister`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Update the registration count in the store
          decrementRegistrationCount();

          toast.success("You have been unregistered from this event");

          // If refreshForm callback is provided, call it to reset form state
          if (refreshForm) {
            refreshForm();
          } else {
            // Otherwise, refresh the page to reset all states
            window.location.reload();
          }
        } else {
          toast.error(data.error || "Failed to unregister");
        }
      } else {
        toast.error("Failed to unregister. Please try again.");
      }
    } catch (error) {
      console.error("Error unregistering:", error);
      toast.error("An error occurred while unregistering");
    } finally {
      setIsUnregistering(false);
    }
  };

  return (
    <button
      onClick={handleUnregister}
      disabled={isUnregistering}
      className="inline-flex items-center rounded-full bg-red-500/30 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-red-500/50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isUnregistering ? (
        <>
          <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
          Unregistering...
        </>
      ) : (
        <>
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
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Unregister
        </>
      )}
    </button>
  );
}
