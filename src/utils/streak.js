import { todayDateString } from './date'

export const STREAK_MILESTONES = [
  { days: 7, bonus: 10 },
  { days: 14, bonus: 20 },
  { days: 30, bonus: 50 },
]

export function defaultStreakState() {
  return { currentStreak: 0, lastCompletedDate: null, milestonesReached: [] }
}

function parseDateString(dateString) {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function isNextCalendarDay(prevDateString, currentDateString) {
  const prev = parseDateString(prevDateString)
  prev.setDate(prev.getDate() + 1)
  return todayDateString(prev) === currentDateString
}

export function advanceStreak(streak, currentDateString = todayDateString()) {
  if (streak.lastCompletedDate === currentDateString) {
    return { streak, bonusSkillPoints: 0 }
  }

  const continuing = Boolean(streak.lastCompletedDate) && isNextCalendarDay(streak.lastCompletedDate, currentDateString)
  const nextCount = continuing ? streak.currentStreak + 1 : 1
  const carriedMilestones = continuing ? streak.milestonesReached : []

  let bonusSkillPoints = 0
  const nextMilestones = [...carriedMilestones]
  for (const milestone of STREAK_MILESTONES) {
    if (nextCount === milestone.days && !nextMilestones.includes(milestone.days)) {
      bonusSkillPoints += milestone.bonus
      nextMilestones.push(milestone.days)
    }
  }

  return {
    streak: { currentStreak: nextCount, lastCompletedDate: currentDateString, milestonesReached: nextMilestones },
    bonusSkillPoints,
  }
}
