import { useState, useEffect } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Match } from '../types/tournament'

export function useMatches(tournamentId: string | undefined) {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tournamentId) {
      setLoading(false)
      return
    }
    const q = query(
      collection(db, 'tournaments', tournamentId, 'matches'),
      orderBy('matchNumber')
    )
    const unsub = onSnapshot(q, snap => {
      setMatches(snap.docs.map(d => ({ id: d.id, ...d.data() } as Match)))
      setLoading(false)
    })
    return unsub
  }, [tournamentId])

  return { matches, loading }
}
