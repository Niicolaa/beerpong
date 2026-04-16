import {
  collection,
  doc,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Tournament, Team, Match, MatchTimer } from '../types/tournament'
import { snakeSeed, randomShuffle } from '../logic/seeding'
import { generateRoundRobin } from '../logic/roundRobin'

const emptyTimer = (): MatchTimer => ({
  durationSeconds: 0,
  startedAt: null,
  pausedAt: null,
  elapsedSeconds: 0,
  alarmEnabled: false,
})

export async function generateGroups(tournament: Tournament, teams: Team[]): Promise<void> {
  const { config, seedingMode } = tournament
  let orderedTeams = [...teams]

  if (seedingMode === 'random') {
    orderedTeams = randomShuffle(orderedTeams)
  }
  // For 'manual': teams are already ordered by seed
  // Assign seeds 1..N based on current order
  orderedTeams = orderedTeams.map((t, i) => ({ ...t, seed: i + 1 }))

  const groupAssignment = snakeSeed(
    orderedTeams.map(t => t.id),
    config.groupCount
  )

  const groupIds = Array.from({ length: config.groupCount }, (_, i) =>
    String.fromCharCode(65 + i)
  )
  const groupTeams = new Map<string, string[]>(groupIds.map(id => [id, []]))
  for (const team of orderedTeams) {
    const gId = groupAssignment.get(team.id)
    if (gId) groupTeams.get(gId)!.push(team.id)
  }

  const batch = writeBatch(db)
  const tid = tournament.id

  // Write group documents
  for (const gId of groupIds) {
    const teamIds = groupTeams.get(gId) ?? []
    if (teamIds.length === 0) continue
    batch.set(doc(db, 'tournaments', tid, 'groups', gId), {
      id: gId,
      name: `Gruppe ${gId}`,
      teamIds,
    })
  }

  // Update team seeds and groupIds
  for (const team of orderedTeams) {
    const gId = groupAssignment.get(team.id)
    batch.update(doc(db, 'tournaments', tid, 'teams', team.id), {
      seed: team.seed,
      groupId: gId ?? null,
    })
  }

  // Generate round-robin matches per group
  let matchNumber = 0
  for (const gId of groupIds) {
    const teamIds = groupTeams.get(gId) ?? []
    if (teamIds.length < 2) continue
    const rounds = generateRoundRobin(teamIds)
    for (const { round, pairings } of rounds) {
      for (const [team1Id, team2Id] of pairings) {
        const matchRef = doc(collection(db, 'tournaments', tid, 'matches'))
        const match: Omit<Match, 'id'> = {
          phase: 'group',
          groupId: gId,
          round,
          matchNumber: matchNumber++,
          tableNumber: null,
          scheduledStart: null,
          team1Id,
          team2Id,
          score1: null,
          score2: null,
          winnerId: null,
          status: 'scheduled',
          timer: emptyTimer(),
          nextMatchId: null,
          loserNextMatchId: null,
          slot: null,
        }
        batch.set(matchRef, match)
      }
    }
  }

  // Update tournament status
  batch.update(doc(db, 'tournaments', tid), {
    status: 'group',
    updatedAt: serverTimestamp() as Timestamp,
  })

  await batch.commit()
}
