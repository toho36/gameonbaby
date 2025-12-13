"use client";

import { useState, useMemo } from "react";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useEventRegistrationStore } from "~/stores/eventRegistrationStore";

interface UnregisterButtonProps {
  eventId: string;
  eventFromDate?: string;
  refreshForm?: () => void;
}

// Simple bilingual messages
const messages = {
  cs: {
    cutoffWarning:
      "Odhlášení není možné méně než 24 hodin před akcí. Kontaktujte nás na IG nebo gameonvb.info@gmail.com. Účastníci, kteří se nedostaví bez omluvy, mohou být při další návštěvě účtováni.",
    policyInfo:
      "Odhlásit se můžete nejpozději 24 hodin před akcí. Pozdější zrušení či neúčast bez omluvy může být zpoplatněna.",
    tooLate: "Kontaktujte nás",
    unregister: "Odhlásit se",
    confirm: "Potvrdit",
    cancel: "Zrušit",
    confirmQuestion: "Opravdu se chcete odhlásit?",
    unregistering: "Odhlašování...",
    loginRequired: "Pro odhlášení musíte být přihlášeni",
    success: "Byli jste odhlášeni z této akce",
    error: "Nepodařilo se odhlásit",
  },
  en: {
    cutoffWarning:
      "Unregistration is not available within 24 hours of the event. Contact us on IG or gameonvb.info@gmail.com. No-shows without notice may be charged a fee on the next visit.",
    policyInfo:
      "You can unregister up to 24 hours before the event. Late cancellation or no-shows may be charged a fee.",
    tooLate: "Contact Us",
    unregister: "Unregister",
    confirm: "Confirm",
    cancel: "Cancel",
    confirmQuestion: "Are you sure you want to unregister?",
    unregistering: "Unregistering...",
    loginRequired: "You must be logged in to unregister",
    success: "You have been unregistered from this event",
    error: "Failed to unregister",
  },
};

function getLanguage(): "cs" | "en" {
  if (typeof navigator === "undefined") return "cs";
  const lang = navigator.language?.toLowerCase() || "";
  return lang.startsWith("cs") ? "cs" : "en";
}

export default function UnregisterButton({
  eventId,
  eventFromDate,
  refreshForm,
}: UnregisterButtonProps) {
  const { user, isAuthenticated } = useKindeBrowserClient();
  const [isUnregistering, setIsUnregistering] = useState<boolean>(false);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const router = useRouter();

  const decrementRegistrationCount = useEventRegistrationStore(
    (state) => state.decrementRegistrationCount,
  );

  const lang = getLanguage();
  const t = messages[lang];

  // Check if within 24 hours of event
  const isWithin24Hours = useMemo(() => {
    if (!eventFromDate) return false;
    const eventStart = new Date(eventFromDate);
    const now = new Date();
    const hoursUntilEvent = (eventStart.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilEvent <= 24 && hoursUntilEvent > 0;
  }, [eventFromDate]);

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
      toast.error(t.loginRequired);
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

          toast.success(t.success);

          // If refreshForm callback is provided, call it to reset form state
          if (refreshForm) {
            refreshForm();
          } else {
            // Otherwise, refresh the page to reset all states
            window.location.reload();
          }
        } else {
          toast.error(data.error || t.error);
        }
      } else {
        toast.error(t.error);
      }
    } catch (error) {
      console.error("Error unregistering:", error);
      toast.error(t.error);
    } finally {
      setIsUnregistering(false);
      setShowConfirmation(false);
    }
  };

  // If within 24 hours, show disabled state with warning
  if (isWithin24Hours) {
    return (
      <div className="w-full max-w-md">
        <button
          disabled
          className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-full bg-gray-500/30 px-4 py-2 text-sm font-medium text-white/70"
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
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {t.tooLate}
        </button>
        <p className="mt-2 text-center text-xs text-yellow-300/80">
          {t.cutoffWarning}
        </p>
      </div>
    );
  }

  // If showing confirmation, render the confirmation UI
  // If showing confirmation, render the confirmation UI
  if (showConfirmation) {
    return (
      <div className="w-full max-w-md">
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
            <span>{t.confirmQuestion}</span>
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            <button
              onClick={handleCancel}
              disabled={isUnregistering}
              className="rounded-lg bg-white/20 px-4 py-1.5 text-sm font-medium text-white transition-all hover:bg-white/30 focus:ring-2 focus:ring-white/30 disabled:opacity-50"
            >
              {t.cancel}
            </button>
            <button
              onClick={handleUnregister}
              disabled={isUnregistering}
              className="inline-flex items-center rounded-lg bg-red-500/40 px-4 py-1.5 text-sm font-medium text-white transition-all hover:bg-red-500/60 focus:ring-2 focus:ring-red-500/30 disabled:opacity-50"
            >
              {isUnregistering ? (
                <>
                  <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  {t.unregistering}
                </>
              ) : (
                t.confirm
              )}
            </button>
          </div>
        </div>
        <p className="mt-2 text-center text-xs text-white/50">
          {t.policyInfo}
        </p>
      </div>
    );
  }

  // Otherwise, render the unregister button
  return (
    <div className="w-full max-w-md">
      <button
        onClick={handleShowConfirmation}
        disabled={isUnregistering}
        className="inline-flex w-full items-center justify-center rounded-full bg-red-500/30 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-red-500/50 focus:ring-2 focus:ring-red-500/30 disabled:cursor-not-allowed disabled:opacity-50"
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
        {t.unregister}
      </button>
      <p className="mt-2 text-center text-xs text-white/50">
        {t.policyInfo}
      </p>
    </div>
  );
}

