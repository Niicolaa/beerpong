import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { Group, Match, Team } from '../../types/tournament'
import { computeStandings } from '../../logic/standings'
import { StandingsTable } from './StandingsTable'
import { MatchList } from './MatchList'

interface Props {
  group: Group
  teams: Team[]
  matches: Match[]
  tournamentId: string
  advanceCount: number
  tiebreakerOrder: string[]
  isAdmin: boolean
}

export function GroupCard({ group, teams, matches, tournamentId, advanceCount, tiebreakerOrder, isAdmin }: Props) {
  const { t } = useTranslation()
  const teamNames = useMemo(() => new Map(teams.map(t => [t.id, t.name])), [teams])
  const groupTeams = useMemo(() => teams.filter(t => group.teamIds.includes(t.id)), [teams, group])
  const groupMatches = useMemo(() => matches.filter(m => m.groupId === group.id), [matches, group])

  const standings = useMemo(
    () =>
      computeStandings(
        groupMatches,
        group.teamIds,
        teamNames,
        tiebreakerOrder as import('../../types/tournament').TiebreakerField[]
      ),
    [groupMatches, group.teamIds, teamNames, tiebreakerOrder]
  )

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <h3 className="mb-3 text-base font-bold text-gray-900 dark:text-white">
        {t('groups.group', { id: group.id })}
        <span className="ml-2 text-sm font-normal text-gray-500">
          ({groupTeams.length} Teams)
        </span>
      </h3>
      <StandingsTable standings={standings} advanceCount={advanceCount} />
      <div className="mt-3">
        <h4 className="mb-2 text-xs font-semibold uppercase text-gray-500">{t('groups.standings')}</h4>
        <MatchList
          matches={groupMatches}
          teamNames={teamNames}
          tournamentId={tournamentId}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  )
}
