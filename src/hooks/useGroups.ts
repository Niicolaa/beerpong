import { useState, useEffect } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Group } from '../types/tournament'

export function useGroups(tournamentId: string | undefined) {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tournamentId) {
      setLoading(false)
      return
    }
    const q = query(collection(db, 'tournaments', tournamentId, 'groups'), orderBy('id'))
    const unsub = onSnapshot(q, snap => {
      setGroups(snap.docs.map(d => ({ id: d.id, ...d.data() } as Group)))
      setLoading(false)
    })
    return unsub
  }, [tournamentId])

  return { groups, loading }
}
