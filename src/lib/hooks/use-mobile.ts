import * as React from "react"

const MOBILE_BREAKPOINT = 1024

export function useIsMobile() {
  // Start with undefined to indicate we haven't checked yet
  // This allows components to handle the loading state appropriately
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    // Create a function to check mobile state
    const checkMobile = () => {
      return window.innerWidth < MOBILE_BREAKPOINT
    }
    
    // Set the initial value immediately
    setIsMobile(checkMobile())
    
    // Create media query listener for responsive changes
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    // Handler for media query changes
    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches)
    }
    
    // Add event listener
    mql.addEventListener("change", handleChange)
    
    // Cleanup
    return () => {
      mql.removeEventListener("change", handleChange)
    }
  }, [])

  // Return the actual state
  // undefined = still loading (during SSR and initial hydration)
  // boolean = actual mobile/desktop state after hydration
  return isMobile
}
