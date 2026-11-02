import { useSyncExternalStore } from "react";

function container() {
  // Keep assistive controls inside the topmost modal's focus/ARIA scope.
  const dialogs = Array.from(
    document.querySelectorAll<HTMLElement>(
      '[role="dialog"][data-open], [role="alertdialog"][data-open]',
    ),
  );
  return (
    dialogs.findLast((dialog) => !dialog.closest('[aria-hidden="true"], [inert], [hidden]')) ??
    document.body
  );
}

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["data-open", "aria-hidden", "hidden"],
  });
  return () => observer.disconnect();
}

export function useGazePortal() {
  return useSyncExternalStore(subscribe, container, () => document.body);
}
