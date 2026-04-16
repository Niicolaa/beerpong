import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'
import type { Match } from '../../types/tournament'

interface Props {
  matches: Match[]
  teamNames: Map<string, string>
  tournamentId: string
  isAdmin: boolean
}

const statusColor: Record<Match['status'], string> = {
  scheduled: 'text-gray-500 dark:text-gray-400',
  active: 'text-blue-600 dark:text-blue-400 font-semibold',
  finished: 'text-green-600 dark:text-green-400',
  bye: 'text-yellow-600 dark:text-yellow-400',
}

export function ScheduleTimeline({ matches, teamNames, tournamentId, isAdmin }: Props) {
  const { t } = useTranslation()

  const sorted = [...matches]
    .filter(m => m.scheduledStart !== null)
    .sort((a, b) => {
      const ta = a.scheduledStart!.toMillis()
      const tb = b.scheduledStart!.toMillis()
      return ta !== tb ? ta - tb : (a.tableNumber ?? 0) - (b.tableNumber ?? 0)
    })

  if (sorted.length === 0) {
    return <p className="py-8 text-center text-gray-500 dark:text-gray-400">{t('schedule.noSchedule')}</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase text-gray-500 dark:border-gray-700">
            <th className="pb-2 pr-3">{t('schedule.time')}</th>
            <th className="pb-2 pr-3">{t('schedule.table')}</th>
            <th className="pb-2 pr-3">{t('schedule.match')}</th>
            <th className="pb-2">{t('schedule.status')}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(m => {
            const t1 = teamNames.get(m.team1Id ?? '') ?? t('knockout.tbd')
            const t2 = teamNames.get(m.team2Id ?? '') ?? t('knockout.tbd')
            return (
              <tr key={m.id} className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-1.5 pr-3 font-mono text-xs text-gray-600 dark:text-gray-400">
                  {format(m.scheduledStart!.toDate(), 'HH:mm')}
                </td>
                <td className="py-1.5 pr-3 text-gray-600 dark:text-gray-400">
                  T{m.tableNumber}
                </td>
                <td className="py-1.5 pr-3 dark:text-white">
                  {t1} <span className="text-gray-400">{t('match.vs')}</span> {t2}
                  {m.status === 'finished' && m.score1 !== null && (
                    <span className="ml-2 text-xs text-gray-500">({m.score1}:{m.score2})</span>
                  )}
                </td>
                <td className={`py-1.5 text-xs ${statusColor[m.status]}`}>
                  <div className="flex items-center gap-1">
                    {t(`match.status.${m.status}`)}
                    {isAdmin && m.status !== 'bye' && (
                      <Link to={`/t/${tournamentId}/match/${m.id}`} className="text-brand-500 hover:underline">
                        →
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
