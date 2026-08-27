import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useEdgeAwareTooltip } from './useEdgeAwareTooltip'

function makeTarget(rect) {
  return { getBoundingClientRect: () => rect }
}

describe('useEdgeAwareTooltip', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('starts with no active tooltip', () => {
    const { result } = renderHook(() => useEdgeAwareTooltip())
    expect(result.current.activeId).toBeNull()
  })

  it('shows a tooltip centered when the target is well away from both viewport edges', () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1000)
    const { result } = renderHook(() => useEdgeAwareTooltip())

    act(() => result.current.showTooltip('a', makeTarget({ left: 480, width: 40 })))

    expect(result.current.activeId).toBe('a')
    expect(result.current.activeAlign).toBe('center')
  })

  it('aligns to the end when the target is near the right viewport edge', () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(360)
    const { result } = renderHook(() => useEdgeAwareTooltip())

    act(() => result.current.showTooltip('a', makeTarget({ left: 330, width: 32 })))

    expect(result.current.activeAlign).toBe('end')
  })

  it('aligns to the start when the target is near the left viewport edge', () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(360)
    const { result } = renderHook(() => useEdgeAwareTooltip())

    act(() => result.current.showTooltip('a', makeTarget({ left: 0, width: 32 })))

    expect(result.current.activeAlign).toBe('start')
  })

  it('hideTooltip only clears the matching id', () => {
    const { result } = renderHook(() => useEdgeAwareTooltip())
    act(() => result.current.showTooltip('a', null))

    act(() => result.current.hideTooltip('b'))
    expect(result.current.activeId).toBe('a')

    act(() => result.current.hideTooltip('a'))
    expect(result.current.activeId).toBeNull()
  })

  it('handleMouseEnter opens the tooltip', () => {
    const { result } = renderHook(() => useEdgeAwareTooltip())
    act(() => result.current.handleMouseEnter('a', { currentTarget: null }))
    expect(result.current.activeId).toBe('a')
  })

  it('handlePointerUp toggles open/closed for touch, and ignores non-touch pointer types', () => {
    const { result } = renderHook(() => useEdgeAwareTooltip())

    act(() => result.current.handlePointerUp('a', { pointerType: 'mouse', currentTarget: null }))
    expect(result.current.activeId).toBeNull()

    act(() => result.current.handlePointerUp('a', { pointerType: 'touch', currentTarget: null }))
    expect(result.current.activeId).toBe('a')

    act(() => result.current.handlePointerUp('a', { pointerType: 'touch', currentTarget: null }))
    expect(result.current.activeId).toBeNull()
  })

  it('suppresses a mouseenter replayed immediately after a touch tap closed the tooltip', () => {
    const { result } = renderHook(() => useEdgeAwareTooltip())

    act(() => result.current.handlePointerUp('a', { pointerType: 'touch', currentTarget: null })) // opens
    act(() => result.current.handlePointerUp('a', { pointerType: 'touch', currentTarget: null })) // closes
    act(() => result.current.handleMouseEnter('a', { currentTarget: null })) // replayed synthetic hover

    expect(result.current.activeId).toBeNull()
  })

  it('respects a custom tooltipMaxWidth/edgeMargin so a caller can size its own tooltip', () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(360)
    const { result } = renderHook(() => useEdgeAwareTooltip({ tooltipMaxWidth: 40, edgeMargin: 0 }))

    // With a narrow 40px tooltip, a target that would trip the default
    // 180px-wide detection (used in the earlier "aligns to the end" test
    // above, same left/width) should now read as centered.
    act(() => result.current.showTooltip('a', makeTarget({ left: 150, width: 32 })))
    expect(result.current.activeAlign).toBe('center')
  })
})
