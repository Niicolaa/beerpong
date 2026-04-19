import { useState, useEffect } from 'react'
import { onAuthStateChanged, signInAnonymously, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut, User } from 'firebase/auth'
import { auth } from '../lib/firebase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    let unsub = () => {}

    const init = async () => {
      // Process Google redirect FIRST before doing anything else
      try {
        await getRedirectResult(auth)
      } catch {
        // Not a redirect result or error — continue
      }

      // Now listen to auth state (redirect result is already applied)
      unsub = onAuthStateChanged(auth, async u => {
        if (!mounted) return
        if (!u) {
          try { await signInAnonymously(auth) } catch {}
          if (mounted) setLoading(false)
        } else {
          if (mounted) { setUser(u); setLoading(false) }
        }
      })
    }

    init()
    return () => { mounted = false; unsub() }
  }, [])

  const signInWithGoogle = () =>
    signInWithRedirect(auth, new GoogleAuthProvider())

  const logout = () => signOut(auth)

  const isAdmin = (adminUids: string[]) =>
    !!user && !user.isAnonymous && adminUids.includes(user.uid)

  return { user, loading, signInWithGoogle, logout, isAdmin }
}


  const logout = async () => {
    await signOut(auth)
  }

  const isAdmin = (tournamentAdminUids: string[]) =>
    !!user && !user.isAnonymous && tournamentAdminUids.includes(user.uid)

  return { user, loading, signInWithGoogle, logout, isAdmin }
}
