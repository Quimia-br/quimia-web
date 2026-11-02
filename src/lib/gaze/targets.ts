const selector =
  'button, a[href], input, textarea, select, [role="button"], [role="link"], [role="checkbox"], [role="switch"], [role="radio"], [role="tab"], [role="menuitem"], [role="option"], [role="slider"], [contenteditable="true"]';

function usable(element: HTMLElement) {
  if (!element.isConnected) return false;
  let current: HTMLElement | null = element;
  while (current) {
    if (
      current.closest('[inert], [hidden], [aria-hidden="true"], [aria-disabled="true"], :disabled')
    )
      return false;
    const root = current.getRootNode();
    current = root instanceof ShadowRoot && root.host instanceof HTMLElement ? root.host : null;
  }
  return true;
}

export function targetAt(x: number, y: number): HTMLElement | null {
  let hit = document.elementFromPoint(x, y);
  while (hit?.shadowRoot?.elementFromPoint) {
    const inner = hit.shadowRoot.elementFromPoint(x, y);
    if (!inner || inner === hit) break;
    hit = inner;
  }
  const element = hit?.closest<HTMLElement>(selector);
  return element && usable(element) ? element : null;
}

export function activateTarget(element: HTMLElement) {
  if (!usable(element)) return;
  element.focus({ preventScroll: true });
  if (element.matches('textarea, select, [contenteditable="true"], [role="slider"]')) return;
  if (
    element instanceof HTMLInputElement &&
    !["checkbox", "radio", "button", "submit", "reset"].includes(element.type)
  )
    return;
  element.click();
}

export function scrollContent(direction: number) {
  // The app scrolls within viewports rather than the window; choose the largest visible one.
  const candidates = Array.from(
    document.querySelectorAll<HTMLElement>(
      '[data-slot="scroll-area-viewport"], main, [role="dialog"]',
    ),
  );
  const visible = candidates.filter((element) => {
    const bounds = element.getBoundingClientRect();
    return (
      element.scrollHeight > element.clientHeight + 1 &&
      bounds.width > 0 &&
      bounds.height > 0 &&
      bounds.bottom > 0 &&
      bounds.top < innerHeight &&
      !element.closest('[inert], [hidden], [aria-hidden="true"]')
    );
  });
  visible.sort((a, b) => b.clientHeight * b.clientWidth - a.clientHeight * a.clientWidth);
  const container = visible[0];
  if (container)
    container.scrollBy({ top: direction * container.clientHeight * 0.65, behavior: "instant" });
  else window.scrollBy({ top: direction * innerHeight * 0.65, behavior: "instant" });
}
