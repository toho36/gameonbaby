import { Registration } from "~/stores/registrationStore";
import { toast } from "react-hot-toast";
import useRegistrationStore from "~/stores/registrationStore";
import { QueryClient } from "@tanstack/react-query";

export async function duplicateRegistration(
  registration: Registration,
  eventId: string,
  setProcessing: (id: string | null) => void,
  refetch: () => void,
  queryClient?: QueryClient,
) {
  try {
    setProcessing("duplicate" + registration.id);

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
        eventId: eventId,
        firstName: `${firstName} (Copy)`,
        lastName: lastName,
        email: registration.user?.email || "",
        phoneNumber: registration.user?.phone || "",
        paymentType: registration.paymentMethod || "CASH",
      }),
    });

    const data = await response.json();

    if (data.success) {
      if (data.registration) {
        // Add the new registration to the store instead of full refetch
        const addRegistration = useRegistrationStore.getState().addRegistration;

        // Create a new registration object based on the API response
        const newRegistration: Registration = {
          id: data.registration.id,
          eventId: eventId,
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

        // Add the new registration to the store
        addRegistration(newRegistration);

        // Invalidate events query to refresh counts
        if (queryClient) {
          queryClient.invalidateQueries({
            queryKey: ["events"],
          });
        }

        toast.success("Registration duplicated successfully");
      } else {
        // Fallback to refetch if response doesn't include registration data
        refetch();

        // Invalidate events query to refresh counts
        if (queryClient) {
          queryClient.invalidateQueries({
            queryKey: ["events"],
          });
        }

        toast.success("Registration duplicated successfully");
      }
    } else {
      toast.error(data.message || "Failed to duplicate registration");
    }
  } catch (error) {
    console.error("Error duplicating registration:", error);
    toast.error("Failed to duplicate registration");
  } finally {
    setProcessing(null);
  }
}
