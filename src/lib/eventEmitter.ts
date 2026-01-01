// Simple event emitter for broadcasting real-time updates
// This will be used to notify SSE clients about changes

type EventCallback<T = any> = (data: T) => void;

class EventEmitter {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  // Subscribe to an event
  on<T = any>(event: string, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    const eventListeners = this.listeners.get(event)!;
    eventListeners.add(callback as EventCallback);

    // Return unsubscribe function
    return () => {
      eventListeners.delete(callback as EventCallback);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    };
  }

  // Emit an event to all listeners
  emit<T = any>(event: string, data: T): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for "${event}":`, error);
        }
      });
    }
  }

  // Remove all listeners for an event
  off(event: string): void {
    this.listeners.delete(event);
  }

  // Remove all listeners
  removeAll(): void {
    this.listeners.clear();
  }

  // Get number of listeners for an event
  listenerCount(event: string): number {
    return this.listeners.get(event)?.size || 0;
  }
}

// Export singleton instance
export const eventEmitter = new EventEmitter();

// Export event types for type safety
export type EventTypes = {
  "registration:created": {
    eventId: string;
    registration: any;
    registrationCount: number;
    waitingListCount: number;
  };
  "registration:deleted": {
    eventId: string;
    registrationId: string;
    registrationCount: number;
    waitingListCount: number;
  };
  "waitinglist:added": {
    eventId: string;
    waitingListEntry: any;
    registrationCount: number;
    waitingListCount: number;
  };
  "waitinglist:removed": {
    eventId: string;
    waitingListId: string;
    registrationCount: number;
    waitingListCount: number;
  };
  "participants:updated": {
    eventId: string;
    registrations: any[];
    waitingList: any[];
    registrationCount: number;
    waitingListCount: number;
    capacity: number;
  };
};
