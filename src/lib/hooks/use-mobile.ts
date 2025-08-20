import * as React from "react"

const MOBILE_BREAKPOINT = 1024

export function useIsMobile() {
  // Initialize with false to match server-side rendering
  // This prevents hydration mismatch since server always renders as desktop initially
  const [isMobile, setIsMobile] = React.useState(false)
  const [isInitialized, setIsInitialized] = React.useState(false)

  React.useEffect(() => {
    // Match Tailwind's lg breakpoint exactly (min-width: 1024px)
    // So mobile is anything below 1024px (includes tablets)
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 0.02}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Set initial state and mark as initialized
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    setIsInitialized(true)
    
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  // During SSR and initial hydration, always return false to match server rendering
  // This ensures consistent behavior and prevents hydration mismatches
  return isInitialized ? isMobile : false
}
