import { useState, useEffect } from "react";

export default function usePaymentPreference() {
  const [paymentPreference, setPaymentPreference] = useState<string>("CARD");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPaymentPreference();
  }, []);

  async function fetchPaymentPreference() {
    try {
      const response = await fetch("/api/user/payment-preference");
      const data = await response.json();
      if (data.success) {
        setPaymentPreference(data.paymentPreference);
      }
    } catch (error) {
      // Handle error silently
    } finally {
      setIsLoading(false);
    }
  }

  async function updatePaymentPreference(preference: string) {
    try {
      setPaymentPreference(preference); // Optimistic update
      const response = await fetch("/api/user/payment-preference", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paymentPreference: preference }),
      });
      const data = await response.json();
      if (!data.success) {
        // If it fails, revert to the fetched preference
        await fetchPaymentPreference();
      }
    } catch (error) {
      // If there's an error, refetch to get the correct state
      await fetchPaymentPreference();
    }
  }

  return {
    paymentPreference,
    setPaymentPreference,
    updatePaymentPreference,
    isLoading,
  };
}
