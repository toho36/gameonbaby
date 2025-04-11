"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function EventRegistrationsRedirect({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEventAndRedirect() {
      try {
        // Redirect to the correct URL format that includes both id and eventId
        // In this case, we use the same ID for both parameters
        router.push(`/admin/events/${params.id}/${params.id}/registrations`);
      } catch (err) {
        setError("Error redirecting to registrations page");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchEventAndRedirect();
  }, [params.id, router]);

  if (error) {
    return (
      <div className="flex h-32 items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex h-32 items-center justify-center">
      <p className="text-lg">Redirecting to registrations page...</p>
    </div>
  );
}
