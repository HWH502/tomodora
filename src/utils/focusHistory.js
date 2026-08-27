const LEGACY_LOCALSTORAGE_KEY = 'pomodoro.focusHistory'
const DB_NAME = 'pomodoroFocusHistory'
const DB_VERSION = 1
const DAYS_STORE = 'days'
const META_STORE = 'meta'
const RECONCILE_MARKER_KEY = 'lastReconciledSnapshot'

function openDb() {
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('indexedDB unavailable'))
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(DAYS_STORE)) {
        db.createObjectStore(DAYS_STORE, { keyPath: 'date' })
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'key' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    request.onblocked = () => reject(new Error('indexedDB open blocked'))
  })
}

function getAllDayRecords(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DAYS_STORE, 'readonly')
    const request = tx.objectStore(DAYS_STORE).getAll()
    let result
    request.onsuccess = () => {
      result = request.result
    }
    tx.oncomplete = () => resolve(result)
    tx.onerror = () => reject(tx.error)
    request.onerror = () => reject(request.error)
  })
}

function getMetaMarker(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(META_STORE, 'readonly')
    const request = tx.objectStore(META_STORE).get(RECONCILE_MARKER_KEY)
    let result = null
    request.onsuccess = () => {
      result = request.result?.value ?? null
    }
    tx.oncomplete = () => resolve(result)
    tx.onerror = () => reject(tx.error)
    request.onerror = () => reject(request.error)
  })
}

function putDayRecord(db, dayRecord) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DAYS_STORE, 'readwrite')
    const request = tx.objectStore(DAYS_STORE).put(dayRecord)
    request.onsuccess = () => {
      // Store is successful, wait for transaction complete
    }
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    request.onerror = () => reject(request.error)
  })
}

function writeReconciledDays(db, dayRecords, snapshotValue) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction([DAYS_STORE, META_STORE], 'readwrite')
    const daysStore = tx.objectStore(DAYS_STORE)
    dayRecords.forEach((record) => daysStore.put(record))
    tx.objectStore(META_STORE).put({ key: RECONCILE_MARKER_KEY, value: snapshotValue })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

function clearAllDayRecords(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DAYS_STORE, 'readwrite')
    tx.objectStore(DAYS_STORE).clear()
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

// Whole-history replace (save-file import) in ONE transaction: the clear and every
// put commit together or not at all, so a failure part-way through can never leave
// the store holding a mix of the old and the new history.
function clearAndWriteAllDays(db, dayRecords) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DAYS_STORE, 'readwrite')
    const daysStore = tx.objectStore(DAYS_STORE)
    daysStore.clear()
    dayRecords.forEach((record) => daysStore.put(record))
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export const __openDbForTests = openDb
export const __putDayRecordForTests = putDayRecord
export const __getAllDayRecordsForTests = getAllDayRecords
export const __getMetaMarkerForTests = getMetaMarker
export const __writeReconciledDaysForTests = writeReconciledDays
export const __clearAllDayRecordsForTests = clearAllDayRecords

function defaultCache() {
  return { version: 1, days: {} }
}

let cache = defaultCache()
let mode = 'pending' // 'pending' | 'indexeddb' | 'fallback'
let dbPromise = null

function recordsToDaysMap(records) {
  const days = {}
  records.forEach(({ date, count, minutes, growthMilestoneStageKey }) => {
    days[date] = { count, minutes, growthMilestoneStageKey: growthMilestoneStageKey ?? null }
  })
  return days
}

function readLegacyLocalStorage() {
  try {
    const raw = localStorage.getItem(LEGACY_LOCALSTORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || typeof parsed.days !== 'object') return {}
    return parsed.days
  } catch {
    return {}
  }
}

async function reconcileFallbackData(db) {
  const raw = localStorage.getItem(LEGACY_LOCALSTORAGE_KEY)
  if (!raw) return

  const marker = await getMetaMarker(db)
  if (marker === raw) {
    localStorage.removeItem(LEGACY_LOCALSTORAGE_KEY)
    return
  }

  let leftoverDays
  try {
    const parsed = JSON.parse(raw)
    leftoverDays = parsed && typeof parsed.days === 'object' ? parsed.days : null
  } catch {
    leftoverDays = null
  }

  if (!leftoverDays) {
    localStorage.removeItem(LEGACY_LOCALSTORAGE_KEY)
    return
  }

  const existingRecords = await getAllDayRecords(db)
  const existingByDate = {}
  existingRecords.forEach((record) => { existingByDate[record.date] = record })

  const merged = Object.entries(leftoverDays).map(([date, entry]) => ({
    date,
    count: (existingByDate[date]?.count ?? 0) + (entry.count ?? 0),
    minutes: (existingByDate[date]?.minutes ?? 0) + (entry.minutes ?? 0),
    growthMilestoneStageKey: entry.growthMilestoneStageKey ?? existingByDate[date]?.growthMilestoneStageKey ?? null,
  }))

  await writeReconciledDays(db, merged, raw)
  localStorage.removeItem(LEGACY_LOCALSTORAGE_KEY)

  merged.forEach((record) => {
    cache.days[record.date] = {
      count: record.count,
      minutes: record.minutes,
      growthMilestoneStageKey: record.growthMilestoneStageKey,
    }
  })
}

async function initFocusHistory() {
  let db
  try {
    db = await openDb()
    const records = await getAllDayRecords(db)
    cache = { version: 1, days: recordsToDaysMap(records) }
    mode = 'indexeddb'
    dbPromise = Promise.resolve(db)
  } catch {
    // If openDb() succeeded but getAllDayRecords() threw, the connection is
    // still open and otherwise unreachable — close it here before falling
    // through to fallback mode, or it leaks for the tab's lifetime
    // (production) or blocks later opens/deletes (tests).
    if (db) db.close()
    mode = 'fallback'
    cache = { version: 1, days: readLegacyLocalStorage() }
    return
  }

  // Reconciliation is deliberately guarded SEPARATELY from hydration above.
  // By this point `cache` already holds the full, correct history read out of
  // IndexedDB; if reconciliation then fails we must not fall into the catch
  // above, because that would replace that complete history with the leftover
  // localStorage buffer alone (which holds only the not-yet-merged delta) and
  // the user would spend the whole session looking at a near-empty history.
  // A failed attempt touches neither the leftover buffer nor the merge marker
  // (the merge is one atomic transaction), so skipping it here is safe: the
  // next successful startup simply retries it.
  try {
    await reconcileFallbackData(db)
  } catch {
    // Silent by design — no user-visible signal for storage-layer trouble.
  }

  if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
    navigator.storage.persist().catch(() => {})
  }
}

let readyPromise = initFocusHistory()

export function whenFocusHistoryReady() {
  return readyPromise
}

// Test-only: simulate a fresh app load (re-run hydration + reconciliation).
// It closes whatever connection `dbPromise` currently tracks BEFORE
// reinitializing, because initFocusHistory() unconditionally opens a fresh one
// and overwrites `dbPromise`: without closing first, the previous connection
// becomes orphaned (nothing references it, so nothing can ever close it) and
// silently blocks every later indexedDB.deleteDatabase() call. Production code
// never calls this — only the module-load init does — so this connection
// closing stays test-only and openDb()/initFocusHistory() keep their normal
// "never close the app's own connection" behavior.
export function __reinitForTests() {
  const previousDbPromise = dbPromise

  readyPromise = (async () => {
    if (previousDbPromise) {
      try {
        const db = await previousDbPromise
        db.close()
      } catch {
        // no open connection to close
      }
    }
    return initFocusHistory()
  })()

  return readyPromise
}

// Test-only accessor: exposes the internal hydration connection (if any) so
// tests can close it before calling indexedDB.deleteDatabase(). It is a plain
// getter — no connection-lifecycle behavior is added to production paths.
export function __getDbConnectionForTests() {
  return dbPromise
}

const RETENTION_DAYS = 90

function pruneToRecentDays(days, limit = RETENTION_DAYS) {
  const sortedDates = Object.keys(days).sort()
  const keep = new Set(sortedDates.slice(-limit))
  const pruned = {}
  keep.forEach((dateString) => { pruned[dateString] = days[dateString] })
  return pruned
}

function saveFallbackDays(days) {
  try {
    localStorage.setItem(LEGACY_LOCALSTORAGE_KEY, JSON.stringify({ version: 1, days }))
    return { trimmedTo90Days: false, days }
  } catch {
    const trimmed = pruneToRecentDays(days, RETENTION_DAYS)
    try {
      localStorage.setItem(LEGACY_LOCALSTORAGE_KEY, JSON.stringify({ version: 1, days: trimmed }))
      return { trimmedTo90Days: true, days: trimmed }
    } catch {
      return { trimmedTo90Days: false, days }
    }
  }
}

// IMPORTANT: this buffer must hold ONLY what hasn't been reconciled into IndexedDB
// yet — never the full in-memory `cache` — because reconcileFallbackData()
// ADDS this buffer's counts on top of whatever IndexedDB already has for the same
// day. Writing the full merged `cache` here (instead of a true incremental delta)
// would double-count every day that already existed in IndexedDB before this
// fallback episode began, the next time IndexedDB recovers and reconciliation runs.
// So each call reads whatever's CURRENTLY in localStorage (not `cache`) and adds
// just this one session's contribution on top of that.
function recordFallbackDelta(dateString, minutes, growthMilestoneStageKey) {
  const deltaDays = readLegacyLocalStorage()
  const existingDelta = deltaDays[dateString]
  const nextDelta = {
    count: (existingDelta?.count ?? 0) + 1,
    minutes: (existingDelta?.minutes ?? 0) + minutes,
    growthMilestoneStageKey: growthMilestoneStageKey ?? existingDelta?.growthMilestoneStageKey ?? null,
  }
  return saveFallbackDays({ ...deltaDays, [dateString]: nextDelta })
}

export function getFocusHistory() {
  return { version: 1, days: { ...cache.days } }
}

export function recordFocusSession({ dateString, minutes, growthMilestoneStageKey = null }) {
  const existing = cache.days[dateString]
  const nextEntry = {
    count: (existing?.count ?? 0) + 1,
    minutes: (existing?.minutes ?? 0) + minutes,
    growthMilestoneStageKey: growthMilestoneStageKey ?? existing?.growthMilestoneStageKey ?? null,
  }
  cache.days[dateString] = nextEntry

  if (mode === 'indexeddb') {
    dbPromise
      .then((db) => putDayRecord(db, { date: dateString, ...nextEntry }))
      .catch(() => {
        mode = 'fallback'
        recordFallbackDelta(dateString, minutes, growthMilestoneStageKey)
      })
    return { history: getFocusHistory(), trimmedTo90Days: false }
  }

  const result = recordFallbackDelta(dateString, minutes, growthMilestoneStageKey)
  return { history: getFocusHistory(), trimmedTo90Days: result.trimmedTo90Days }
}

export async function restoreFocusHistory(history) {
  const days = history && typeof history.days === 'object' ? history.days : {}
  cache = { version: 1, days: { ...days } }

  if (mode === 'indexeddb') {
    try {
      const db = await dbPromise
      const records = Object.entries(days).map(([date, entry]) => ({ date, ...entry }))
      await clearAndWriteAllDays(db, records)
      return
    } catch {
      mode = 'fallback'
    }
  }

  // Known accepted limitation: if IndexedDB happens to be unavailable at the exact
  // moment of a save-file import, the imported history is only guaranteed for the
  // rest of this session (`cache` above is already updated) — it is not persisted
  // to localStorage here, specifically to avoid feeding a full-history "replace"
  // into `recordFallbackDelta`'s delta-only buffer, which the additive reconciliation
  // above would then double-count on the next successful IndexedDB startup. This
  // compound edge case (IndexedDB down AND the user importing a backup at that exact
  // moment) is rare enough, for a single-user pre-release app, not to warrant a
  // separate replace-tagged reconciliation path.
}

// Test-only: wipe all focus-history state (memory, localStorage, IndexedDB)
// and re-run initialization, so each test starts from a clean slate.
//
// Two ordering constraints make this more involved than it looks:
//
// 1. Every open connection must be closed BEFORE deleteDatabase(). While any
//    connection to the database stays open, deleteDatabase() only fires
//    'blocked' and never 'success'; the delete request then sits pending in
//    that database's request queue forever, and because IndexedDB processes
//    requests against one database in FIFO order, every later open() call
//    queues behind it and hangs too.
// 2. The current `readyPromise` must settle before `dbPromise` is read. The
//    first call here races the module's load-time initialization, which
//    assigns `dbPromise` asynchronously; reading it too early would miss the
//    connection about to be opened and leave it orphaned — blocking every
//    future deleteDatabase() exactly as in (1).
//
// Production never closes its own connection (it lives for the tab's
// lifetime), so this cleanup belongs here rather than in a shared wrapper.
export function __resetForTests() {
  const priorReady = readyPromise ? readyPromise.catch(() => {}) : Promise.resolve()

  readyPromise = priorReady
    .then(async () => {
      const previousDbPromise = dbPromise

      mode = 'pending'
      cache = defaultCache()
      dbPromise = null
      localStorage.removeItem(LEGACY_LOCALSTORAGE_KEY)

      if (previousDbPromise) {
        try {
          const db = await previousDbPromise
          db.close()
        } catch {
          // no open connection to close
        }
      }

      if (typeof indexedDB !== 'undefined') {
        await new Promise((resolve) => {
          const request = indexedDB.deleteDatabase(DB_NAME)
          request.onsuccess = () => resolve()
          request.onerror = () => resolve()
          request.onblocked = () => resolve()
        })
      }
    })
    .then(() => initFocusHistory())

  return readyPromise
}
