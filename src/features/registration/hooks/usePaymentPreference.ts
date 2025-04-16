"use client";

import { useState, useEffect, useCallback } from "react";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";

// Cache for payment preference data across hook instances
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let cachedPaymentPreference: string | null = null;
let cacheTimestamp: number | null = null;

export default function usePaymentPreference() {
  const [paymentPreference, setPaymentPreference] = useState<string>("CARD");
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, isLoading: authLoading } = useKindeBrowserClient();

  // Memoized fetch function to avoid recreation on each render
  const fetchPaymentPreference = useCallback(async (skipCache = false) => {
    // Check if we have a valid cached value
    const now = Date.now();
    if (
      !skipCache &&
      cachedPaymentPreference !== null &&
      cacheTimestamp !== null &&
      now - cacheTimestamp < CACHE_DURATION
    ) {
      setPaymentPreference(cachedPaymentPreference);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/user/payment-preference");
      const data = await response.json();
      if (data.success) {
        setPaymentPreference(data.paymentPreference);

        // Update the cache
        cachedPaymentPreference = data.paymentPreference;
        cacheTimestamp = Date.now();
      }
    } catch (error) {
      // Handle error silently
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only fetch payment preference if authentication check is complete and user is authenticated
    if (!authLoading && isAuthenticated) {
      fetchPaymentPreference();
    } else if (!authLoading) {
      // If auth check is complete and user is not authenticated, stop loading
      setIsLoading(false);
    }
  }, [isAuthenticated, authLoading, fetchPaymentPreference]);

  const updatePaymentPreference = useCallback(
    async (preference: string) => {
      try {
        setPaymentPreference(preference); // Optimistic update

        // Update the cache immediately
        cachedPaymentPreference = preference;
        cacheTimestamp = Date.now();

        const response = await fetch("/api/user/payment-preference", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ paymentPreference: preference }),
        });
        const data = await response.json();
        if (!data.success) {
          // If it fails, revert to the fetched preference and invalidate cache
          cachedPaymentPreference = null;
          cacheTimestamp = null;
          await fetchPaymentPreference(true);
        }
      } catch (error) {
        // If there's an error, refetch to get the correct state
        cachedPaymentPreference = null;
        cacheTimestamp = null;
        await fetchPaymentPreference(true);
      }
    },
    [fetchPaymentPreference],
  );

  return {
    paymentPreference,
    setPaymentPreference,
    updatePaymentPreference,
    isLoading,
  };
}
