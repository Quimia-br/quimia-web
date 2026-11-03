import { useEffect, useRef, useSyncExternalStore } from "react";
import { useLocation } from "react-router-dom";

function visibleMain(): HTMLElement | undefined {
  return Array.from(document.querySelectorAll<HTMLElement>("[data-route-content]")).find((main) => {
    if (main.matches('[aria-busy="true"]') || main.querySelector("[data-route-loading]"))
      return false;
    for (let element: HTMLElement | null = main; element; element = element.parentElement) {
      if (element.hidden || element.inert || element.getAttribute("aria-hidden") === "true")
        return false;
      const style = getComputedStyle(element);
      if (style.display === "none" || style.visibility === "hidden") return false;
    }
    return true;
  });
}

function subscribeContent(onChange: () => void) {
  const observer = new MutationObserver((records) => {
    if (
      records.some(
        (record) =>
          record.type === "childList" ||
          (record.target instanceof Element &&
            (record.target.matches("[data-route-content]") ||
              record.target.querySelector("[data-route-content]"))),
      )
    )
      onChange();
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["hidden", "aria-hidden", "aria-busy", "style"],
  });
  return () => observer.disconnect();
}
const contentId = () => visibleMain()?.id ?? "";
const serverContentId = () => "";

export default function RouteAccessibility() {
  const { pathname } = useLocation();
  const targetId = useSyncExternalStore(subscribeContent, contentId, serverContentId);
  const previousPath = useRef(pathname);
  const awaitingContent = useRef(false);

  useEffect(() => {
    if (pathname !== previousPath.current) {
      previousPath.current = pathname;
      awaitingContent.current = true;
    }
    if (!awaitingContent.current || !targetId) return;
    const main = visibleMain();
    if (!main) return;
    // Feedback screens already place focus on their own result heading.
    if (!main.contains(document.activeElement) || !document.activeElement?.matches("h1, h2")) {
      main.focus({ preventScroll: true });
    }
    awaitingContent.current = false;
  }, [pathname, targetId]);

  return (
    <a
      href={`#${targetId}`}
      hidden={!targetId}
      className="skip-link"
      onClick={(event) => {
        const main = visibleMain();
        if (!main) return;
        event.preventDefault();
        main.focus({ preventScroll: true });
        main.scrollIntoView?.({ block: "start" });
      }}
    >
      Pular para o conteúdo principal
    </a>
  );
}
