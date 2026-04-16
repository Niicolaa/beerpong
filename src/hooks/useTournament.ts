import { useState, useEffect } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Tournament } from '../types/tournament'

export function useTournament(tournamentId: string | undefined) {
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!tournamentId) {
      setLoading(false)
      return
    }
    setLoading(true)
    const unsub = onSnapshot(
      doc(db, 'tournaments', tournamentId),
      snap => {
        if (snap.exists()) {
          setTournament({ id: snap.id, ...snap.data() } as Tournament)
        } else {
          setTournament(null)
        }
        setLoading(false)
      },
      err => {
        setError(err)
        setLoading(false)
      }
    )
    return unsub
  }, [tournamentId])

  return { tournament, loading, error }
}
