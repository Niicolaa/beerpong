import { useState, useEffect } from 'react'
import { onAuthStateChanged, signInAnonymously, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut, User } from 'firebase/auth'
import { auth } from '../lib/firebase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Pick up Google redirect result on page load
    getRedirectResult(auth).catch(() => {})

    const unsub = onAuthStateChanged(auth, async u => {
      if (!u) {
        try {
          await signInAnonymously(auth)
        } catch {
          // Anonymous auth not enabled — show UI anyway
        }
        setLoading(false)
      } else {
        setUser(u)
        setLoading(false)
      }
    })
    return unsub
  }, [])

  const signInWithGoogle = () => {
    const provider = new GoogleAuthProvider()
    return signInWithRedirect(auth, provider)
  }

  const logout = async () => {
    await signOut(auth)
  }

  const isAdmin = (tournamentAdminUids: string[]) =>
    !!user && !user.isAnonymous && tournamentAdminUids.includes(user.uid)

  return { user, loading, signInWithGoogle, logout, isAdmin }
}
