import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import type { Match } from '../../types/tournament'

interface Props {
  matches: Match[]
  teamNames: Map<string, string>
  tournamentId: string
  isAdmin: boolean
}

const statusColor: Record<Match['status'], string> = {
  scheduled: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  active: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
  finished: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  bye: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
}

export function MatchList({ matches, teamNames, tournamentId, isAdmin }: Props) {
  const { t } = useTranslation()

  return (
    <div className="space-y-2">
      {matches.map(m => {
        const t1 = teamNames.get(m.team1Id ?? '') ?? t('knockout.tbd')
        const t2 = teamNames.get(m.team2Id ?? '') ?? t('knockout.tbd')
        const time = m.scheduledStart ? format(m.scheduledStart.toDate(), 'HH:mm') : null
        return (
          <div key={m.id} className="flex items-center gap-2 rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
            {time && (
              <span className="min-w-[40px] text-xs text-gray-400">{time}</span>
            )}
            {m.tableNumber && (
              <span className="min-w-[24px] text-xs text-gray-400">T{m.tableNumber}</span>
            )}
            <span className="flex-1 text-sm font-medium truncate dark:text-white">
              {t1} <span className="text-gray-400">{t('match.vs')}</span> {t2}
            </span>
            {m.status === 'finished' && m.score1 !== null && m.score2 !== null && (
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {m.score1}:{m.score2}
              </span>
            )}
            <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${statusColor[m.status]}`}>
              {t(`match.status.${m.status}`)}
            </span>
            {isAdmin && m.status !== 'bye' && (
              <Link
                to={`/t/${tournamentId}/match/${m.id}`}
                className="rounded bg-brand-500 px-2 py-0.5 text-xs text-white hover:bg-brand-600"
              >
                →
              </Link>
            )}
          </div>
        )
      })}
    </div>
  )
}
