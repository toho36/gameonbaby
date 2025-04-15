import React from "react";

interface DuplicateRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  nameError?: boolean;
  duplicateName?: string;
}

export default function DuplicateRegistrationModal({
  isOpen,
  onClose,
  email,
  nameError = false,
  duplicateName = "",
}: DuplicateRegistrationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/80 backdrop-blur-md transition-all duration-300">
      <div className="relative mx-auto my-6 w-full max-w-md transform p-4 transition-all duration-300 ease-in-out">
        <div className="relative flex flex-col rounded-xl border border-white/20 bg-gradient-to-br from-purple-900 to-indigo-900 p-6 text-white shadow-xl">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center">
              <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-amber-400"
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
              </div>
              <h3 className="text-xl font-bold text-white">
                Already Registered
              </h3>
            </div>
            <button
              className="ml-auto rounded-full p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/30"
              onClick={onClose}
              aria-label="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="mb-6 rounded-lg bg-white/10 p-4">
            {nameError ? (
              <div className="space-y-2">
                <p className="text-white/90">
                  <span className="font-bold text-white">{duplicateName}</span>{" "}
                  is already registered for this event with your email address.
                </p>
                <p className="text-sm text-white/80">
                  Each participant must have a unique name for the same email.
                </p>
              </div>
            ) : (
              <p className="text-white/90">
                This email <span className="font-bold text-white">{email}</span>{" "}
                is already registered for this event.
              </p>
            )}
          </div>
          <div className="flex justify-end">
            <button
              className="rounded-lg bg-white/20 px-5 py-2.5 font-medium text-white transition hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/30"
              type="button"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
