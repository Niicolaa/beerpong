import {
  doc,
  updateDoc,
  runTransaction,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Match, MatchTimer } from '../types/tournament'

export async function submitScore(
  tournamentId: string,
  matchId: string,
  score1: number,
  score2: number
): Promise<void> {
  const matchRef = doc(db, 'tournaments', tournamentId, 'matches', matchId)
  await runTransaction(db, async tx => {
    const snap = await tx.get(matchRef)
    if (!snap.exists()) throw new Error('Match not found')
    const data = snap.data() as Match
    if (data.status === 'finished') throw new Error('Match already finished')
    const winnerId =
      score1 > score2 ? data.team1Id : score2 > score1 ? data.team2Id : null
    tx.update(matchRef, {
      score1,
      score2,
      winnerId,
      status: 'finished',
    })
  })
}

export async function reopenMatch(tournamentId: string, matchId: string): Promise<void> {
  await updateDoc(doc(db, 'tournaments', tournamentId, 'matches', matchId), {
    score1: null,
    score2: null,
    winnerId: null,
    status: 'scheduled',
  })
}

export async function advanceKOWinner(
  tournamentId: string,
  match: Match
): Promise<void> {
  if (!match.winnerId || !match.nextMatchId || !match.slot) return
  const nextRef = doc(db, 'tournaments', tournamentId, 'matches', match.nextMatchId)
  await updateDoc(nextRef, {
    [match.slot === 'team1' ? 'team1Id' : 'team2Id']: match.winnerId,
  })
}

export async function repairBracket(tournamentId: string, matches: Match[]): Promise<void> {
  const koMatches = matches.filter(m => m.phase === 'knockout' && m.status === 'finished')
  if (koMatches.length === 0) return
  const batch = writeBatch(db)
  for (const m of koMatches) {
    if (m.winnerId && m.nextMatchId && m.slot) {
      const nextRef = doc(db, 'tournaments', tournamentId, 'matches', m.nextMatchId)
      batch.update(nextRef, {
        [m.slot === 'team1' ? 'team1Id' : 'team2Id']: m.winnerId,
      })
    }
  }
  await batch.commit()
}

export async function startTimer(tournamentId: string, matchId: string): Promise<void> {
  await updateDoc(doc(db, 'tournaments', tournamentId, 'matches', matchId), {
    'timer.startedAt': serverTimestamp() as Timestamp,
    'timer.pausedAt': null,
  })
}

export async function pauseTimer(
  tournamentId: string,
  matchId: string,
  elapsedSeconds: number
): Promise<void> {
  await updateDoc(doc(db, 'tournaments', tournamentId, 'matches', matchId), {
    'timer.pausedAt': serverTimestamp() as Timestamp,
    'timer.elapsedSeconds': elapsedSeconds,
    'timer.startedAt': null,
  })
}

export async function resetTimer(tournamentId: string, matchId: string): Promise<void> {
  const timerUpdate: MatchTimer = {
    durationSeconds: 0,
    startedAt: null,
    pausedAt: null,
    elapsedSeconds: 0,
    alarmEnabled: false,
  }
  await updateDoc(doc(db, 'tournaments', tournamentId, 'matches', matchId), {
    timer: timerUpdate,
  })
}

export async function configureTimer(
  tournamentId: string,
  matchId: string,
  durationSeconds: number,
  alarmEnabled: boolean
): Promise<void> {
  await updateDoc(doc(db, 'tournaments', tournamentId, 'matches', matchId), {
    'timer.durationSeconds': durationSeconds,
    'timer.alarmEnabled': alarmEnabled,
    'timer.startedAt': null,
    'timer.pausedAt': null,
    'timer.elapsedSeconds': 0,
  })
}
