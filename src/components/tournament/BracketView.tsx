import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Download } from 'lucide-react'
import type { Match } from '../../types/tournament'

interface Props {
  matches: Match[]
  teamNames: Map<string, string>
  tournamentId: string
  isAdmin: boolean
}

function roundName(round: number, totalRounds: number, t: (k: string, o?: Record<string, unknown>) => string): string {
  const fromEnd = totalRounds - round
  if (fromEnd === 0) return t('knockout.final')
  if (fromEnd === 1) return t('knockout.semifinal')
  if (fromEnd === 2) return t('knockout.quarterfinal')
  return t('knockout.round', { n: round })
}

export function BracketView({ matches, teamNames, tournamentId, isAdmin }: Props) {
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)

  const koMatches = matches.filter(m => m.phase === 'knockout')
  if (koMatches.length === 0) {
    return (
      <p className="text-center text-gray-500 dark:text-gray-400 py-8">
        {t('knockout.title')} — {t('groups.generateKO')}
      </p>
    )
  }

  const rounds = Array.from(new Set(koMatches.map(m => m.round))).sort((a, b) => a - b)
  const totalRounds = rounds.length

  const exportPNG = async () => {
    if (!ref.current) return
    const { default: html2canvas } = await import('html2canvas')
    const canvas = await html2canvas(ref.current, { backgroundColor: '#ffffff' })
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = 'bracket.png'
    a.click()
  }

  return (
    <div>
      {isAdmin && (
        <div className="mb-3 flex justify-end">
          <button
            onClick={exportPNG}
            className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <Download className="h-4 w-4" />
            {t('knockout.exportBracket')}
          </button>
        </div>
      )}
      <div ref={ref} className="flex gap-2 overflow-x-auto pb-4">
        {rounds.map(round => {
          const roundMatches = koMatches
            .filter(m => m.round === round)
            .sort((a, b) => a.matchNumber - b.matchNumber)
          return (
            <div key={round} className="flex min-w-[160px] flex-col gap-2">
              <div className="mb-1 text-center text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                {roundName(round, totalRounds, t)}
              </div>
              <div className="flex flex-col justify-around gap-4 flex-1">
                {roundMatches.map(m => {
                  const t1 = teamNames.get(m.team1Id ?? '') ?? t('knockout.tbd')
                  const t2 = teamNames.get(m.team2Id ?? '') ?? t('knockout.tbd')
                  const isFinished = m.status === 'finished'
                  return (
                    <div
                      key={m.id}
                      className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
                    >
                      {[
                        { name: t1, id: m.team1Id, score: m.score1 },
                        { name: t2, id: m.team2Id, score: m.score2 },
                      ].map(({ name, id, score }, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center justify-between px-2 py-1.5 text-sm ${
                            idx === 0 ? 'border-b border-gray-100 dark:border-gray-700' : ''
                          } ${
                            isFinished && id === m.winnerId
                              ? 'font-bold text-green-700 dark:text-green-400'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <span className="truncate max-w-[100px]">{name}</span>
                          {score !== null && (
                            <span className="ml-1 font-mono">{score}</span>
                          )}
                        </div>
                      ))}
                      {isAdmin && m.status !== 'bye' && (
                        <Link
                          to={`/t/${tournamentId}/match/${m.id}`}
                          className="block rounded-b-lg bg-brand-50 py-1 text-center text-xs text-brand-600 hover:bg-brand-100 dark:bg-gray-700 dark:text-brand-400"
                        >
                          →
                        </Link>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
