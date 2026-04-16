import {
  collection,
  doc,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Match, Standing, Tournament, MatchTimer } from '../types/tournament'
import { generateKOBracket, selectAdvancing } from '../logic/bracket'
import { computeStandings } from '../logic/standings'
import type { BracketTeam } from '../logic/bracket'

const emptyTimer = (): MatchTimer => ({
  durationSeconds: 0,
  startedAt: null,
  pausedAt: null,
  elapsedSeconds: 0,
  alarmEnabled: false,
})

export async function generateKOPhase(
  tournament: Tournament,
  matches: Match[],
  teamNames: Map<string, string>
): Promise<void> {
  const tid = tournament.id
  const { config } = tournament

  // Compute standings per group
  const groupIds = Array.from(new Set(matches.map(m => m.groupId).filter(Boolean))) as string[]
  const groupStandings = new Map<string, Standing[]>()

  for (const gId of groupIds) {
    const groupMatches = matches.filter(m => m.groupId === gId && m.phase === 'group')
    const teamIds = Array.from(
      new Set([
        ...groupMatches.map(m => m.team1Id).filter(Boolean),
        ...groupMatches.map(m => m.team2Id).filter(Boolean),
      ])
    ) as string[]
    const standings = computeStandings(
      groupMatches,
      teamIds,
      teamNames,
      config.tiebreakerOrder
    )
    groupStandings.set(gId, standings)
  }

  const advancing: BracketTeam[] = selectAdvancing(
    groupStandings,
    config.advancePerGroup,
    config.thirdPlaceAdvance
  )

  const bracketRounds = generateKOBracket(advancing)
  const batch = writeBatch(db)

  // Create match documents for all rounds
  const matchRefs: string[][] = []
  for (const round of bracketRounds) {
    const roundRefs: string[] = []
    for (const bm of round) {
      const matchRef = doc(collection(db, 'tournaments', tid, 'matches'))
      const match: Omit<Match, 'id'> = {
        phase: 'knockout',
        groupId: null,
        round: bm.round,
        matchNumber: bm.position,
        tableNumber: null,
        scheduledStart: null,
        team1Id: bm.team1Id,
        team2Id: bm.team2Id,
        score1: null,
        score2: null,
        winnerId: bm.isBye ? bm.team1Id : null,
        status: bm.isBye ? 'bye' : 'scheduled',
        timer: emptyTimer(),
        nextMatchId: null,
        loserNextMatchId: null,
        slot: null,
      }
      batch.set(matchRef, match)
      roundRefs.push(matchRef.id)
    }
    matchRefs.push(roundRefs)
  }

  // Wire nextMatchId and slot between rounds
  for (let r = 0; r < matchRefs.length - 1; r++) {
    const currentRound = matchRefs[r]
    const nextRound = matchRefs[r + 1]
    for (let i = 0; i < currentRound.length; i++) {
      const nextMatchIdx = Math.floor(i / 2)
      const slot = i % 2 === 0 ? 'team1' : 'team2'
      const matchRef = doc(db, 'tournaments', tid, 'matches', currentRound[i])
      batch.update(matchRef, {
        nextMatchId: nextRound[nextMatchIdx],
        slot,
      })
    }
  }

  // Auto-advance bye matches
  for (let r = 0; r < bracketRounds.length - 1; r++) {
    for (let i = 0; i < bracketRounds[r].length; i++) {
      const bm = bracketRounds[r][i]
      if (bm.isBye && bm.team1Id) {
        const nextMatchId = matchRefs[r + 1][Math.floor(i / 2)]
        const slot = i % 2 === 0 ? 'team1Id' : 'team2Id'
        const nextRef = doc(db, 'tournaments', tid, 'matches', nextMatchId)
        batch.update(nextRef, { [slot]: bm.team1Id })
      }
    }
  }

  // Write bracket document
  batch.set(doc(db, 'tournaments', tid, 'bracket', 'main'), {
    id: 'main',
    rounds: bracketRounds.length,
    matchIds: matchRefs,
    generatedAt: serverTimestamp() as Timestamp,
  })

  // Update tournament status
  batch.update(doc(db, 'tournaments', tid), { status: 'knockout' })

  await batch.commit()
}
