import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import { useTournament } from '../hooks/useTournament'
import { useMatches } from '../hooks/useMatches'
import { useTeams } from '../hooks/useTeams'
import { useAuth } from '../hooks/useAuth'
import { submitScore, reopenMatch, advanceKOWinner } from '../services/matchService'
import { TimerWidget } from '../components/timer/TimerWidget'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

export function MatchScoringScreen() {
  const { tournamentId, matchId } = useParams<{ tournamentId: string; matchId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const { tournament } = useTournament(tournamentId)
  const { matches } = useMatches(tournamentId)
  const { teams } = useTeams(tournamentId)
  const { user } = useAuth()

  const match = useMemo(() => matches.find(m => m.id === matchId), [matches, matchId])
  const teamNames = useMemo(() => new Map(teams.map(t => [t.id, t.name])), [teams])

  const isAdmin = useMemo(
    () => !!user && !user.isAnonymous && !!tournament?.adminUids.includes(user.uid),
    [user, tournament]
  )

  const [score1, setScore1] = useState(0)
  const [score2, setScore2] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (!match || !tournament) return <LoadingSpinner />

  const t1Name = teamNames.get(match.team1Id ?? '') ?? t('knockout.tbd')
  const t2Name = teamNames.get(match.team2Id ?? '') ?? t('knockout.tbd')
  const isFinished = match.status === 'finished'

  const handleSubmit = async () => {
    if (!isAdmin) return
    setSaving(true)
    setError('')
    try {
      await submitScore(tournamentId!, matchId!, score1, score2)
      if (match.phase === 'knockout') {
        const updated = { ...match, score1, score2, winnerId: score1 > score2 ? match.team1Id : match.team2Id, status: 'finished' as const }
        await advanceKOWinner(tournamentId!, updated)
      }
      navigate(-1)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.networkError'))
    } finally {
      setSaving(false)
    }
  }

  const handleReopen = async () => {
    if (!isAdmin) return
    await reopenMatch(tournamentId!, matchId!)
    setScore1(0)
    setScore2(0)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-lg px-4 pb-16 pt-4">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
        >
          <ArrowLeft className="h-4 w-4" /> {t('app.back')}
        </button>

        <div className="rounded-2xl bg-white p-5 shadow dark:bg-gray-800">
          <div className="mb-1 text-center text-xs font-semibold uppercase text-gray-500">
            {match.phase === 'group'
              ? `${t('groups.group', { id: match.groupId })} – ${t('match.round', { n: match.round })}`
              : t('knockout.title')}
            {match.tableNumber && ` – ${t('match.table', { n: match.tableNumber })}`}
          </div>

          {/* Score display */}
          <div className="mt-4 flex items-center gap-4">
            {/* Team 1 */}
            <div className="flex flex-1 flex-col items-center gap-3">
              <span className="text-center text-sm font-bold text-gray-900 dark:text-white line-clamp-2">
                {t1Name}
              </span>
              {isFinished ? (
                <span className="text-5xl font-mono font-extrabold text-gray-900 dark:text-white">
                  {match.score1}
                </span>
              ) : isAdmin ? (
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={() => setScore1(s => s + 1)}
                    className="h-14 w-14 rounded-full bg-brand-500 text-2xl font-bold text-white active:scale-95"
                  >+1</button>
                  <span className="text-4xl font-mono font-extrabold text-gray-900 dark:text-white">
                    {score1}
                  </span>
                  <button
                    onClick={() => setScore1(s => Math.max(0, s - 1))}
                    className="h-10 w-10 rounded-full bg-gray-200 text-lg font-bold text-gray-700 active:scale-95 dark:bg-gray-700 dark:text-gray-300"
                  >−1</button>
                </div>
              ) : (
                <span className="text-4xl font-mono font-extrabold text-gray-400">?</span>
              )}
            </div>

            <span className="text-xl font-bold text-gray-300 dark:text-gray-600">{t('match.vs')}</span>

            {/* Team 2 */}
            <div className="flex flex-1 flex-col items-center gap-3">
              <span className="text-center text-sm font-bold text-gray-900 dark:text-white line-clamp-2">
                {t2Name}
              </span>
              {isFinished ? (
                <span className="text-5xl font-mono font-extrabold text-gray-900 dark:text-white">
                  {match.score2}
                </span>
              ) : isAdmin ? (
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={() => setScore2(s => s + 1)}
                    className="h-14 w-14 rounded-full bg-brand-500 text-2xl font-bold text-white active:scale-95"
                  >+1</button>
                  <span className="text-4xl font-mono font-extrabold text-gray-900 dark:text-white">
                    {score2}
                  </span>
                  <button
                    onClick={() => setScore2(s => Math.max(0, s - 1))}
                    className="h-10 w-10 rounded-full bg-gray-200 text-lg font-bold text-gray-700 active:scale-95 dark:bg-gray-700 dark:text-gray-300"
                  >−1</button>
                </div>
              ) : (
                <span className="text-4xl font-mono font-extrabold text-gray-400">?</span>
              )}
            </div>
          </div>

          {/* Winner badge */}
          {isFinished && match.winnerId && (
            <div className="mt-4 rounded-lg bg-green-50 py-2 text-center text-sm font-bold text-green-700 dark:bg-green-900/30 dark:text-green-400">
              🏆 {teamNames.get(match.winnerId)}
            </div>
          )}

          {/* Actions */}
          {isAdmin && !isFinished && (
            <div className="mt-5 space-y-2">
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="w-full rounded-xl bg-brand-500 py-3 font-bold text-white hover:bg-brand-600 disabled:opacity-50"
              >
                {saving ? t('app.loading') : t('match.submit')}
              </button>
            </div>
          )}

          {isAdmin && isFinished && (
            <button
              onClick={handleReopen}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400"
            >
              <RotateCcw className="h-4 w-4" /> {t('match.reopen')}
            </button>
          )}
        </div>

        {/* Timer */}
        <div className="mt-4">
          <TimerWidget
            timer={match.timer}
            tournamentId={tournamentId!}
            matchId={matchId!}
            isAdmin={isAdmin}
          />
        </div>
      </div>
    </div>
  )
}
