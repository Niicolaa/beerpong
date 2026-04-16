export function snakeSeed(teamIds: string[], groupCount: number): Map<string, string> {
  const groupIds = Array.from({ length: groupCount }, (_, i) =>
    String.fromCharCode(65 + i)
  )
  const assignment = new Map<string, string>()
  let direction = 1
  let groupIndex = 0

  for (const teamId of teamIds) {
    assignment.set(teamId, groupIds[groupIndex])
    groupIndex += direction
    if (groupIndex >= groupCount) {
      groupIndex = groupCount - 1
      direction = -1
    } else if (groupIndex < 0) {
      groupIndex = 0
      direction = 1
    }
  }

  return assignment
}

export function randomShuffle<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
