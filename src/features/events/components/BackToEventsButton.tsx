"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import CheckRegistrationStatus from "./CheckRegistrationStatus";

interface BackToEventsButtonProps {
  eventId: string;
}

export default function BackToEventsButton({
  eventId,
}: BackToEventsButtonProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-center">
        <CheckRegistrationStatus eventId={eventId} />
      </div>
    </div>
  );
}
