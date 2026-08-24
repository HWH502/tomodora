export function todayDateString(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseDateString(dateString) {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function addDays(date, delta) {
  const result = new Date(date)
  result.setDate(result.getDate() + delta)
  return result
}

export function startOfWeekMonday(date) {
  const weekday = date.getDay() // 0=Sun..6=Sat
  const diffToMonday = weekday === 0 ? -6 : 1 - weekday
  const result = new Date(date)
  result.setDate(result.getDate() + diffToMonday)
  result.setHours(0, 0, 0, 0)
  return result
}
