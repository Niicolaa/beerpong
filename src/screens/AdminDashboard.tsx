import { useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { QrCode, Eye, Monitor, Settings, BarChart2, Calendar, Trophy, Users, Wrench } from 'lucide-react'
import { useTournament } from '../hooks/useTournament'
import { useMatches } from '../hooks/useMatches'
import { useTeams } from '../hooks/useTeams'
import { useGroups } from '../hooks/useGroups'
import { useAuth } from '../hooks/useAuth'
import { useUIStore } from '../store/uiStore'
import { generateGroups } from '../services/groupService'
import { generateKOPhase } from '../services/bracketService'
import { computeSchedule, applySchedule } from '../services/scheduleService'
import { repairBracket } from '../services/matchService'
import { GroupCard } from '../components/tournament/GroupCard'
import { BracketView } from '../components/tournament/BracketView'
import { ScheduleTimeline } from '../components/schedule/ScheduleTimeline'
import { QRCodeModal } from '../components/ui/QRCodeModal'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { OfflineBanner } from '../components/ui/OfflineBanner'

const TABS = ['groups', 'schedule', 'knockout', 'stats', 'settings'] as const
type Tab = typeof TABS[number]

export function AdminDashboard() {
  const { tournamentId } = useParams<{ tournamentId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { tournament, loading: tLoading } = useTournament(tournamentId)
  const { matches, loading: mLoading } = useMatches(tournamentId)
  const { teams } = useTeams(tournamentId)
  const { groups } = useGroups(tournamentId)
  const { user } = useAuth()
  const { darkMode, toggleDarkMode, qrModalOpen, setQRModalOpen, activeTab, setActiveTab } = useUIStore()

  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  const isAdmin = useMemo(
    () => !!user && !user.isAnonymous && !!tournament?.adminUids.includes(user.uid),
    [user, tournament]
  )

  const teamNames = useMemo(() => new Map(teams.map(t => [t.id, t.name])), [teams])

  const allGroupMatchesFinished = useMemo(
    () =>
      matches.filter(m => m.phase === 'group').length > 0 &&
      matches.filter(m => m.phase === 'group').every(m => m.status === 'finished' || m.status === 'bye'),
    [matches]
  )

  if (tLoading || mLoading) return <LoadingSpinner />
  if (!tournament) return <p className="p-8 text-center text-red-500">{t('errors.notFound')}</p>
  if (!isAdmin) {
    navigate(`/t/${tournamentId}/spectate`)
    return null
  }

  const handleGenerateGroups = async () => {
    setGenerating(true)
    setError('')
    try {
      await generateGroups(tournament, teams)
      // Auto-generate schedule if startTime is set
      if (tournament.schedule.startTime) {
        // Schedule will be computed after groups are generated
      }
    } catch (e) {
      setError(t('errors.networkError'))
      console.error(e)
    } finally {
      setGenerating(false)
    }
  }

  const handleGenerateSchedule = async () => {
    setGenerating(true)
    setError('')
    try {
      const groupMatches = matches.filter(m => m.phase === 'group')
      const koMatches = matches.filter(m => m.phase === 'knockout')
      const assignments = computeSchedule(groupMatches, koMatches, tournament)
      await applySchedule(tournamentId!, assignments)
    } catch (e) {
      setError(t('errors.networkError'))
      console.error(e)
    } finally {
      setGenerating(false)
    }
  }

  const handleGenerateKO = async () => {
    setGenerating(true)
    setError('')
    try {
      await generateKOPhase(tournament, matches, teamNames)
      setActiveTab('knockout')
    } catch (e) {
      setError(t('errors.networkError'))
      console.error(e)
    } finally {
      setGenerating(false)
    }
  }

  const handleRepairBracket = async () => {
    await repairBracket(tournamentId!, matches)
  }

  const tabIcon: Record<Tab, React.ReactNode> = {
    groups: <Users className="h-4 w-4" />,
    schedule: <Calendar className="h-4 w-4" />,
    knockout: <Trophy className="h-4 w-4" />,
    stats: <BarChart2 className="h-4 w-4" />,
    settings: <Settings className="h-4 w-4" />,
  }

  const statusColors: Record<string, string> = {
    setup: 'bg-gray-200 text-gray-700',
    registration: 'bg-blue-100 text-blue-700',
    group: 'bg-yellow-100 text-yellow-700',
    knockout: 'bg-orange-100 text-orange-700',
    finished: 'bg-green-100 text-green-700',
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <OfflineBanner />

      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
          <div className="flex-1 min-w-0">
            <h1 className="truncate text-lg font-bold text-gray-900 dark:text-white">{tournament.name}</h1>
            <span className={`mt-0.5 inline-block rounded px-1.5 py-0.5 text-xs font-semibold ${statusColors[tournament.status]}`}>
              {t(`tournament.status.${tournament.status}`)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setQRModalOpen(true)}
              className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
              title={t('tournament.qrCode')}
            >
              <QrCode className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </button>
            <Link
              to={`/t/${tournamentId}/display`}
              className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
              title={t('tournament.displayMode')}
            >
              <Monitor className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </Link>
            <Link
              to={`/t/${tournamentId}/spectate`}
              className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
              title={t('tournament.spectatorView')}
            >
              <Eye className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </Link>
          </div>
        </div>

        {/* Tabs */}
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
        {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-500">{error}</p>}

        {/* Groups Tab */}
        {activeTab === 'groups' && (
          <div className="space-y-4">
            {groups.length === 0 ? (
              <div className="rounded-2xl bg-white p-6 text-center shadow-sm dark:bg-gray-800">
                <p className="mb-4 text-gray-500 dark:text-gray-400">
                  {teams.length} Teams eingetragen
                </p>
                <button
                  onClick={handleGenerateGroups}
                  disabled={generating || teams.length < 2}
                  className="rounded-xl bg-brand-500 px-6 py-2.5 font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
                >
                  {generating ? t('app.loading') : t('groups.generate')}
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleGenerateGroups}
                    disabled={generating}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    {t('groups.regenerate')}
                  </button>
                  {allGroupMatchesFinished && tournament.status === 'group' && (
                    <button
                      onClick={handleGenerateKO}
                      disabled={generating}
                      className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
                    >
                      {generating ? t('app.loading') : t('groups.generateKO')}
                    </button>
                  )}
                </div>
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
                      isAdmin={isAdmin}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800">
            <div className="mb-3 flex gap-2">
              <button
                onClick={handleGenerateSchedule}
                disabled={generating || groups.length === 0}
                className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
              >
                {generating ? t('app.loading') : matches.some(m => m.scheduledStart) ? t('schedule.regenerate') : t('schedule.generate')}
              </button>
            </div>
            <ScheduleTimeline
              matches={matches}
              teamNames={teamNames}
              tournamentId={tournamentId!}
              isAdmin={isAdmin}
            />
          </div>
        )}

        {/* KO Tab */}
        {activeTab === 'knockout' && (
          <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800">
            <div className="mb-3 flex gap-2">
              <button
                onClick={handleRepairBracket}
                className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
              >
                <Wrench className="h-4 w-4" />
                {t('knockout.repairBracket')}
              </button>
            </div>
            <BracketView
              matches={matches}
              teamNames={teamNames}
              tournamentId={tournamentId!}
              isAdmin={isAdmin}
            />
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <StatsTab matches={matches} teams={teams} teamNames={teamNames} />
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <SettingsTab tournament={tournament} tournamentId={tournamentId!} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        )}
      </main>

      {qrModalOpen && (
        <QRCodeModal shareCode={tournament.shareCode} onClose={() => setQRModalOpen(false)} />
      )}
    </div>
  )
}

// ── Stats Tab ──────────────────────────────────────────────────────────────────

function StatsTab({ matches, teams, teamNames }: {
  matches: ReturnType<typeof useMatches>['matches']
  teams: ReturnType<typeof useTeams>['teams']
  teamNames: Map<string, string>
}) {
  const { t } = useTranslation()
  const finished = matches.filter(m => m.status === 'finished' && m.score1 !== null)

  const stats = useMemo(() => {
    return teams.map(team => {
      const asT1 = finished.filter(m => m.team1Id === team.id)
      const asT2 = finished.filter(m => m.team2Id === team.id)
      const wins = asT1.filter(m => m.winnerId === team.id).length + asT2.filter(m => m.winnerId === team.id).length
      const losses = asT1.filter(m => m.winnerId !== team.id).length + asT2.filter(m => m.winnerId !== team.id).length
      const cupsFor = asT1.reduce((s, m) => s + (m.score1 ?? 0), 0) + asT2.reduce((s, m) => s + (m.score2 ?? 0), 0)
      const played = wins + losses
      return { team, wins, losses, cupsFor, winRate: played > 0 ? wins / played : 0 }
    }).sort((a, b) => b.wins - a.wins || b.cupsFor - a.cupsFor)
  }, [finished, teams])

  if (stats.length === 0 || finished.length === 0) {
    return <p className="py-8 text-center text-gray-500 dark:text-gray-400">{t('stats.noStats')}</p>
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800">
      <h2 className="mb-3 font-bold text-gray-900 dark:text-white">{t('stats.title')}</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-xs font-semibold uppercase text-gray-500 dark:border-gray-700">
            <th className="pb-2 text-left">{t('groups.team')}</th>
            <th className="pb-2 text-center">{t('groups.wins')}</th>
            <th className="pb-2 text-center">{t('groups.losses')}</th>
            <th className="pb-2 text-center">{t('stats.totalCups')}</th>
            <th className="pb-2 text-center">{t('stats.winRate')}</th>
          </tr>
        </thead>
        <tbody>
          {stats.map(({ team, wins, losses, cupsFor, winRate }, i) => (
            <tr key={team.id} className="border-b border-gray-100 dark:border-gray-800">
              <td className="py-1.5 dark:text-white">
                {i === 0 && <span className="mr-1">🏆</span>}
                {teamNames.get(team.id)}
              </td>
              <td className="py-1.5 text-center text-green-600 dark:text-green-400">{wins}</td>
              <td className="py-1.5 text-center text-red-500">{losses}</td>
              <td className="py-1.5 text-center dark:text-gray-300">{cupsFor}</td>
              <td className="py-1.5 text-center dark:text-gray-300">{Math.round(winRate * 100)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Settings Tab ───────────────────────────────────────────────────────────────

import type { Tournament } from '../types/tournament'

function SettingsTab({ tournament, darkMode, toggleDarkMode }: {
  tournament: Tournament
  tournamentId: string
  darkMode: boolean
  toggleDarkMode: () => void
}) {
  const { t } = useTranslation()
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800">
        <h2 className="mb-3 font-bold text-gray-900 dark:text-white">{t('settings.title')}</h2>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700 dark:text-gray-300">{darkMode ? t('app.darkMode') : t('app.lightMode')}</span>
          <button
            onClick={toggleDarkMode}
            className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800">
        <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">{t('tournament.shareCode')}</h3>
        <p className="font-mono text-2xl font-bold tracking-widest text-brand-500">{tournament.shareCode}</p>
        <p className="mt-1 text-xs text-gray-400">
          {window.location.origin}{import.meta.env.BASE_URL}#/join/{tournament.shareCode}
        </p>
      </div>

      <div className="rounded-2xl border border-red-200 bg-white p-4 shadow-sm dark:bg-gray-800">
        <h3 className="mb-2 text-sm font-semibold text-red-600">{t('settings.dangerZone')}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Admin UID: {tournament.adminUids[0]}
        </p>
      </div>
    </div>
  )
}
