import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Tournament, TournamentConfig, ScheduleConfig, SeedingMode } from '../types/tournament'

function generateShareCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export interface CreateTournamentInput {
  name: string
  adminUid: string
  config: TournamentConfig
  schedule: ScheduleConfig
  seedingMode: SeedingMode
}

export async function createTournament(input: CreateTournamentInput): Promise<string> {
  const id = doc(collection(db, 'tournaments')).id
  const shareCode = generateShareCode()

  const data: Omit<Tournament, 'id'> = {
    name: input.name,
    createdAt: serverTimestamp() as Timestamp,
    adminUids: [input.adminUid],
    status: input.config.registrationOpen ? 'registration' : 'setup',
    language: 'de',
    config: input.config,
    schedule: input.schedule,
    seedingMode: input.seedingMode,
    shareCode,
  }

  await setDoc(doc(db, 'tournaments', id), data)
  return id
}

export async function getTournamentByShareCode(shareCode: string): Promise<Tournament | null> {
  const q = query(
    collection(db, 'tournaments'),
    where('shareCode', '==', shareCode.toUpperCase())
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  return { id: d.id, ...d.data() } as Tournament
}

export async function updateTournamentStatus(
  tournamentId: string,
  status: Tournament['status']
): Promise<void> {
  await updateDoc(doc(db, 'tournaments', tournamentId), { status })
}

export async function updateTournamentConfig(
  tournamentId: string,
  config: Partial<TournamentConfig>
): Promise<void> {
  const updates: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(config)) {
    updates[`config.${k}`] = v
  }
  await updateDoc(doc(db, 'tournaments', tournamentId), updates)
}

export async function updateScheduleConfig(
  tournamentId: string,
  schedule: Partial<ScheduleConfig>
): Promise<void> {
  const updates: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(schedule)) {
    updates[`schedule.${k}`] = v
  }
  await updateDoc(doc(db, 'tournaments', tournamentId), updates)
}

export async function getTournament(id: string): Promise<Tournament | null> {
  const snap = await getDoc(doc(db, 'tournaments', id))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as Tournament
}
