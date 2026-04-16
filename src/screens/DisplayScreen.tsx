import { useMemo, useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useTournament } from '../hooks/useTournament'
import { useMatches } from '../hooks/useMatches'
import { useTeams } from '../hooks/useTeams'
import { useGroups } from '../hooks/useGroups'
import { computeStandings } from '../logic/standings'
import { BracketView } from '../components/tournament/BracketView'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import type { TiebreakerField } from '../types/tournament'
import { format } from 'date-fns'

const ROTATE_MS = 8000

export function DisplayScreen() {
  const { tournamentId } = useParams<{ tournamentId: string }>()
  const { t } = useTranslation()
  const { tournament, loading } = useTournament(tournamentId)
  const { matches } = useMatches(tournamentId)
  const { teams } = useTeams(tournamentId)
  const { groups } = useGroups(tournamentId)
  const [page, setPage] = useState(0)

  const teamNames = useMemo(() => new Map(teams.map(t => [t.id, t.name])), [teams])

  const pages = useMemo(() => {
    if (!tournament) return []
    const result: string[] = []
    groups.forEach(g => result.push(`group-${g.id}`))
    if (matches.some(m => m.phase === 'knockout')) result.push('bracket')
    result.push('next')
    return result
  }, [groups, matches, tournament])

  useEffect(() => {
    if (pages.length === 0) return
    const id = setInterval(() => setPage(p => (p + 1) % pages.length), ROTATE_MS)
    return () => clearInterval(id)
  }, [pages.length])

  if (loading || !tournament) return <LoadingSpinner />

  const currentPage = pages[page] ?? 'next'

  const nextMatches = matches
    .filter(m => m.status === 'scheduled' && m.scheduledStart)
    .sort((a, b) => a.scheduledStart!.toMillis() - b.scheduledStart!.toMillis())
    .slice(0, 8)

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between bg-brand-600 px-6 py-3">
        <h1 className="text-xl font-extrabold tracking-tight">{tournament.name}</h1>
        <span className="text-sm text-brand-100">{t(`tournament.status.${tournament.status}`)}</span>
        <div className="flex gap-1">
          {pages.map((_, i) => (
            <div key={i} className={`h-2 w-2 rounded-full ${i === page ? 'bg-white' : 'bg-brand-400'}`} />
          ))}
        </div>
      </div>

      <div className="flex-1 p-6">
        {/* Group standings */}
        {currentPage.startsWith('group-') && (() => {
          const gId = currentPage.replace('group-', '')
          const group = groups.find(g => g.id === gId)
          if (!group) return null
          const gMatches = matches.filter(m => m.groupId === gId && m.phase === 'group')
          const standings = computeStandings(
            gMatches,
            group.teamIds,
            teamNames,
            tournament.config.tiebreakerOrder as TiebreakerField[]
          )
          return (
            <div>
              <h2 className="mb-4 text-2xl font-bold">Gruppe {gId}</h2>
              <table className="w-full text-lg">
                <thead>
                  <tr className="border-b border-gray-700 text-sm text-gray-400">
                    <th className="pb-2 text-left">#</th>
                    <th className="pb-2 text-left">Team</th>
                    <th className="pb-2 text-center">S</th>
                    <th className="pb-2 text-center">N</th>
                    <th className="pb-2 text-center">+/-</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((s, i) => (
                    <tr key={s.teamId} className={`border-b border-gray-800 py-2 ${i < tournament.config.advancePerGroup ? 'text-green-400 font-bold' : 'text-gray-200'}`}>
                      <td className="py-2">{i + 1}</td>
                      <td className="py-2 text-xl">{s.teamName}</td>
                      <td className="py-2 text-center">{s.wins}</td>
                      <td className="py-2 text-center">{s.losses}</td>
                      <td className="py-2 text-center">{s.pointDiff > 0 ? '+' : ''}{s.pointDiff}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        })()}

        {/* Bracket */}
        {currentPage === 'bracket' && (
          <div>
            <h2 className="mb-4 text-2xl font-bold">{t('knockout.title')}</h2>
            <BracketView
              matches={matches}
              teamNames={teamNames}
              tournamentId={tournamentId!}
              isAdmin={false}
            />
          </div>
        )}

        {/* Next matches */}
        {currentPage === 'next' && (
          <div>
            <h2 className="mb-4 text-2xl font-bold">{t('display.nextMatches')}</h2>
            {nextMatches.length === 0 ? (
              <p className="text-gray-400">Keine geplanten Spiele</p>
            ) : (
              <div className="space-y-3">
                {nextMatches.map(m => {
                  const t1 = teamNames.get(m.team1Id ?? '') ?? '?'
                  const t2 = teamNames.get(m.team2Id ?? '') ?? '?'
                  const time = m.scheduledStart ? format(m.scheduledStart.toDate(), 'HH:mm') : ''
                  return (
                    <div key={m.id} className="flex items-center gap-4 rounded-xl bg-gray-800 px-5 py-3">
                      <span className="font-mono text-brand-400">{time}</span>
                      <span className="text-lg font-bold">{t1}</span>
                      <span className="text-gray-500">vs</span>
                      <span className="text-lg font-bold">{t2}</span>
                      {m.tableNumber && (
                        <span className="ml-auto text-sm text-gray-400">Tisch {m.tableNumber}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
