type Listener = (pending: number) => void;

let pending = 0;
const listeners = new Set<Listener>();

function notify() {
  for (const listener of listeners) {
    listener(pending);
  }
}

export function subscribeApiLoading(listener: Listener): () => void {
  listeners.add(listener);
  listener(pending);
  return () => listeners.delete(listener);
}

export function startApiLoading() {
  pending += 1;
  notify();
}

export function stopApiLoading() {
  pending = Math.max(0, pending - 1);
  notify();
}
