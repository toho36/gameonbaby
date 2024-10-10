"use client";
// File: components/LatestEvent.tsx

import { useEffect, useState } from "react";

const LatestEvent = () => {
  const [event, setEvent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLatestEvent = async () => {
      try {
        const response = await fetch("/api/events/latest"); // Adjust this to your actual API route
        if (!response.ok) {
          throw new Error("Failed to fetch the latest event.");
        }
        const data = await response.json();
        setEvent(data);
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchLatestEvent();
  }, []);

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!event) {
    return <div>Loading...</div>;
  }

  const eventWithId = event as {
    id: number;
    price: number;
    from: string;
    to: string;
  };

  return (
    <div>
      <h1>Latest Event</h1>
      <p>ID: {eventWithId.id}</p>
      <p>Price: ${eventWithId.price}</p>
      <p>From: {new Date(eventWithId.from).toLocaleString()}</p>
      <p>To: {new Date(eventWithId.to).toLocaleString()}</p>
    </div>
  );
};

export default LatestEvent;
