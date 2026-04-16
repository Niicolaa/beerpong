import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Play, Pause, RotateCcw, Bell, BellOff } from 'lucide-react'
import type { MatchTimer } from '../../types/tournament'
import { startTimer, pauseTimer, resetTimer, configureTimer } from '../../services/matchService'

interface Props {
  timer: MatchTimer
  tournamentId: string
  matchId: string
  isAdmin: boolean
}

function playAlarm() {
  const ctx = new AudioContext()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.frequency.value = 880
  gain.gain.setValueAtTime(0.4, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5)
  osc.start()
  osc.stop(ctx.currentTime + 1.5)
}

function calcRemaining(timer: MatchTimer, now: number): number {
  if (timer.durationSeconds <= 0) return 0
  let elapsed = timer.elapsedSeconds
  if (timer.startedAt && !timer.pausedAt) {
    elapsed += (now - timer.startedAt.toMillis()) / 1000
  }
  return Math.max(0, timer.durationSeconds - elapsed)
}

export function TimerWidget({ timer, tournamentId, matchId, isAdmin }: Props) {
  const { t } = useTranslation()
  const [remaining, setRemaining] = useState(() => calcRemaining(timer, Date.now()))
  const [durationInput, setDurationInput] = useState(String(Math.round(timer.durationSeconds / 60) || 10))
  const alarmFired = useRef(false)

  useEffect(() => {
    alarmFired.current = false
    setRemaining(calcRemaining(timer, Date.now()))
  }, [timer])

  useEffect(() => {
    if (!timer.startedAt || timer.pausedAt) return
    const id = setInterval(() => {
      const r = calcRemaining(timer, Date.now())
      setRemaining(r)
      if (r === 0 && timer.alarmEnabled && !alarmFired.current) {
        alarmFired.current = true
        playAlarm()
      }
    }, 250)
    return () => clearInterval(id)
  }, [timer])

  const isRunning = !!timer.startedAt && !timer.pausedAt
  const fmt = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  const handleStart = useCallback(() => startTimer(tournamentId, matchId), [tournamentId, matchId])
  const handlePause = useCallback(() => {
    const elapsed = timer.elapsedSeconds + (timer.startedAt ? (Date.now() - timer.startedAt.toMillis()) / 1000 : 0)
    return pauseTimer(tournamentId, matchId, Math.round(elapsed))
  }, [tournamentId, matchId, timer])
  const handleReset = useCallback(() => resetTimer(tournamentId, matchId), [tournamentId, matchId])

  const handleConfigure = useCallback(() => {
    const mins = parseFloat(durationInput)
    if (isNaN(mins) || mins <= 0) return
    configureTimer(tournamentId, matchId, Math.round(mins * 60), timer.alarmEnabled)
  }, [tournamentId, matchId, durationInput, timer.alarmEnabled])

  const toggleAlarm = useCallback(() => {
    configureTimer(tournamentId, matchId, timer.durationSeconds, !timer.alarmEnabled)
  }, [tournamentId, matchId, timer])

  const pct = timer.durationSeconds > 0 ? (remaining / timer.durationSeconds) * 100 : 0
  const color = pct > 33 ? 'text-green-600 dark:text-green-400' : pct > 10 ? 'text-yellow-500' : 'text-red-500'

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('timer.title')}</span>
        {isAdmin && (
          <button onClick={toggleAlarm} className="text-gray-400 hover:text-brand-500">
            {timer.alarmEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
          </button>
        )}
      </div>

      {timer.durationSeconds > 0 ? (
        <>
          <div className={`my-2 text-center text-4xl font-mono font-bold tabular-nums ${color}`}>
            {fmt(remaining)}
          </div>
          <div className="mb-3 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className={`h-full rounded-full transition-all ${pct > 33 ? 'bg-green-500' : pct > 10 ? 'bg-yellow-400' : 'bg-red-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {remaining === 0 && timer.alarmEnabled && (
            <p className="mb-2 text-center text-sm font-bold text-red-500">{t('timer.timeUp')}</p>
          )}
          {isAdmin && (
            <div className="flex gap-2">
              <button
                onClick={isRunning ? handlePause : handleStart}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-brand-500 py-2 text-sm font-medium text-white hover:bg-brand-600"
              >
                {isRunning ? <><Pause className="h-4 w-4" />{t('timer.pause')}</> : <><Play className="h-4 w-4" />{t('timer.start')}</>}
              </button>
              <button onClick={handleReset} className="rounded-lg border border-gray-300 px-3 py-2 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">
                <RotateCcw className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          )}
        </>
      ) : (
        isAdmin && (
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              max="60"
              value={durationInput}
              onChange={e => setDurationInput(e.target.value)}
              className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="10"
            />
            <span className="self-center text-sm text-gray-500">{t('timer.duration').replace('(Minuten)', '').replace('(minutes)', '')}</span>
            <button
              onClick={handleConfigure}
              className="flex-1 rounded-lg bg-brand-500 py-1.5 text-sm text-white hover:bg-brand-600"
            >
              {t('timer.start')}
            </button>
          </div>
        )
      )}
    </div>
  )
}
