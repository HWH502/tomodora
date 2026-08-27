import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { applySaveFile, buildSaveFile, CURRENT_SCHEMA_VERSION, serializeSaveFile, parseSaveFile, getSaveFileSummary } from './saveFile'
import { createPet, getOwnerState, getSettings, saveSettings } from './storage'
import { getFocusHistory, __resetForTests } from './focusHistory'

const fixedNow = new Date(2026, 2, 15, 10, 0, 0)

beforeEach(async () => {
  vi.useRealTimers()  // Ensure real timers for the reset
  await __resetForTests()
  vi.useFakeTimers()  // Switch to fake timers for the test
  vi.setSystemTime(fixedNow)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('buildSaveFile', () => {
  it('bundles settings, today count, owner state, and focus history with a schema version and export timestamp', () => {
    saveSettings({ workMinutes: 50, shortBreakMinutes: 10, longBreakMinutes: 20 })
    createPet({ speciesId: 'dog', breedId: 'shiba', name: '小福' })

    const saveFile = buildSaveFile()

    expect(saveFile.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
    expect(saveFile.exportedAt).toBe(fixedNow.toISOString())
    expect(saveFile.settings).toEqual({ workMinutes: 50, shortBreakMinutes: 10, longBreakMinutes: 20 })
    expect(saveFile.todayCount).toEqual({ date: '2026-03-15', count: 0 })
    expect(saveFile.owner.pet.name).toBe('小福')
    expect(saveFile.focusHistory).toEqual({ version: 1, days: {} })
  })
})

describe('serializeSaveFile', () => {
  it('produces a JSON string that parses back to an equal object', () => {
    saveSettings({ workMinutes: 50, shortBreakMinutes: 10, longBreakMinutes: 20 })
    const saveFile = buildSaveFile()

    const text = serializeSaveFile(saveFile)

    expect(JSON.parse(text)).toEqual(saveFile)
  })
})

describe('parseSaveFile', () => {
  it('accepts a well-formed save file text', () => {
    saveSettings({ workMinutes: 50, shortBreakMinutes: 10, longBreakMinutes: 20 })
    const text = serializeSaveFile(buildSaveFile())

    const result = parseSaveFile(text)

    expect(result.ok).toBe(true)
    expect(result.data.settings).toEqual({ workMinutes: 50, shortBreakMinutes: 10, longBreakMinutes: 20 })
  })

  it('rejects text that is not valid JSON', () => {
    expect(parseSaveFile('not json {')).toEqual({ ok: false, error: 'invalid' })
  })

  it('rejects JSON missing required fields', () => {
    expect(parseSaveFile(JSON.stringify({ schemaVersion: 1, settings: {} }))).toEqual({
      ok: false,
      error: 'invalid',
    })
  })

  it('rejects a save file whose schema version is newer than this app understands', () => {
    const future = { ...buildSaveFile(), schemaVersion: CURRENT_SCHEMA_VERSION + 1 }
    expect(parseSaveFile(JSON.stringify(future))).toEqual({ ok: false, error: 'tooNew' })
  })

  it('accepts a save file whose schema version is older than the current one', () => {
    const older = { ...buildSaveFile(), schemaVersion: 0 }
    const result = parseSaveFile(JSON.stringify(older))
    expect(result.ok).toBe(true)
  })

  it('rejects a save file whose owner.pet is a non-null non-object (e.g. corrupted to a string)', () => {
    const bad = { ...buildSaveFile(), owner: { ...buildSaveFile().owner, pet: 'not-a-pet' } }
    expect(parseSaveFile(JSON.stringify(bad))).toEqual({ ok: false, error: 'invalid' })
  })

  it('accepts a save file whose owner.pet is null (no pet yet)', () => {
    const noPet = { ...buildSaveFile(), owner: { ...buildSaveFile().owner, pet: null } }
    expect(parseSaveFile(JSON.stringify(noPet)).ok).toBe(true)
  })

  it('rejects a save file whose owner.petMemorials is not an array', () => {
    const bad = { ...buildSaveFile(), owner: { ...buildSaveFile().owner, petMemorials: 'nope' } }
    expect(parseSaveFile(JSON.stringify(bad))).toEqual({ ok: false, error: 'invalid' })
  })

  it('rejects a save file whose owner.consumablePurchases is not an object', () => {
    const bad = { ...buildSaveFile(), owner: { ...buildSaveFile().owner, consumablePurchases: 'nope' } }
    expect(parseSaveFile(JSON.stringify(bad))).toEqual({ ok: false, error: 'invalid' })
  })
})

describe('getSaveFileSummary', () => {
  it('extracts export time, pet name, and money from a parsed save file', () => {
    createPet({ speciesId: 'dog', breedId: 'shiba', name: '小福' })
    const saveFile = buildSaveFile()

    expect(getSaveFileSummary(saveFile)).toEqual({
      exportedAt: fixedNow.toISOString(),
      petName: '小福',
      money: saveFile.owner.money,
    })
  })

  it('falls back to null pet name when there is no pet yet', () => {
    const saveFile = buildSaveFile()
    expect(getSaveFileSummary(saveFile).petName).toBeNull()
  })

  it('shows a placeholder name (not "no pet") when the pet exists but is unnamed', () => {
    createPet({ speciesId: 'dog', breedId: 'shiba', name: '' })
    const saveFile = buildSaveFile()

    expect(getSaveFileSummary(saveFile).petName).toBe('（未命名）')
  })
})

describe('applySaveFile', () => {
  it('overwrites settings, owner state, and focus history from a full save file', async () => {
    createPet({ speciesId: 'dog', breedId: 'shiba', name: '原本的寵物' })
    const backup = buildSaveFile()

    // 模擬「匯入前，瀏覽器裡已經有別的進度」
    saveSettings({ workMinutes: 1, shortBreakMinutes: 1, longBreakMinutes: 1 })

    vi.useRealTimers()
    await applySaveFile(backup)
    vi.useFakeTimers()
    vi.setSystemTime(fixedNow)

    expect(getSettings()).toEqual(backup.settings)
    expect(getOwnerState().pet.name).toBe('原本的寵物')
    expect(getFocusHistory()).toEqual(backup.focusHistory)
  })

  it('restores an older save file (missing newer owner fields) without throwing, patched to defaults on next read', async () => {
    const older = buildSaveFile()
    delete older.owner.ownerSkillTree
    delete older.owner.pomodoroStreak

    vi.useRealTimers()
    await applySaveFile(older)
    vi.useFakeTimers()
    vi.setSystemTime(fixedNow)

    expect(() => getOwnerState()).not.toThrow()
    expect(getOwnerState().ownerSkillTree).toBeTruthy()
    expect(getOwnerState().pomodoroStreak).toBeTruthy()
  })
})
