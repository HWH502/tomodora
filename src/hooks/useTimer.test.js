import { StrictMode } from 'react'
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTimer } from './useTimer'

vi.mock('../utils/notify', () => ({
  fireAlert: vi.fn(),
  requestNotificationPermission: vi.fn(),
}))

import { fireAlert, requestNotificationPermission } from '../utils/notify'

const TODAY_COUNT_KEY = 'pomodoro.todayCount'
const fixedNow = new Date(2026, 2, 15, 10, 0, 0)

function localDateString(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function completeCurrentPhase(result) {
  const durationMs = result.current.secondsLeft * 1000
  act(() => {
    result.current.start()
  })
  act(() => {
    vi.advanceTimersByTime(durationMs)
  })
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(fixedNow)
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

describe('initial state', () => {
  it('starts on work phase with the default duration and today count from storage', () => {
    localStorage.setItem(TODAY_COUNT_KEY, JSON.stringify({ date: localDateString(fixedNow), count: 3 }))
    const { result } = renderHook(() => useTimer())
    expect(result.current.phase).toBe('work')
    expect(result.current.isRunning).toBe(false)
    expect(result.current.secondsLeft).toBe(1500)
    expect(result.current.todayCount).toBe(3)
  })
})

describe('start', () => {
  it('sets isRunning and requests notification permission', () => {
    const { result } = renderHook(() => useTimer())
    act(() => {
      result.current.start()
    })
    expect(result.current.isRunning).toBe(true)
    expect(requestNotificationPermission).toHaveBeenCalledTimes(1)
  })
})

describe('tick', () => {
  it('counts down based on elapsed time', () => {
    const { result } = renderHook(() => useTimer())
    act(() => {
      result.current.start()
    })
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(result.current.secondsLeft).toBe(1497)
  })
})

describe('work -> shortBreak transition', () => {
  it('auto-completes a work session and switches to shortBreak', () => {
    const onWorkSessionComplete = vi.fn()
    const { result } = renderHook(() => useTimer({ onWorkSessionComplete }))

    completeCurrentPhase(result)

    expect(result.current.phase).toBe('shortBreak')
    expect(result.current.isRunning).toBe(false)
    expect(result.current.secondsLeft).toBe(300)
    expect(result.current.todayCount).toBe(1)
    expect(fireAlert).toHaveBeenCalledTimes(1)
    expect(fireAlert).toHaveBeenCalledWith('work')
    expect(onWorkSessionComplete).toHaveBeenCalledTimes(1)
    expect(onWorkSessionComplete).toHaveBeenCalledWith(25)
  })
})

describe('4-cycle long break rule', () => {
  it('switches to longBreak only on the 4th work session, then back to shortBreak on the 5th', () => {
    const { result } = renderHook(() => useTimer())

    for (let cycle = 1; cycle <= 3; cycle += 1) {
      completeCurrentPhase(result) // work -> shortBreak
      expect(result.current.phase).toBe('shortBreak')
      completeCurrentPhase(result) // shortBreak -> work
      expect(result.current.phase).toBe('work')
    }

    completeCurrentPhase(result) // 4th work -> longBreak
    expect(result.current.phase).toBe('longBreak')
    completeCurrentPhase(result) // longBreak -> work
    expect(result.current.phase).toBe('work')

    completeCurrentPhase(result) // 5th work -> shortBreak again (counter reset)
    expect(result.current.phase).toBe('shortBreak')
  })
})

describe('pause', () => {
  it('stops the countdown', () => {
    const { result } = renderHook(() => useTimer())
    act(() => {
      result.current.start()
    })
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    act(() => {
      result.current.pause()
    })
    expect(result.current.isRunning).toBe(false)
    const secondsAfterPause = result.current.secondsLeft
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(result.current.secondsLeft).toBe(secondsAfterPause)
  })
})

describe('reset', () => {
  it('restores the full duration for the current phase', () => {
    const { result } = renderHook(() => useTimer())
    act(() => {
      result.current.start()
    })
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    act(() => {
      result.current.reset()
    })
    expect(result.current.isRunning).toBe(false)
    expect(result.current.secondsLeft).toBe(1500)
  })
})

describe('updateSettings', () => {
  it('immediately updates secondsLeft when not running', () => {
    const { result } = renderHook(() => useTimer())
    act(() => {
      result.current.updateSettings({ workMinutes: 10, shortBreakMinutes: 5, longBreakMinutes: 15 })
    })
    expect(result.current.secondsLeft).toBe(600)
  })

  it('does not touch secondsLeft mid-countdown while running', () => {
    const { result } = renderHook(() => useTimer())
    act(() => {
      result.current.start()
    })
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    const secondsBeforeUpdate = result.current.secondsLeft
    act(() => {
      result.current.updateSettings({ workMinutes: 10, shortBreakMinutes: 5, longBreakMinutes: 15 })
    })
    expect(result.current.secondsLeft).toBe(secondsBeforeUpdate)
    expect(result.current.settings.workMinutes).toBe(10)
  })
})

describe('cross-day auto-reset', () => {
  it('resets todayCount to 0 when the tab stays open across local midnight, with no interaction', () => {
    localStorage.setItem(TODAY_COUNT_KEY, JSON.stringify({ date: localDateString(fixedNow), count: 5 }))
    const { result } = renderHook(() => useTimer())
    expect(result.current.todayCount).toBe(5)

    // fixedNow is 2026-03-15 10:00:00 local; advance past the next midnight.
    act(() => {
      vi.advanceTimersByTime(15 * 60 * 60 * 1000) // +15h -> past 2026-03-16 00:00:00
    })

    expect(result.current.todayCount).toBe(0)
    expect(JSON.parse(localStorage.getItem(TODAY_COUNT_KEY))).toEqual({
      date: '2026-03-16',
      count: 0,
    })
  })

  it('does not reset before local midnight is reached', () => {
    localStorage.setItem(TODAY_COUNT_KEY, JSON.stringify({ date: localDateString(fixedNow), count: 5 }))
    const { result } = renderHook(() => useTimer())

    act(() => {
      vi.advanceTimersByTime(10 * 60 * 60 * 1000) // +10h -> still 2026-03-15 20:00:00
    })

    expect(result.current.todayCount).toBe(5)
  })

  it('reschedules for the following midnight rather than firing only once', () => {
    localStorage.setItem(TODAY_COUNT_KEY, JSON.stringify({ date: localDateString(fixedNow), count: 5 }))
    const { result } = renderHook(() => useTimer())

    act(() => {
      vi.advanceTimersByTime(15 * 60 * 60 * 1000) // cross into 2026-03-16
    })
    expect(result.current.todayCount).toBe(0)

    // Simulate a pomodoro completing on the new day, then cross a second midnight.
    localStorage.setItem(TODAY_COUNT_KEY, JSON.stringify({ date: '2026-03-16', count: 2 }))
    act(() => {
      vi.advanceTimersByTime(24 * 60 * 60 * 1000) // cross into 2026-03-17
    })

    expect(result.current.todayCount).toBe(0)
    expect(JSON.parse(localStorage.getItem(TODAY_COUNT_KEY))).toEqual({
      date: '2026-03-17',
      count: 0,
    })
  })

  it('clears the scheduled check on unmount without error', () => {
    const { unmount } = renderHook(() => useTimer())
    unmount()
    expect(() => {
      act(() => {
        vi.advanceTimersByTime(24 * 60 * 60 * 1000)
      })
    }).not.toThrow()
  })
})

describe('StrictMode safety', () => {
  it('does not double-count or double-fire alerts on a completed work session', () => {
    const onWorkSessionComplete = vi.fn()
    const { result } = renderHook(() => useTimer({ onWorkSessionComplete }), { wrapper: StrictMode })

    completeCurrentPhase(result)

    expect(result.current.todayCount).toBe(1)
    expect(fireAlert).toHaveBeenCalledTimes(1)
    expect(onWorkSessionComplete).toHaveBeenCalledTimes(1)
  })
})
