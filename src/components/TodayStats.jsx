export default function TodayStats({ completedToday }) {
  return (
    <p className="today-stats">
      今天已完成 <strong>{completedToday}</strong> 個番茄鐘
    </p>
  )
}
