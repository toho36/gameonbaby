"use client";

import { useEffect } from "react";
import { useEventRegistrationStore } from "~/stores/eventRegistrationStore";

interface CapacityDisplayProps {
  initialRegCount: number;
  capacity: number;
}

export default function CapacityDisplay({
  initialRegCount,
  capacity,
}: CapacityDisplayProps) {
  const { registrationCount, initialize } = useEventRegistrationStore();

  // Initialize the store with the initial values if needed
  useEffect(() => {
    initialize(initialRegCount, capacity);
  }, [initialize, initialRegCount, capacity]);

  // Calculate spots left
  const spotsLeft = capacity - registrationCount;

  return (
    <div className="overflow-hidden rounded-xl bg-white/10 p-5 shadow-md backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Capacity</h2>
        <div className="text-2xl font-bold text-white">
          {registrationCount} / {capacity}
        </div>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/20">
        <div
          className="h-2.5 rounded-full bg-white"
          style={{
            width: `${Math.min(100, (registrationCount / capacity) * 100)}%`,
          }}
        ></div>
      </div>
      {spotsLeft > 0 ? (
        <div className="mt-2 text-right text-sm text-white/80">
          {spotsLeft} spots left
        </div>
      ) : (
        <div className="mt-2 text-right text-sm text-orange-200">
          Event is full
        </div>
      )}
    </div>
  );
}
