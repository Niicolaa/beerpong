import { Timestamp } from 'firebase/firestore'

export type TournamentStatus = 'setup' | 'registration' | 'group' | 'knockout' | 'finished'
export type SeedingMode = 'snake' | 'random' | 'manual'
export type KOFormat = 'single-elim'
export type TiebreakerField = 'wins' | 'pointDiff' | 'headToHead' | 'cupsFor'
export type MatchPhase = 'group' | 'knockout'
export type MatchStatus = 'scheduled' | 'active' | 'finished' | 'bye'
export type BracketSlot = 'team1' | 'team2'

export interface TournamentConfig {
  groupCount: number
  teamsPerGroup: number
  advancePerGroup: number
  thirdPlaceAdvance: boolean
  koFormat: KOFormat
  tiebreakerOrder: TiebreakerField[]
  registrationOpen: boolean
}

export interface ScheduleConfig {
  startTime: Timestamp | null
  gameDurationMinutes: number
  breakBetweenGamesMinutes: number
  groupToKOBreakMinutes: number
  tableCount: number
}

export interface Tournament {
  id: string
  name: string
  createdAt: Timestamp
  adminUids: string[]
  status: TournamentStatus
  language: 'de' | 'en'
  config: TournamentConfig
  schedule: ScheduleConfig
  seedingMode: SeedingMode
  shareCode: string
}

export interface Team {
  id: string
  name: string
  players: string[]
  groupId: string | null
  seed: number
  createdAt: Timestamp
}

export interface Group {
  id: string
  name: string
  teamIds: string[]
}

export interface MatchTimer {
  durationSeconds: number
  startedAt: Timestamp | null
  pausedAt: Timestamp | null
  elapsedSeconds: number
  alarmEnabled: boolean
}

export interface Match {
  id: string
  phase: MatchPhase
  groupId: string | null
  round: number
  matchNumber: number
  tableNumber: number | null
  scheduledStart: Timestamp | null
  team1Id: string | null
  team2Id: string | null
  score1: number | null
  score2: number | null
  winnerId: string | null
  status: MatchStatus
  timer: MatchTimer
  nextMatchId: string | null
  loserNextMatchId: string | null
  slot: BracketSlot | null
}

export interface Bracket {
  id: string
  rounds: number
  matchIds: string[][]
  generatedAt: Timestamp
}

export interface Standing {
  teamId: string
  teamName: string
  wins: number
  losses: number
  draws: number
  cupsFor: number
  cupsAgainst: number
  pointDiff: number
  matchesPlayed: number
  headToHead: Record<string, 'win' | 'loss' | 'draw'>
}

export interface TournamentStats {
  teamId: string
  teamName: string
  totalCupsFor: number
  totalCupsAgainst: number
  wins: number
  losses: number
  winRate: number
}
