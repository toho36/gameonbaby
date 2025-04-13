import { create } from "zustand";

export interface Event {
  id: string;
  title: string;
  description: string | null;
  price: number;
  place: string | null;
  capacity: number;
  from: string;
  to: string;
  visible: boolean;
  created_at: string;
  _count: {
    Registration: number;
  };
}

interface EventStore {
  events: Event[];
  loading: boolean;
  error: string | null;
  sortOrder: "asc" | "desc";
  showPastEvents: boolean;

  // Actions
  setEvents: (events: Event[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSortOrder: (order: "asc" | "desc") => void;
  setShowPastEvents: (show: boolean) => void;

  // CRUD operations
  addEvent: (event: Event) => void;
  updateEvent: (id: string, updatedEvent: Partial<Event>) => void;
  removeEvent: (id: string) => void;
}

const useEventStore = create<EventStore>((set) => ({
  events: [],
  loading: false,
  error: null,
  sortOrder: "desc",
  showPastEvents: false,

  // Actions
  setEvents: (events) => set({ events }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSortOrder: (sortOrder) => set({ sortOrder }),
  setShowPastEvents: (showPastEvents) => set({ showPastEvents }),

  // CRUD operations
  addEvent: (event) =>
    set((state) => ({
      events: [...state.events, event],
    })),

  updateEvent: (id, updatedEvent) =>
    set((state) => ({
      events: state.events.map((event) =>
        event.id === id ? { ...event, ...updatedEvent } : event,
      ),
    })),

  removeEvent: (id) =>
    set((state) => ({
      events: state.events.filter((event) => event.id !== id),
    })),
}));

export default useEventStore;
