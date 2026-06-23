class EventBus {
  constructor() {
    this._listeners = new Map();
  }

  on(event, handler) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    const handlers = this._listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) this._listeners.delete(event);
    }
  }

  emit(event, payload) {
    const handlers = this._listeners.get(event);
    if (handlers) {
      handlers.forEach(fn => {
        try { fn(payload); } catch (e) { console.error(`[EventBus] ${event}:`, e); }
      });
    }
  }

  clear() {
    this._listeners.clear();
  }
}

export const eventBus = new EventBus();
