import { addMinutes } from 'date-fns'
import { doc, writeBatch, Timestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Match, Tournament } from '../types/tournament'

function indexOfMin(arr: Date[]): number {
  return arr.reduce((minIdx, val, i, a) => (val < a[minIdx] ? i : minIdx), 0)
}

interface ScheduledAssignment {
  matchId: string
  scheduledStart: Date
  tableNumber: number
}

export function computeSchedule(
  groupMatches: Match[],
  koMatches: Match[],
  tournament: Tournament
): ScheduledAssignment[] {
  const { schedule } = tournament
  if (!schedule.startTime) return []

  const start = schedule.startTime.toDate()
  const gameDur = schedule.gameDurationMinutes
  const breakDur = schedule.breakBetweenGamesMinutes
  const koBreak = schedule.groupToKOBreakMinutes
  const tables = Math.max(1, schedule.tableCount)

  // tableSlots[i] = earliest time table i is available
  const tableSlots: Date[] = Array(tables).fill(null).map(() => new Date(start))
  const result: ScheduledAssignment[] = []

  // Group phase: schedule by round, trying to parallelize non-conflicting matches
  const byRound = new Map<number, Match[]>()
  for (const m of groupMatches) {
    const r = m.round
    if (!byRound.has(r)) byRound.set(r, [])
    byRound.get(r)!.push(m)
  }

  const sortedRounds = Array.from(byRound.keys()).sort((a, b) => a - b)
  for (const round of sortedRounds) {
    const roundMatches = byRound.get(round)!
    const assigned = new Set<string>()

    for (const match of roundMatches) {
      const tableIdx = indexOfMin(tableSlots)
      const scheduledStart = new Date(tableSlots[tableIdx])
      result.push({ matchId: match.id, scheduledStart, tableNumber: tableIdx + 1 })
      assigned.add(match.id)
      tableSlots[tableIdx] = addMinutes(scheduledStart, gameDur + breakDur)
    }
  }

  // Add group-to-KO break
  const maxSlot = tableSlots.reduce((max, d) => (d > max ? d : max), tableSlots[0])
  const koStart = addMinutes(maxSlot, koBreak)
  for (let i = 0; i < tables; i++) {
    tableSlots[i] = koStart
  }

  // KO phase: schedule round by round
  const koByRound = new Map<number, Match[]>()
  for (const m of koMatches) {
    if (!koByRound.has(m.round)) koByRound.set(m.round, [])
    koByRound.get(m.round)!.push(m)
  }
  const koRounds = Array.from(koByRound.keys()).sort((a, b) => a - b)
  for (const round of koRounds) {
    const roundMatches = koByRound.get(round)!
    for (const match of roundMatches) {
      const tableIdx = indexOfMin(tableSlots)
      const scheduledStart = new Date(tableSlots[tableIdx])
      result.push({ matchId: match.id, scheduledStart, tableNumber: tableIdx + 1 })
      tableSlots[tableIdx] = addMinutes(scheduledStart, gameDur + breakDur)
    }
  }

  return result
}

export async function applySchedule(
  tournamentId: string,
  assignments: ScheduledAssignment[]
): Promise<void> {
  const MAX_BATCH = 499
  for (let i = 0; i < assignments.length; i += MAX_BATCH) {
    const batch = writeBatch(db)
    const chunk = assignments.slice(i, i + MAX_BATCH)
    for (const { matchId, scheduledStart, tableNumber } of chunk) {
      batch.update(doc(db, 'tournaments', tournamentId, 'matches', matchId), {
        scheduledStart: Timestamp.fromDate(scheduledStart),
        tableNumber,
      })
    }
    await batch.commit()
  }
}
