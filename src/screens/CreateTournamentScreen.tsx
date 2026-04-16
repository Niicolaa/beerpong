import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { Timestamp } from 'firebase/firestore'
import type { TournamentConfig, ScheduleConfig, SeedingMode } from '../types/tournament'
import { createTournament } from '../services/tournamentService'
import { addTeam } from '../services/teamService'
import { useAuth } from '../hooks/useAuth'
import { TournamentConfigForm } from '../components/forms/TournamentConfigForm'
import { TeamInput, type TeamEntry } from '../components/forms/TeamInput'

const defaultConfig = (): TournamentConfig => ({
  groupCount: 2,
  teamsPerGroup: 4,
  advancePerGroup: 2,
  thirdPlaceAdvance: false,
  koFormat: 'single-elim',
  tiebreakerOrder: ['wins', 'pointDiff', 'headToHead', 'cupsFor'],
  registrationOpen: false,
})

const defaultSchedule = (): ScheduleConfig => ({
  startTime: Timestamp.fromDate(new Date()),
  gameDurationMinutes: 20,
  breakBetweenGamesMinutes: 5,
  groupToKOBreakMinutes: 15,
  tableCount: 2,
})

export function CreateTournamentScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [name, setName] = useState('')
  const [config, setConfig] = useState<TournamentConfig>(defaultConfig)
  const [schedule, setSchedule] = useState<ScheduleConfig>(defaultSchedule)
  const [seedingMode, setSeedingMode] = useState<SeedingMode>('snake')
  const [teams, setTeams] = useState<TeamEntry[]>([
    { id: crypto.randomUUID(), name: '', players: '' },
    { id: crypto.randomUUID(), name: '', players: '' },
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validTeams = teams.filter(t => t.name.trim())
    if (validTeams.length < 2) {
      setError(t('create.minTeams'))
      return
    }
    if (!user || user.isAnonymous) return

    setLoading(true)
    setError('')
    try {
      const tournamentId = await createTournament({
        name: name.trim() || t('create.namePlaceholder'),
        adminUid: user.uid,
        config,
        schedule,
        seedingMode,
      })

      // Add teams
      for (let i = 0; i < validTeams.length; i++) {
        const team = validTeams[i]
        await addTeam(
          tournamentId,
          team.name.trim(),
          team.players.split(',').map(p => p.trim()).filter(Boolean)
        )
      }

      navigate(`/t/${tournamentId}/admin`)
    } catch (err) {
      setError(t('errors.networkError'))
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-2xl px-4 pb-16 pt-4">
        <button
          onClick={() => navigate('/')}
          className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
        >
          <ArrowLeft className="h-4 w-4" /> {t('app.back')}
        </button>
        <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">{t('create.title')}</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-800">
            <TournamentConfigForm
              name={name}
              onNameChange={setName}
              config={config}
              onConfigChange={c => setConfig(prev => ({ ...prev, ...c }))}
              schedule={schedule}
              onScheduleChange={s => setSchedule(prev => ({ ...prev, ...s }))}
              seedingMode={seedingMode}
              onSeedingModeChange={setSeedingMode}
            />
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-800">
            <h2 className="mb-3 text-sm font-bold text-gray-800 dark:text-white">Teams</h2>
            <TeamInput
              teams={teams}
              onChange={setTeams}
              showSeed={seedingMode === 'manual'}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-brand-500 py-3 font-bold text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {loading ? t('app.loading') : t('create.submit')}
          </button>
        </form>
      </div>
    </div>
  )
}
