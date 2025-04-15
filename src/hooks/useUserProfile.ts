import { useState, useEffect } from "react";
import { UseFormSetValue } from "react-hook-form";
import { RegistrationFormValues } from "~/components/validations";

interface User {
  id?: string;
  name?: string;
  email?: string | null;
  phoneNumber?: string;
  given_name?: string | null;
  family_name?: string | null;
  picture?: string | null;
}

export default function useUserProfile(
  user?: User | null,
  setValue?: UseFormSetValue<RegistrationFormValues>,
) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchUserProfile();
    } else {
      setIsLoading(false);
    }
  }, [user?.id]);

  async function fetchUserProfile() {
    try {
      const response = await fetch("/api/user/profile");
      const data = await response.json();
      if (data.success) {
        // Update form values if setValue is provided
        if (setValue) {
          if (data.user.name) {
            const nameParts = data.user.name.split(" ");
            setValue("firstName", nameParts[0] || "");
            setValue("lastName", nameParts.slice(1).join(" ") || "");
          } else if (user?.given_name) {
            setValue("firstName", user.given_name);
            setValue("lastName", user?.family_name || "");
          }

          if (data.user.email || user?.email) {
            setValue("email", data.user.email || user?.email || "");
          }

          if (data.user.phoneNumber) {
            setValue("phoneNumber", data.user.phoneNumber);
          }
        }
      }
    } catch (error) {
      // Handle error silently
    } finally {
      setIsLoading(false);
    }
  }

  return {
    isLoading,
    fetchUserProfile,
  };
}
