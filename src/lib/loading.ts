type Listener = (loading: boolean) => void;

let loading = false;
const listeners = new Set<Listener>();

export function startAppLoading() {
  if (loading) return;
  loading = true;
  listeners.forEach((listener) => listener(true));
}

export function stopAppLoading() {
  if (!loading) return;
  loading = false;
  listeners.forEach((listener) => listener(false));
}

export function getAppLoading() {
  return loading;
}

export function subscribeAppLoading(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
