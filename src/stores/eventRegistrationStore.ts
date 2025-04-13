import { create } from "zustand";

interface EventRegistrationState {
  registrationCount: number;
  capacity: number;
  setRegistrationCount: (count: number) => void;
  incrementRegistrationCount: () => void;
  decrementRegistrationCount: () => void;
  setCapacity: (capacity: number) => void;
  initialize: (registrationCount: number, capacity: number) => void;
}

export const useEventRegistrationStore = create<EventRegistrationState>(
  (set) => ({
    registrationCount: 0,
    capacity: 0,
    setRegistrationCount: (count: number) => set({ registrationCount: count }),
    incrementRegistrationCount: () =>
      set((state) => ({ registrationCount: state.registrationCount + 1 })),
    decrementRegistrationCount: () =>
      set((state) => ({
        registrationCount: Math.max(0, state.registrationCount - 1),
      })),
    setCapacity: (capacity: number) => set({ capacity }),
    initialize: (registrationCount: number, capacity: number) =>
      set({ registrationCount, capacity }),
  }),
);
