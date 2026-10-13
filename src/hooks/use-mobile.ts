import { useSyncExternalStore } from "react"

const MOBILE_BREAKPOINT = 768

const mobileQuery = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`
const getSnapshot = () => window.matchMedia(mobileQuery).matches
const getServerSnapshot = () => false
function subscribe(onChange: () => void) {
  const media = window.matchMedia(mobileQuery)
  media.addEventListener("change", onChange)
  return () => media.removeEventListener("change", onChange)
}

export function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
