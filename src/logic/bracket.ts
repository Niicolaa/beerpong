import type { Standing } from '../types/tournament'

export function nextPowerOfTwo(n: number): number {
  if (n <= 1) return 1
  return Math.pow(2, Math.ceil(Math.log2(n)))
}

export interface BracketTeam {
  teamId: string
  seed: number
  groupId: string
}

export function selectAdvancing(
  groupStandings: Map<string, Standing[]>,
  advancePerGroup: number,
  thirdPlaceAdvance: boolean
): BracketTeam[] {
  const advancing: BracketTeam[] = []
  const thirdPlace: (Standing & { groupId: string })[] = []

  for (const [groupId, standings] of groupStandings) {
    const sorted = standings.slice()
    for (let i = 0; i < Math.min(advancePerGroup, sorted.length); i++) {
      advancing.push({ teamId: sorted[i].teamId, seed: i + 1, groupId })
    }
    if (thirdPlaceAdvance && sorted.length > advancePerGroup) {
      thirdPlace.push({ ...sorted[advancePerGroup], groupId })
    }
  }

  if (thirdPlaceAdvance && thirdPlace.length > 0) {
    const bracketSize = nextPowerOfTwo(advancing.length)
    const spotsLeft = bracketSize - advancing.length
    const sortedThird = thirdPlace.sort(
      (a, b) => b.pointDiff - a.pointDiff || b.cupsFor - a.cupsFor
    )
    for (let i = 0; i < Math.min(spotsLeft, sortedThird.length); i++) {
      advancing.push({
        teamId: sortedThird[i].teamId,
        seed: advancePerGroup + 1,
        groupId: sortedThird[i].groupId,
      })
    }
  }

  return advancing
}

export interface BracketMatch {
  round: number
  position: number
  team1Id: string | null
  team2Id: string | null
  isBye: boolean
}

export function generateKOBracket(advancing: BracketTeam[]): BracketMatch[][] {
  const bracketSize = nextPowerOfTwo(advancing.length)
  const rounds = Math.log2(bracketSize)

  // Build seeded slot order for standard single-elimination bracket
  // Ensures top seeds don't meet until later rounds
  const slots = buildBracketSlots(bracketSize)

  const r1Matches: BracketMatch[] = []
  for (let i = 0; i < bracketSize / 2; i++) {
    const slot1 = slots[i * 2]
    const slot2 = slots[i * 2 + 1]
    const team1 = advancing[slot1 - 1] ?? null
    const team2 = advancing[slot2 - 1] ?? null
    r1Matches.push({
      round: 1,
      position: i,
      team1Id: team1?.teamId ?? null,
      team2Id: team2?.teamId ?? null,
      isBye: !team2 && !!team1,
    })
  }

  const allRounds: BracketMatch[][] = [r1Matches]
  for (let r = 2; r <= rounds; r++) {
    const prevRound = allRounds[r - 2]
    const roundMatches: BracketMatch[] = []
    for (let i = 0; i < prevRound.length / 2; i++) {
      roundMatches.push({ round: r, position: i, team1Id: null, team2Id: null, isBye: false })
    }
    allRounds.push(roundMatches)
  }

  return allRounds
}

function buildBracketSlots(size: number): number[] {
  if (size === 1) return [1]
  let slots = [1, 2]
  while (slots.length < size) {
    const next: number[] = []
    const total = slots.length * 2 + 1
    for (const s of slots) {
      next.push(s, total - s)
    }
    slots = next
  }
  return slots
}
