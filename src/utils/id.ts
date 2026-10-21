/** Mobile LAN previews can run on plain HTTP, where randomUUID isn't exposed. */
export function createId(): string {
  return globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}
