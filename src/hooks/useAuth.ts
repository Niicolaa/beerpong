import { useState, useEffect } from 'react'
import { onAuthStateChanged, signInAnonymously, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth'
import { auth } from '../lib/firebase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      if (!u) {
        try {
          await signInAnonymously(auth)
        } catch {
          // Silently fail if Firebase not configured
        }
      } else {
        setUser(u)
        setLoading(false)
      }
    })
    return unsub
  }, [])

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
  }

  const logout = async () => {
    await signOut(auth)
  }

  const isAdmin = (tournamentAdminUids: string[]) =>
    !!user && !user.isAnonymous && tournamentAdminUids.includes(user.uid)

  return { user, loading, signInWithGoogle, logout, isAdmin }
}
