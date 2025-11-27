import * as React from "react"

const TABLET_MIN_WIDTH = 768
const TABLET_MAX_WIDTH = 1024

export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean>(false)
  const [isTouchDevice, setIsTouchDevice] = React.useState<boolean>(false)

  React.useEffect(() => {
    const checkTablet = () => {
      const width = window.innerWidth
      const isTabletSize = width >= TABLET_MIN_WIDTH && width <= TABLET_MAX_WIDTH
      setIsTablet(isTabletSize)
    }

    const checkTouch = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0)
    }

    checkTablet()
    checkTouch()

    const mql = window.matchMedia(`(min-width: ${TABLET_MIN_WIDTH}px) and (max-width: ${TABLET_MAX_WIDTH}px)`)
    const onChange = () => checkTablet()
    
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return { isTablet, isTouchDevice }
}
