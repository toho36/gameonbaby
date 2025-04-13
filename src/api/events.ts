import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Event } from "~/stores/eventStore";
import useEventStore from "~/stores/eventStore";
import { deleteEvent, updateEvent } from "~/actions/actions";
import { useRouter } from "next/navigation";

// Fetch all events
export const useEvents = () => {
  const setEvents = useEventStore((state) => state.setEvents);
  const setLoading = useEventStore((state) => state.setLoading);
  const setError = useEventStore((state) => state.setError);

  return useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/admin/events");
        const data = await response.json();

        if (data.success) {
          setEvents(data.events);
          return data.events;
        } else {
          throw new Error(data.message || "Failed to load events");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to load events";
        setError(errorMessage);
        throw error;
      } finally {
        setLoading(false);
      }
    },
  });
};

// Delete an event
export const useDeleteEvent = () => {
  const queryClient = useQueryClient();
  const removeEvent = useEventStore((state) => state.removeEvent);

  return useMutation({
    mutationFn: async (eventId: string) => {
      const result = await deleteEvent(eventId);
      if (!result.success) {
        throw new Error(result.error || "Failed to delete event");
      }
      return eventId;
    },
    onSuccess: (eventId) => {
      removeEvent(eventId);
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
};

// Update an event
export const useUpdateEvent = () => {
  const queryClient = useQueryClient();
  const updateEventInStore = useEventStore((state) => state.updateEvent);

  return useMutation({
    mutationFn: async ({
      eventId,
      formData,
    }: {
      eventId: string;
      formData: FormData;
    }) => {
      const result = await updateEvent(eventId, formData);
      if (!result.success) {
        throw new Error(result.error || "Failed to update event");
      }
      // After update, fetch the updated events to get the latest data
      const response = await fetch("/api/admin/events");
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch updated events");
      }

      // Find the updated event in the fetched data
      const updatedEvent = data.events.find(
        (event: Event) => event.id === eventId,
      );
      if (!updatedEvent) {
        throw new Error("Updated event not found in response");
      }

      return updatedEvent;
    },
    onSuccess: (updatedEvent) => {
      updateEventInStore(updatedEvent.id, updatedEvent);
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
};

// Duplicate an event
export const useDuplicateEvent = () => {
  const queryClient = useQueryClient();
  const addEvent = useEventStore((state) => state.addEvent);
  const router = useRouter();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/admin/events/duplicate", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to duplicate event");
      }

      return data.event;
    },
    onSuccess: (newEvent) => {
      // Add the new event to the store
      addEvent(newEvent);

      // No need to invalidate queries or navigate - just update the store
      // This prevents the page refresh
    },
  });
};

// Create an event
export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  const addEvent = useEventStore((state) => state.addEvent);
  const router = useRouter();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/admin/events", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to create event");
      }

      return data.event;
    },
    onSuccess: (newEvent) => {
      // Add the new event to the store
      addEvent(newEvent);

      // No need to invalidate queries or navigate - just update the store
      // This prevents the page refresh
    },
  });
};
