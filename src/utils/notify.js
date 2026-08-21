const PHASE_LABELS = {
  work: '工作時間結束',
  shortBreak: '短休息結束',
  longBreak: '長休息結束',
}

export function requestNotificationPermission() {
  if (!('Notification' in window)) return
  if (Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {})
  }
}

export function playBeep() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.frequency.value = 880
    oscillator.type = 'sine'
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    oscillator.start()
    oscillator.stop(ctx.currentTime + 0.3)
    oscillator.onended = () => ctx.close()
  } catch {
    // no-op: audio isn't available in this environment
  }
}

export function fireAlert(phase) {
  playBeep()
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(PHASE_LABELS[phase] || '番茄鐘', {
        body: '點擊回到番茄鐘查看下一階段',
      })
    }
  } catch {
    // no-op: notification failed, beep already played
  }
}
