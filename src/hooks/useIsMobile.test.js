import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useIsMobile } from './useIsMobile'

describe('useIsMobile', () => {
  const originalInnerWidth = window.innerWidth

  afterEach(() => {
    window.innerWidth = originalInnerWidth
  })

  it('returns true when the viewport is at or below the 600px mobile breakpoint', () => {
    window.innerWidth = 375
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('returns true exactly at the 600px boundary', () => {
    window.innerWidth = 600
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('returns false when the viewport is wider than the mobile breakpoint', () => {
    window.innerWidth = 1024
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('updates when the window is resized', () => {
    window.innerWidth = 1024
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)

    act(() => {
      window.innerWidth = 375
      window.dispatchEvent(new Event('resize'))
    })
    expect(result.current).toBe(true)
  })
})
