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
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const router = useRouter();

  const decrementRegistrationCount = useEventRegistrationStore(
    (state) => state.decrementRegistrationCount,
  );

  // Show the confirmation UI
  const handleShowConfirmation = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirmation(true);
  };

  // Cancel unregistration
  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirmation(false);
  };

  // Function to handle unregistration
  const handleUnregister = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

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
      setShowConfirmation(false);
    }
  };

  // If showing confirmation, render the confirmation UI
  if (showConfirmation) {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-lg bg-red-500/20 p-3 text-white">
        <div className="mr-2 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mr-2 h-5 w-5 text-red-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span>Are you sure you want to unregister?</span>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <button
            onClick={handleCancel}
            disabled={isUnregistering}
            className="rounded-lg bg-white/20 px-4 py-1.5 text-sm font-medium text-white transition-all hover:bg-white/30 focus:ring-2 focus:ring-white/30 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUnregister}
            disabled={isUnregistering}
            className="inline-flex items-center rounded-lg bg-red-500/40 px-4 py-1.5 text-sm font-medium text-white transition-all hover:bg-red-500/60 focus:ring-2 focus:ring-red-500/30 disabled:opacity-50"
          >
            {isUnregistering ? (
              <>
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                Unregistering...
              </>
            ) : (
              "Confirm"
            )}
          </button>
        </div>
      </div>
    );
  }

  // Otherwise, render the unregister button
  return (
    <button
      onClick={handleShowConfirmation}
      disabled={isUnregistering}
      className="inline-flex items-center rounded-full bg-red-500/30 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-red-500/50 focus:ring-2 focus:ring-red-500/30 disabled:cursor-not-allowed disabled:opacity-50"
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
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
      </svg>
      Unregister
    </button>
  );
}
