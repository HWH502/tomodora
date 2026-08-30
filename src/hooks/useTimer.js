import { useCallback, useEffect, useRef, useState } from 'react'
import {
  debugSetTodayCount,
  getSettings,
  getTodayCount,
  incrementTodayCount,
  saveSettings,
} from '../utils/storage'
import { fireAlert, requestNotificationPermission } from '../utils/notify'

const WORK_SESSIONS_PER_LONG_BREAK = 4

function durationSecondsFor(phase, settings) {
  if (phase === 'shortBreak') return settings.shortBreakMinutes * 60
  if (phase === 'longBreak') return settings.longBreakMinutes * 60
  return settings.workMinutes * 60
}

export function useTimer({ onWorkSessionComplete } = {}) {
  const [settings, setSettings] = useState(getSettings)
  const [phase, setPhase] = useState('work')
  const [isRunning, setIsRunning] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(() => durationSecondsFor('work', getSettings()))
  const [todayCount, setTodayCount] = useState(getTodayCount)
  const [currentRound, setCurrentRound] = useState(1)

  const intervalRef = useRef(null)
  const endTimestampRef = useRef(null)
  const workSessionsSinceLongBreakRef = useRef(0)
  const onWorkSessionCompleteRef = useRef(onWorkSessionComplete)
  // Mirrors `phase` for reads inside advancePhase, so the phase-completion
  // logic (side effects: counting, alerts) runs as a plain function call
  // instead of inside a setState updater — React StrictMode intentionally
  // invokes updater functions twice in development, which would otherwise
  // double-count completed sessions and double-fire the alert.
  const phaseRef = useRef('work')

  useEffect(() => {
    onWorkSessionCompleteRef.current = onWorkSessionComplete
  }, [onWorkSessionComplete])

  const clearTick = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const advancePhase = useCallback(() => {
    const completedPhase = phaseRef.current
    let nextPhase

    if (completedPhase === 'work') {
      workSessionsSinceLongBreakRef.current += 1
      setTodayCount(incrementTodayCount())
      onWorkSessionCompleteRef.current?.(settings.workMinutes)

      if (workSessionsSinceLongBreakRef.current >= WORK_SESSIONS_PER_LONG_BREAK) {
        workSessionsSinceLongBreakRef.current = 0
        nextPhase = 'longBreak'
      } else {
        nextPhase = 'shortBreak'
      }
      setCurrentRound(workSessionsSinceLongBreakRef.current + 1)
    } else {
      nextPhase = 'work'
    }

    fireAlert(completedPhase)
    phaseRef.current = nextPhase
    setPhase(nextPhase)
    setSecondsLeft(durationSecondsFor(nextPhase, settings))
  }, [settings])

  useEffect(() => {
    if (!isRunning) return undefined

    intervalRef.current = setInterval(() => {
      const remaining = Math.round((endTimestampRef.current - Date.now()) / 1000)

      if (remaining <= 0) {
        clearTick()
        setIsRunning(false)
        setSecondsLeft(0)
        advancePhase()
        return
      }

      setSecondsLeft(remaining)
    }, 250)

    return clearTick
  }, [isRunning, advancePhase, clearTick])

  // The displayed today-count only re-checks the date when something calls
  // getTodayCount()/incrementTodayCount() (e.g. a pomodoro completing, or a
  // fresh page load). If the tab just sits open across local midnight with
  // nothing completing, nothing re-invokes it — so this effect schedules an
  // explicit re-check at the next local midnight, independent of the tick
  // interval above, and reschedules itself for the following midnight.
  useEffect(() => {
    let timeoutId

    function msUntilNextLocalMidnight() {
      const now = new Date()
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0)
      return nextMidnight.getTime() - now.getTime()
    }

    function scheduleMidnightCheck() {
      timeoutId = setTimeout(() => {
        setTodayCount(getTodayCount())
        scheduleMidnightCheck()
      }, msUntilNextLocalMidnight())
    }

    scheduleMidnightCheck()
    return () => clearTimeout(timeoutId)
  }, [])

  const start = useCallback(() => {
    requestNotificationPermission()
    endTimestampRef.current = Date.now() + secondsLeft * 1000
    setIsRunning(true)
  }, [secondsLeft])

  const pause = useCallback(() => {
    clearTick()
    setIsRunning(false)
  }, [clearTick])

  const reset = useCallback(() => {
    clearTick()
    setIsRunning(false)
    setSecondsLeft(durationSecondsFor(phase, settings))
  }, [clearTick, phase, settings])

  const completeWorkSessionsInstantly = useCallback(
    (count) => {
      for (let i = 0; i < count; i += 1) {
        setTodayCount(incrementTodayCount())
        onWorkSessionCompleteRef.current?.(settings.workMinutes)
      }
    },
    [settings],
  )

  const simulatePreviousDay = useCallback(() => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const year = yesterday.getFullYear()
    const month = String(yesterday.getMonth() + 1).padStart(2, '0')
    const day = String(yesterday.getDate()).padStart(2, '0')
    debugSetTodayCount(`${year}-${month}-${day}`, todayCount)
    setTodayCount(getTodayCount())
  }, [todayCount])

  const updateSettings = useCallback(
    (newSettings) => {
      saveSettings(newSettings)
      setSettings(newSettings)
      if (!isRunning) {
        setSecondsLeft(durationSecondsFor(phase, newSettings))
      }
    },
    [isRunning, phase],
  )

  return {
    phase,
    isRunning,
    secondsLeft,
    settings,
    todayCount,
    start,
    pause,
    reset,
    updateSettings,
    completeWorkSessionsInstantly,
    simulatePreviousDay,
    totalSeconds: durationSecondsFor(phase, settings),
    currentRound,
    totalRounds: WORK_SESSIONS_PER_LONG_BREAK,
  }
}
