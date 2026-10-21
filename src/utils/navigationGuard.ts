let guard: (() => boolean) | undefined;
export function setNavigationGuard(next: () => boolean) {
  guard = next;
  return () => { if (guard === next) guard = undefined; };
}
export function canNavigate() { return !guard || guard(); }
export function clearNavigationGuard() { guard = undefined; }
