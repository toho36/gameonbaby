import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useRegistrationStore from "~/stores/registrationStore";
import { toast } from "react-hot-toast";
import { NextResponse } from "next/server";

// Fetch registrations for an event
export const useRegistrations = (eventId: string) => {
  const setRegistrations = useRegistrationStore(
    (state) => state.setRegistrations,
  );
  const setLoading = useRegistrationStore((state) => state.setLoading);
  const setError = useRegistrationStore((state) => state.setError);
  const setCurrentEventId = useRegistrationStore(
    (state) => state.setCurrentEventId,
  );

  return useQuery({
    queryKey: ["registrations", eventId],
    queryFn: async () => {
      if (!eventId) return [];

      setLoading(true);
      setCurrentEventId(eventId);

      try {
        const response = await fetch(
          `/api/admin/events/${eventId}/registrations`,
        );
        const data = await response.json();

        if (data.success) {
          // Map the API response to the Registration interface format
          const mappedRegistrations = data.registrations.map((reg: any) => ({
            id: reg.id,
            eventId: eventId,
            userId: reg.userId || reg.email, // Use email as userId if not provided
            status: reg.paid ? "PAID" : "UNPAID",
            paymentMethod: reg.paymentType,
            attended: reg.attended || false,
            createdAt: reg.createdAt,
            user: {
              name:
                `${reg.firstName || ""} ${reg.lastName || ""}`.trim() || null,
              email: reg.email || null,
              phone: reg.phoneNumber || null,
            },
          }));

          setRegistrations(mappedRegistrations);
          return mappedRegistrations;
        } else {
          throw new Error(data.message || "Failed to load registrations");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to load registrations";
        setError(errorMessage);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    enabled: !!eventId,
  });
};

// Update registration status
export const useUpdateRegistration = () => {
  const queryClient = useQueryClient();
  const updateRegistrationInStore = useRegistrationStore(
    (state) => state.updateRegistration,
  );
  const currentEventId = useRegistrationStore((state) => state.currentEventId);

  return useMutation({
    mutationFn: async ({
      registrationId,
      updates,
    }: {
      registrationId: string;
      updates: {
        status?: string;
        attended?: boolean;
        paymentMethod?: string;
      };
    }) => {
      let endpoint = "";
      let method = "POST";
      const body: any = {};

      // Determine the correct endpoint to use based on what's being updated
      if (updates.status !== undefined) {
        endpoint = `/api/admin/registrations/toggle-payment`;
        body.registrationId = registrationId;
        body.paid = updates.status === "PAID";
      } else if (updates.attended !== undefined) {
        endpoint = `/api/admin/registrations/toggle-attendance`;
        body.registrationId = registrationId;
        body.attended = updates.attended;
      } else if (updates.paymentMethod !== undefined) {
        endpoint = `/api/admin/registrations/${registrationId}`;
        method = "PATCH";
        body.paymentMethod = updates.paymentMethod;
      } else {
        throw new Error("No valid update field provided");
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to update registration");
      }

      return { registrationId, updates };
    },
    onSuccess: ({ registrationId, updates }) => {
      // Update local store without triggering a full refetch
      updateRegistrationInStore(registrationId, updates);

      // Don't invalidate the query to avoid full refresh
      if (currentEventId) {
        queryClient.invalidateQueries({
          queryKey: ["registrations", currentEventId],
        });
        // Also invalidate events to refresh the registration count
        queryClient.invalidateQueries({
          queryKey: ["events"],
        });
      }

      // Show a success message
      if (updates.status !== undefined) {
        toast.success(
          updates.status === "PAID"
            ? "Payment marked as paid"
            : "Payment marked as unpaid",
        );
      } else if (updates.attended !== undefined) {
        toast.success(
          updates.attended ? "Attendance marked" : "Attendance unmarked",
        );
      } else if (updates.paymentMethod !== undefined) {
        toast.success("Payment method updated");
      }
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update registration",
      );
    },
  });
};

// Delete registration
export const useDeleteRegistration = () => {
  const queryClient = useQueryClient();
  const removeRegistration = useRegistrationStore(
    (state) => state.removeRegistration,
  );
  const currentEventId = useRegistrationStore((state) => state.currentEventId);

  return useMutation({
    mutationFn: async (registrationId: string) => {
      const response = await fetch(
        `/api/admin/registrations/${registrationId}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to delete registration");
      }

      return registrationId;
    },
    onSuccess: (registrationId) => {
      // Update store state directly without a full refetch
      removeRegistration(registrationId);

      // Don't invalidate the query to avoid full refresh
      if (currentEventId) {
        queryClient.invalidateQueries({
          queryKey: ["registrations", currentEventId],
        });
        // Also invalidate events to refresh the registration count
        queryClient.invalidateQueries({
          queryKey: ["events"],
        });
      }

      toast.success("Registration marked as deleted successfully");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete registration",
      );
    },
  });
};

// New function to duplicate a registration with direct store update
export async function duplicateRegistrationWithDirectUpdate(
  registration: any,
  eventId: string,
  setProcessing: (id: string | null) => void,
) {
  try {
    setProcessing("duplicate" + registration.id);

    // Get store reference
    const store = useRegistrationStore.getState();

    // Split name into first name and last name
    const nameParts = registration.user?.name?.split(" ") || [];
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    // Call API to duplicate the registration
    const response = await fetch("/api/admin/registrations/duplicate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventId,
        firstName: `${firstName} (Copy)`,
        lastName,
        email: registration.user?.email || "",
        phoneNumber: registration.user?.phone || "",
        paymentType: registration.paymentMethod || "CASH",
      }),
    });

    const data = await response.json();

    if (data.success && data.registration) {
      // Construct new registration object
      const newRegistration = {
        id: data.registration.id,
        eventId,
        userId: registration.userId || "",
        status: "UNPAID",
        attended: false,
        createdAt: data.registration.createdAt,
        paymentMethod: data.registration.paymentType,
        user: {
          name: `${data.registration.firstName} ${data.registration.lastName}`.trim(),
          email: data.registration.email,
          phone: data.registration.phoneNumber,
        },
      };

      // Add to store
      store.addRegistration(newRegistration);
      toast.success("Registration duplicated successfully");
      return true;
    } else {
      toast.error(data.message || "Failed to duplicate registration");
      return false;
    }
  } catch (error) {
    console.error("Error duplicating registration:", error);
    toast.error("Failed to duplicate registration");
    return false;
  } finally {
    setProcessing(null);
  }
}
