import { useRef, useState } from 'react'

// Some touch browsers replay a synthetic mouseenter after a tap for legacy
// :hover compatibility. Without this guard that replay could immediately
// reopen a tooltip a tap had just closed. Any real mouseenter within this
// window of a touch tap is treated as that replay and ignored.
const DEFAULT_TOUCH_HOVER_SUPPRESS_MS = 500

// The tooltip is centered on its trigger element by default, so it can
// extend up to half its own width on either side of the trigger's center.
// Edge detection must account for that half width, not just the trigger's
// own edges, or a trigger one column in from the viewport edge can still
// produce a tooltip that runs off-screen.
const DEFAULT_TOOLTIP_MAX_WIDTH = 180
const DEFAULT_EDGE_MARGIN = 24

// Shared hover/focus/touch-tap tooltip behavior with viewport-edge-aware
// alignment. One active tooltip at a time, identified by an arbitrary id.
export function useEdgeAwareTooltip({
  tooltipMaxWidth = DEFAULT_TOOLTIP_MAX_WIDTH,
  edgeMargin = DEFAULT_EDGE_MARGIN,
  touchHoverSuppressMs = DEFAULT_TOUCH_HOVER_SUPPRESS_MS,
} = {}) {
  const [activeId, setActiveId] = useState(null)
  const [activeAlign, setActiveAlign] = useState('center')
  const suppressHoverUntilRef = useRef(0)

  const showTooltip = (id, target) => {
    setActiveId(id)
    if (target) {
      const rect = target.getBoundingClientRect()
      const center = rect.left + rect.width / 2
      const half = tooltipMaxWidth / 2
      if (center + half > window.innerWidth - edgeMargin) {
        setActiveAlign('end')
      } else if (center - half < edgeMargin) {
        setActiveAlign('start')
      } else {
        setActiveAlign('center')
      }
    } else {
      setActiveAlign('center')
    }
  }

  const hideTooltip = (id) => setActiveId((current) => (current === id ? null : current))

  const toggleTooltip = (id, target) => {
    if (activeId === id) {
      hideTooltip(id)
    } else {
      showTooltip(id, target)
    }
  }

  const handleMouseEnter = (id, event) => {
    if (Date.now() < suppressHoverUntilRef.current) return
    showTooltip(id, event.currentTarget)
  }

  // Mouse clicks and keyboard activation both fire onClick right after
  // onMouseEnter/onFocus already opened the tooltip, so a plain onClick
  // toggle would close it again in the same interaction. Touch taps are
  // the only pointer type with no reliable hover/focus-before-click step,
  // so only they should drive the toggle.
  const handlePointerUp = (id, event) => {
    if (event.pointerType === 'touch') {
      suppressHoverUntilRef.current = Date.now() + touchHoverSuppressMs
      toggleTooltip(id, event.currentTarget)
    }
  }

  return { activeId, activeAlign, showTooltip, hideTooltip, handleMouseEnter, handlePointerUp }
}
