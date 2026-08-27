import 'fake-indexeddb/auto'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { __resetForTests as __resetFocusHistoryForTests } from '../utils/focusHistory'

afterEach(async () => {
  cleanup()
  localStorage.clear()
  // focusHistory.js (Task 5 of the IndexedDB migration) keeps its history in an
  // in-memory cache instead of reading localStorage fresh on every call, so
  // clearing localStorage above is no longer enough to isolate tests from each
  // other within the same test file — the cache itself has to be reset too, or
  // state (e.g. recorded pomodoro sessions) leaks from one test into the next.
  await __resetFocusHistoryForTests()
})
