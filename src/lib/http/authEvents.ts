type AuthEvent = "unauthorized";
type Listener = () => void;

const listeners = new Map<AuthEvent, Set<Listener>>();

export function onAuthEvent(event: AuthEvent, listener: Listener): () => void {
  const set = listeners.get(event) ?? new Set();
  set.add(listener);
  listeners.set(event, set);
  return () => set.delete(listener);
}

export function emitAuthEvent(event: AuthEvent): void {
  listeners.get(event)?.forEach((listener) => listener());
}
