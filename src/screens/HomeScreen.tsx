import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Beer, LogIn, PlusCircle } from 'lucide-react'
import { getTournamentByShareCode } from '../services/tournamentService'
import { useAuth } from '../hooks/useAuth'

export function HomeScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { signInWithGoogle, user } = useAuth()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const join = async () => {
    if (!code.trim()) return
    setLoading(true)
    setError('')
    try {
      const tournament = await getTournamentByShareCode(code.trim())
      if (!tournament) {
        setError(t('home.invalidCode'))
      } else {
        navigate(`/t/${tournament.id}/spectate`)
      }
    } catch {
      setError(t('errors.networkError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-400 to-brand-600 p-6">
      <div className="mb-8 flex flex-col items-center gap-2 text-white">
        <Beer className="h-16 w-16" />
        <h1 className="text-3xl font-extrabold tracking-tight">{t('home.title')}</h1>
        <p className="text-brand-100">{t('home.subtitle')}</p>
      </div>

      <div className="w-full max-w-sm space-y-3">
        {/* Join by code */}
        <div className="overflow-hidden rounded-2xl bg-white p-4 shadow-lg dark:bg-gray-800">
          <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-400">
            {t('home.joinCode')}
          </label>
          <div className="flex flex-col gap-2">
            <input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && join()}
              placeholder={t('home.joinPlaceholder')}
              maxLength={6}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-lg uppercase tracking-widest dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <button
              onClick={join}
              disabled={loading || !code.trim()}
              className="w-full rounded-lg bg-brand-500 px-4 py-2 font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {loading ? '…' : t('home.join')}
            </button>
          </div>
          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>

        {/* Create tournament (requires login) */}
        {user && !user.isAnonymous ? (
          <button
            onClick={() => navigate('/create')}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white/20 py-3 font-semibold text-white backdrop-blur hover:bg-white/30"
          >
            <PlusCircle className="h-5 w-5" />
            {t('home.createTournament')}
          </button>
        ) : (
          <button
            onClick={signInWithGoogle}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white/20 py-3 font-semibold text-white backdrop-blur hover:bg-white/30"
          >
            <LogIn className="h-5 w-5" />
            {t('home.createTournament')} (Google Login)
          </button>
        )}
      </div>
    </div>
  )
}
