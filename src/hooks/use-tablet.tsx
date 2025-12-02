import * as React from "react"

const TABLET_MIN_WIDTH = 768
const TABLET_MAX_WIDTH = 1366 // Increased to cover modern iPads in landscape

// Helper functions to detect immediately (avoid flash)
function getIsTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

function getIsTablet(): boolean {
  if (typeof window === 'undefined') return false;
  const width = window.innerWidth;
  const isTouch = getIsTouchDevice();
  
  // Detect tablet if:
  // 1. Touch device with width in tablet range (768-1366px) - covers all iPads
  // 2. OR classic tablet width range (768-1024) for non-touch scenarios
  // Excludes smartphones (< 768px) and large desktops (> 1366px)
  return (isTouch && width >= TABLET_MIN_WIDTH && width <= TABLET_MAX_WIDTH) || 
         (!isTouch && width >= TABLET_MIN_WIDTH && width <= 1024);
}

export function useIsTablet() {
  // Initialize with correct value IMMEDIATELY to prevent flash
  const [isTablet, setIsTablet] = React.useState<boolean>(getIsTablet)
  const [isTouchDevice, setIsTouchDevice] = React.useState<boolean>(getIsTouchDevice)

  React.useEffect(() => {
    const handleResize = () => {
      setIsTablet(getIsTablet())
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return { isTablet, isTouchDevice }
}
