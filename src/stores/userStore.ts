import { create } from "zustand";

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: "USER" | "REGULAR" | "MODERATOR" | "ADMIN";
}

interface UserStore {
  users: User[];
  loading: boolean;
  error: string | null;
  search: string;

  // Actions
  setUsers: (users: User[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearch: (search: string) => void;

  // CRUD operations
  updateUserRole: (
    userId: string,
    role: "USER" | "REGULAR" | "MODERATOR" | "ADMIN",
  ) => void;
}

const useUserStore = create<UserStore>((set) => ({
  users: [],
  loading: false,
  error: null,
  search: "",

  // Actions
  setUsers: (users) => set({ users }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSearch: (search) => set({ search }),

  // CRUD operations
  updateUserRole: (userId, role) =>
    set((state) => ({
      users: state.users.map((user) =>
        user.id === userId ? { ...user, role } : user,
      ),
    })),
}));

export default useUserStore;
