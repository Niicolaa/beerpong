import type { Match, Standing, TiebreakerField } from '../types/tournament'

export function computeStandings(
  matches: Match[],
  teamIds: string[],
  teamNames: Map<string, string>,
  tiebreakerOrder: TiebreakerField[]
): Standing[] {
  const map = new Map<string, Standing>()

  for (const id of teamIds) {
    map.set(id, {
      teamId: id,
      teamName: teamNames.get(id) ?? id,
      wins: 0,
      losses: 0,
      draws: 0,
      cupsFor: 0,
      cupsAgainst: 0,
      pointDiff: 0,
      matchesPlayed: 0,
      headToHead: {},
    })
  }

  for (const match of matches) {
    if (match.status !== 'finished' || match.score1 === null || match.score2 === null) continue
    const { team1Id, team2Id, score1, score2 } = match
    if (!team1Id || !team2Id) continue

    const t1 = map.get(team1Id)
    const t2 = map.get(team2Id)
    if (!t1 || !t2) continue

    t1.cupsFor += score1
    t1.cupsAgainst += score2
    t1.pointDiff += score1 - score2
    t1.matchesPlayed++

    t2.cupsFor += score2
    t2.cupsAgainst += score1
    t2.pointDiff += score2 - score1
    t2.matchesPlayed++

    if (score1 > score2) {
      t1.wins++
      t2.losses++
      t1.headToHead[team2Id] = 'win'
      t2.headToHead[team1Id] = 'loss'
    } else if (score2 > score1) {
      t2.wins++
      t1.losses++
      t2.headToHead[team1Id] = 'win'
      t1.headToHead[team2Id] = 'loss'
    } else {
      t1.draws++
      t2.draws++
      t1.headToHead[team2Id] = 'draw'
      t2.headToHead[team1Id] = 'draw'
    }
  }

  const standings = Array.from(map.values())
  return standings.sort((a, b) => compareStandings(a, b, tiebreakerOrder))
}

function compareStandings(a: Standing, b: Standing, order: TiebreakerField[]): number {
  for (const field of order) {
    let diff = 0
    if (field === 'wins') diff = b.wins - a.wins
    else if (field === 'pointDiff') diff = b.pointDiff - a.pointDiff
    else if (field === 'cupsFor') diff = b.cupsFor - a.cupsFor
    else if (field === 'headToHead') {
      const aVsB = a.headToHead[b.teamId]
      if (aVsB === 'win') diff = -1
      else if (aVsB === 'loss') diff = 1
    }
    if (diff !== 0) return diff
  }
  return 0
}
