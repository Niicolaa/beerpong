import { useState, useEffect } from 'react'
import { onAuthStateChanged, signInAnonymously, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth'
import { auth } from '../lib/firebase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const unsub = onAuthStateChanged(auth, async u => {
      if (!mounted) return
      if (!u) {
        try { await signInAnonymously(auth) } catch {}
        if (mounted) setLoading(false)
      } else {
        if (mounted) { setUser(u); setLoading(false) }
      }
    })
    return () => { mounted = false; unsub() }
  }, [])

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
    } catch (e: unknown) {
      const err = e as { code?: string }
      if (err.code !== 'auth/popup-closed-by-user') throw e
    }
  }

  const logout = () => signOut(auth)

  const isAdmin = (adminUids: string[]) =>
    !!user && !user.isAnonymous && adminUids.includes(user.uid)

  return { user, loading, signInWithGoogle, logout, isAdmin }
}
