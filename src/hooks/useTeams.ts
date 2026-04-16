import { useState, useEffect } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Team } from '../types/tournament'

export function useTeams(tournamentId: string | undefined) {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tournamentId) {
      setLoading(false)
      return
    }
    const q = query(
      collection(db, 'tournaments', tournamentId, 'teams'),
      orderBy('seed')
    )
    const unsub = onSnapshot(q, snap => {
      setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() } as Team)))
      setLoading(false)
    })
    return unsub
  }, [tournamentId])

  return { teams, loading }
}
