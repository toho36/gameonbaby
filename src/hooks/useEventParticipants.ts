"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";

interface Participant {
  id?: string;
  first_name: string;
  last_name: string | null;
  created_at: Date;
  email?: string;
  payment_type?: string;
  attended?: boolean;
}

interface SSEData {
  type: "participants:update" | "heartbeat" | "error";
  data?: {
    registrations: Participant[];
    waitingList: Participant[];
    registrationCount: number;
    waitingListCount: number;
    capacity: number;
    isModerator?: boolean;
  };
  message?: string;
}

export function useEventParticipants(
  eventId: string,
  initialData?: {
    registrations: Participant[];
    waitingList: Participant[];
    registrationCount: number;
    waitingListCount: number;
    capacity: number;
    isModerator?: boolean;
  }
) {
  const [registrations, setRegistrations] = useState<Participant[]>(initialData?.registrations || []);
  const [waitingList, setWaitingList] = useState<Participant[]>(initialData?.waitingList || []);
  const [registrationCount, setRegistrationCount] = useState<number>(initialData?.registrationCount || 0);
  const [waitingListCount, setWaitingListCount] = useState<number>(initialData?.waitingListCount || 0);
  const [capacity, setCapacity] = useState<number>(initialData?.capacity || 0);
  const [isModerator, setIsModerator] = useState<boolean>(initialData?.isModerator || false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useKindeBrowserClient();

  // Function to connect to SSE endpoint
  const connect = useCallback(() => {
    if (!eventId || eventSourceRef.current) return;

    try {
      const eventSource = new EventSource(
        `/api/events/${eventId}/participants/stream`
      );

      eventSource.onopen = () => {
        console.log("SSE Connected for event:", eventId);
        setIsConnected(true);
        setError(null);
      };

      eventSource.onmessage = (event) => {
        try {
          const data: SSEData = JSON.parse(event.data);

          switch (data.type) {
            case "participants:update":
              if (data.data) {
                setRegistrations(data.data.registrations);
                setWaitingList(data.data.waitingList);
                setRegistrationCount(data.data.registrationCount);
                setWaitingListCount(data.data.waitingListCount);
                setCapacity(data.data.capacity);
                if (data.data.isModerator !== undefined) {
                  setIsModerator(data.data.isModerator);
                }
              }
              break;

            case "heartbeat":
              // Keep connection alive
              break;

            case "error":
              console.error("SSE Error:", data.message);
              setError(data.message || "Connection error");
              break;
          }
        } catch (err) {
          console.error("Failed to parse SSE message:", err);
        }
      };

      eventSource.onerror = () => {
        console.log("SSE Connection error, attempting to reconnect...");
        setIsConnected(false);
        eventSource.close();
        eventSourceRef.current = null;

        // Auto reconnect after 5 seconds
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }

        reconnectTimeoutRef.current = setTimeout(() => {
          console.log("Attempting to reconnect...");
          connect();
        }, 5000);
      };

      eventSourceRef.current = eventSource;
    } catch (err) {
      console.error("Failed to create EventSource:", err);
      setError("Failed to establish connection");
    }
  }, [eventId]);

  // Function to disconnect
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setIsConnected(false);
  }, []);

  // Connect on mount and clean up on unmount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Reconnect when user changes (to update permissions)
  useEffect(() => {
    if (isConnected) {
      // Force reconnect to get updated moderator status
      disconnect();
      setTimeout(connect, 100);
    }
  }, [user?.id, isConnected, connect, disconnect]);

  return {
    registrations,
    waitingList,
    registrationCount,
    waitingListCount,
    capacity,
    isModerator,
    isConnected,
    error,
  };
}
