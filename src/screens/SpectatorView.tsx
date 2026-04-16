import { useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Monitor, Users, Calendar, Trophy } from 'lucide-react'
import { format } from 'date-fns'
import { useTournament } from '../hooks/useTournament'
import { useMatches } from '../hooks/useMatches'
import { useTeams } from '../hooks/useTeams'
import { useGroups } from '../hooks/useGroups'
import { GroupCard } from '../components/tournament/GroupCard'
import { BracketView } from '../components/tournament/BracketView'
import { ScheduleTimeline } from '../components/schedule/ScheduleTimeline'
import { OfflineBanner } from '../components/ui/OfflineBanner'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

const TABS = ['groups', 'schedule', 'knockout'] as const
type Tab = typeof TABS[number]

export function SpectatorView() {
  const { tournamentId } = useParams<{ tournamentId: string }>()
  const { t } = useTranslation()
  const { tournament, loading: tLoading } = useTournament(tournamentId)
  const { matches, loading: mLoading } = useMatches(tournamentId)
  const { teams } = useTeams(tournamentId)
  const { groups } = useGroups(tournamentId)
  const [activeTab, setActiveTab] = useState<Tab>('groups')

  const teamNames = useMemo(() => new Map(teams.map(t => [t.id, t.name])), [teams])

  if (tLoading || mLoading) return <LoadingSpinner />
  if (!tournament) return <p className="p-8 text-center text-red-500">{t('errors.notFound')}</p>

  const nextMatches = matches
    .filter(m => m.status === 'scheduled' && m.scheduledStart)
    .sort((a, b) => a.scheduledStart!.toMillis() - b.scheduledStart!.toMillis())
    .slice(0, 5)

  const tabIcon: Record<Tab, React.ReactNode> = {
    groups: <Users className="h-4 w-4" />,
    schedule: <Calendar className="h-4 w-4" />,
    knockout: <Trophy className="h-4 w-4" />,
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <OfflineBanner />

      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
          <div className="flex-1 min-w-0">
            <h1 className="truncate text-lg font-bold text-gray-900 dark:text-white">{tournament.name}</h1>
            <span className="text-xs text-gray-500">{t(`tournament.status.${tournament.status}`)}</span>
          </div>
          <Link
            to={`/t/${tournamentId}/display`}
            className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Monitor className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </Link>
        </div>

        <div className="mx-auto flex max-w-4xl gap-1 overflow-x-auto px-4 pb-2">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-brand-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {tabIcon[tab]}
              {t(`tournament.tabs.${tab}`)}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-4">
        {/* Next matches banner */}
        {nextMatches.length > 0 && (
          <div className="mb-4 rounded-xl bg-brand-50 p-3 dark:bg-brand-900/20">
            <p className="mb-1.5 text-xs font-semibold uppercase text-brand-600 dark:text-brand-400">
              {t('display.nextMatches')}
            </p>
            <div className="space-y-1">
              {nextMatches.map(m => {
                const t1 = teamNames.get(m.team1Id ?? '') ?? '?'
                const t2 = teamNames.get(m.team2Id ?? '') ?? '?'
                const time = m.scheduledStart ? format(m.scheduledStart.toDate(), 'HH:mm') : ''
                return (
                  <div key={m.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-mono text-xs text-gray-400">{time}</span>
                    <span className="font-medium">{t1}</span>
                    <span className="text-gray-400">{t('match.vs')}</span>
                    <span className="font-medium">{t2}</span>
                    {m.tableNumber && <span className="text-xs text-gray-400">T{m.tableNumber}</span>}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {activeTab === 'groups' && (
          <div className="grid gap-4 sm:grid-cols-2">
            {groups.map(g => (
              <GroupCard
                key={g.id}
                group={g}
                teams={teams}
                matches={matches}
                tournamentId={tournamentId!}
                advanceCount={tournament.config.advancePerGroup}
                tiebreakerOrder={tournament.config.tiebreakerOrder}
                isAdmin={false}
              />
            ))}
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800">
            <ScheduleTimeline
              matches={matches}
              teamNames={teamNames}
              tournamentId={tournamentId!}
              isAdmin={false}
            />
          </div>
        )}

        {activeTab === 'knockout' && (
          <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800">
            <BracketView
              matches={matches}
              teamNames={teamNames}
              tournamentId={tournamentId!}
              isAdmin={false}
            />
          </div>
        )}
      </main>
    </div>
  )
}
