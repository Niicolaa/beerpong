import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Beer, CheckCircle } from 'lucide-react'
import { useTournament } from '../hooks/useTournament'
import { addTeam } from '../services/teamService'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

export function RegistrationScreen() {
  const { tournamentId } = useParams<{ tournamentId: string }>()
  const { t } = useTranslation()
  const { tournament, loading } = useTournament(tournamentId)
  const [name, setName] = useState('')
  const [players, setPlayers] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  if (loading) return <LoadingSpinner />

  if (!tournament) {
    return <p className="p-8 text-center text-red-500">{t('errors.notFound')}</p>
  }

  if (!tournament.config.registrationOpen) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
        <Beer className="mb-4 h-12 w-12 text-brand-400" />
        <p className="text-lg font-semibold text-gray-700 dark:text-white">{t('registration.closed')}</p>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
        <CheckCircle className="h-16 w-16 text-green-500" />
        <p className="text-xl font-bold text-gray-900 dark:text-white">{t('registration.success')}</p>
        <p className="text-gray-500">{tournament.name}</p>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError('')
    try {
      await addTeam(
        tournamentId!,
        name.trim(),
        players.split(',').map(p => p.trim()).filter(Boolean)
      )
      setSuccess(true)
    } catch {
      setError(t('errors.networkError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-400 to-brand-600 p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
        <div className="mb-4 text-center">
          <Beer className="mx-auto h-10 w-10 text-brand-500" />
          <h1 className="mt-2 text-xl font-bold text-gray-900 dark:text-white">{tournament.name}</h1>
          <p className="text-sm text-gray-500">{t('registration.title')}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-400">
              {t('registration.teamName')}
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-400">
              {t('registration.players')}
            </label>
            <input
              value={players}
              onChange={e => setPlayers(e.target.value)}
              placeholder="Name1, Name2"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-brand-500 py-2.5 font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {saving ? t('app.loading') : t('registration.submit')}
          </button>
        </form>
      </div>
    </div>
  )
}
