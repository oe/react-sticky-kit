type Write = () => (() => void) | void;
type Client = { read: () => Write | undefined; resize: () => void; scrollEnabled: boolean };
const clients = new Set<Client>();
const pending = new Set<Client>();
let frame: number | null = null;

function schedule(client: Client) {
  if (!clients.has(client)) return;
  pending.add(client);
  frame ??= requestAnimationFrame(flush);
}
function scroll() {
  for (const client of clients) if (client.scrollEnabled) schedule(client);
}
function resize() {
  for (const client of clients) {
    client.resize();
    schedule(client);
  }
}
function flush() {
  frame = null;
  const batch = [...pending];
  pending.clear();
  const writes: { client: Client; write: Write }[] = [];
  const notifications: { client: Client; notify: () => void }[] = [];
  const errors: unknown[] = [];
  // Read every container before any container writes, including nested groups.
  for (const client of batch) {
    if (!clients.has(client)) continue;
    try {
      const write = client.read();
      if (write) writes.push({ client, write });
    } catch (error) { errors.push(error); }
  }
  for (const { client, write } of writes) {
    if (!clients.has(client)) continue;
    try {
      const notify = write();
      if (notify) notifications.push({ client, notify });
    } catch (error) { errors.push(error); }
  }
  // Consumer callbacks can synchronously change or unmount another container.
  for (const { client, notify } of notifications) {
    if (!clients.has(client)) continue;
    try { notify(); } catch (error) { errors.push(error); }
  }
  // A user callback must not prevent other containers from updating.
  if (errors.length) throw errors[0];
}

export function subscribeUpdates(read: Client['read'], invalidate: () => void) {
  const client = { read, resize: invalidate, scrollEnabled: true };
  if (!clients.size) {
    window.addEventListener('scroll', scroll, { passive: true, capture: true });
    window.addEventListener('resize', resize, { passive: true });
  }
  clients.add(client);
  schedule(client);
  return {
    schedule: () => schedule(client),
    setScrollEnabled: (enabled: boolean) => { client.scrollEnabled = enabled; },
    stop: () => {
      clients.delete(client);
      pending.delete(client);
      if (!pending.size && frame !== null) {
        cancelAnimationFrame(frame);
        frame = null;
      }
      if (!clients.size) {
        window.removeEventListener('scroll', scroll, true);
        window.removeEventListener('resize', resize);
      }
    },
  };
}
