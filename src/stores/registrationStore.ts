import { create } from "zustand";

export interface Registration {
  id: string;
  eventId: string;
  userId: string;
  user: {
    name: string | null;
    email: string | null;
    phone: string | null;
  };
  status: string;
  paymentMethod: string | null;
  attended: boolean;
  createdAt: string;
}

interface RegistrationStore {
  registrations: Registration[];
  loading: boolean;
  error: string | null;
  currentEventId: string | null;
  compactView: boolean;

  // Actions
  setRegistrations: (registrations: Registration[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentEventId: (eventId: string | null) => void;
  setCompactView: (compact: boolean) => void;

  // CRUD operations
  addRegistration: (registration: Registration) => void;
  updateRegistration: (
    id: string,
    updatedRegistration: Partial<Registration>,
  ) => void;
  removeRegistration: (id: string) => void;
}

const useRegistrationStore = create<RegistrationStore>((set) => ({
  registrations: [],
  loading: false,
  error: null,
  currentEventId: null,
  compactView: false,

  // Actions
  setRegistrations: (registrations) => set({ registrations }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setCurrentEventId: (currentEventId) => set({ currentEventId }),
  setCompactView: (compactView) => set({ compactView }),

  // CRUD operations
  addRegistration: (registration) =>
    set((state) => ({
      registrations: [...state.registrations, registration],
    })),

  updateRegistration: (id, updatedRegistration) =>
    set((state) => ({
      registrations: state.registrations.map((registration) =>
        registration.id === id
          ? { ...registration, ...updatedRegistration }
          : registration,
      ),
    })),

  removeRegistration: (id) =>
    set((state) => ({
      registrations: state.registrations.filter(
        (registration) => registration.id !== id,
      ),
    })),
}));

export default useRegistrationStore;
