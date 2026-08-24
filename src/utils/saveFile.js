import { debugSetTodayCount, getOwnerState, getSettings, getTodayCount, restoreOwnerState, saveSettings } from './storage'
import { getFocusHistory, restoreFocusHistory } from './focusHistory'
import { todayDateString } from './date'

export const CURRENT_SCHEMA_VERSION = 1

export function buildSaveFile() {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    settings: getSettings(),
    todayCount: { date: todayDateString(), count: getTodayCount() },
    owner: getOwnerState(),
    focusHistory: getFocusHistory(),
  }
}

export function serializeSaveFile(saveFile) {
  return JSON.stringify(saveFile, null, 2)
}

export function parseSaveFile(text) {
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, error: 'invalid' }
  }

  const isValidShape =
    parsed &&
    typeof parsed === 'object' &&
    Number.isInteger(parsed.schemaVersion) &&
    parsed.settings && typeof parsed.settings === 'object' &&
    parsed.todayCount && typeof parsed.todayCount === 'object' &&
    parsed.owner && typeof parsed.owner === 'object' &&
    parsed.focusHistory && typeof parsed.focusHistory === 'object'

  if (!isValidShape) {
    return { ok: false, error: 'invalid' }
  }

  if (parsed.schemaVersion > CURRENT_SCHEMA_VERSION) {
    return { ok: false, error: 'tooNew' }
  }

  return { ok: true, data: parsed }
}

export function getSaveFileSummary(data) {
  return {
    exportedAt: data.exportedAt ?? null,
    petName: data.owner?.pet?.name || null,
    money: Number.isFinite(data.owner?.money) ? data.owner.money : 0,
  }
}

export function applySaveFile(data) {
  saveSettings(data.settings)
  debugSetTodayCount(data.todayCount.date, data.todayCount.count)
  restoreOwnerState(data.owner)
  restoreFocusHistory(data.focusHistory)
}
