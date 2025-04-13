import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { User } from "~/stores/userStore";
import useUserStore from "~/stores/userStore";

// Fetch users
export const useUsers = (searchQuery = "") => {
  const setUsers = useUserStore((state) => state.setUsers);
  const setLoading = useUserStore((state) => state.setLoading);
  const setError = useUserStore((state) => state.setError);

  return useQuery({
    queryKey: ["users", searchQuery],
    queryFn: async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/users?search=${searchQuery}`);
        const data = await response.json();

        if (data.success) {
          setUsers(data.users);
          return data.users;
        } else {
          throw new Error(data.message || "Failed to load users");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to load users";
        setError(errorMessage);
        throw error;
      } finally {
        setLoading(false);
      }
    },
  });
};

// Update user role
export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  const updateUserRoleInStore = useUserStore((state) => state.updateUserRole);

  return useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: "USER" | "REGULAR" | "MODERATOR" | "ADMIN";
    }) => {
      const response = await fetch("/api/admin/users/update-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, role }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to update user role");
      }

      return { userId, role };
    },
    onSuccess: ({ userId, role }) => {
      updateUserRoleInStore(userId, role);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};
