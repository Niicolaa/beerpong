export type Pairing = [string, string]

export function generateRoundRobin(teamIds: string[]): { round: number; pairings: Pairing[] }[] {
  const teams = teamIds.length % 2 === 0 ? [...teamIds] : [...teamIds, '__BYE__']
  const n = teams.length
  const fixed = teams[0]
  const rotating = teams.slice(1)
  const rounds: { round: number; pairings: Pairing[] }[] = []

  for (let r = 0; r < n - 1; r++) {
    const circle = [fixed, ...rotating]
    const pairings: Pairing[] = []
    for (let i = 0; i < n / 2; i++) {
      const a = circle[i]
      const b = circle[n - 1 - i]
      if (a !== '__BYE__' && b !== '__BYE__') {
        pairings.push([a, b])
      }
    }
    if (pairings.length > 0) {
      rounds.push({ round: r + 1, pairings })
    }
    rotating.unshift(rotating.pop()!)
  }

  return rounds
}
