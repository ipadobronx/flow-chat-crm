import * as React from "react"

const TABLET_MIN_WIDTH = 768
const TABLET_MAX_WIDTH = 1024

// Helper functions to detect immediately (avoid flash)
function getIsTablet(): boolean {
  if (typeof window === 'undefined') return false;
  const width = window.innerWidth;
  return width >= TABLET_MIN_WIDTH && width <= TABLET_MAX_WIDTH;
}

function getIsTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

export function useIsTablet() {
  // Initialize with correct value IMMEDIATELY to prevent flash
  const [isTablet, setIsTablet] = React.useState<boolean>(getIsTablet)
  const [isTouchDevice, setIsTouchDevice] = React.useState<boolean>(getIsTouchDevice)

  React.useEffect(() => {
    const checkTablet = () => {
      setIsTablet(getIsTablet())
    }

    const mql = window.matchMedia(`(min-width: ${TABLET_MIN_WIDTH}px) and (max-width: ${TABLET_MAX_WIDTH}px)`)
    const onChange = () => checkTablet()
    
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return { isTablet, isTouchDevice }
}
