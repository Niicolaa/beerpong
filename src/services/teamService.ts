import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Team } from '../types/tournament'

export async function addTeam(
  tournamentId: string,
  name: string,
  players: string[]
): Promise<string> {
  const ref = doc(collection(db, 'tournaments', tournamentId, 'teams'))
  const team: Omit<Team, 'id'> = {
    name,
    players,
    groupId: null,
    seed: 0,
    createdAt: serverTimestamp() as Timestamp,
  }
  await setDoc(ref, team)
  return ref.id
}

export async function deleteTeam(tournamentId: string, teamId: string): Promise<void> {
  await deleteDoc(doc(db, 'tournaments', tournamentId, 'teams', teamId))
}

export async function getTeams(tournamentId: string): Promise<Team[]> {
  const snap = await getDocs(collection(db, 'tournaments', tournamentId, 'teams'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Team))
}

export async function bulkSetTeamSeeds(
  tournamentId: string,
  teams: { id: string; seed: number }[]
): Promise<void> {
  const batch = writeBatch(db)
  for (const { id, seed } of teams) {
    batch.update(doc(db, 'tournaments', tournamentId, 'teams', id), { seed })
  }
  await batch.commit()
}
