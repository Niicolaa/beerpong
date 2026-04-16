import { useTranslation } from 'react-i18next'
import { Timestamp } from 'firebase/firestore'
import type { TournamentConfig, ScheduleConfig, SeedingMode } from '../../types/tournament'

interface Props {
  name: string
  onNameChange: (v: string) => void
  config: TournamentConfig
  onConfigChange: (c: Partial<TournamentConfig>) => void
  schedule: ScheduleConfig
  onScheduleChange: (s: Partial<ScheduleConfig>) => void
  seedingMode: SeedingMode
  onSeedingModeChange: (m: SeedingMode) => void
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white'
const numCls = inputCls + ' w-24'

export function TournamentConfigForm({
  name, onNameChange,
  config, onConfigChange,
  schedule, onScheduleChange,
  seedingMode, onSeedingModeChange,
}: Props) {
  const { t } = useTranslation()

  const startISO = schedule.startTime
    ? new Date(schedule.startTime.toMillis()).toISOString().slice(0, 16)
    : ''

  return (
    <div className="space-y-6">
      {/* Name */}
      <Field label={t('create.name')}>
        <input
          value={name}
          onChange={e => onNameChange(e.target.value)}
          placeholder={t('create.namePlaceholder')}
          className={inputCls + ' w-full'}
          required
        />
      </Field>

      {/* Seeding */}
      <Field label={t('create.seedingMode')}>
        <select
          value={seedingMode}
          onChange={e => onSeedingModeChange(e.target.value as SeedingMode)}
          className={inputCls + ' w-full'}
        >
          <option value="snake">{t('create.seeding.snake')}</option>
          <option value="random">{t('create.seeding.random')}</option>
          <option value="manual">{t('create.seeding.manual')}</option>
        </select>
      </Field>

      {/* Group config */}
      <div>
        <h3 className="mb-3 text-sm font-bold text-gray-800 dark:text-white">{t('create.groups')}</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label={t('create.groupCount')}>
            <input type="number" min={1} max={16} value={config.groupCount}
              onChange={e => onConfigChange({ groupCount: +e.target.value })}
              className={numCls} />
          </Field>
          <Field label={t('create.teamsPerGroup')}>
            <input type="number" min={2} max={16} value={config.teamsPerGroup}
              onChange={e => onConfigChange({ teamsPerGroup: +e.target.value })}
              className={numCls} />
          </Field>
          <Field label={t('create.advancePerGroup')}>
            <input type="number" min={1} max={config.teamsPerGroup - 1} value={config.advancePerGroup}
              onChange={e => onConfigChange({ advancePerGroup: +e.target.value })}
              className={numCls} />
          </Field>
        </div>
        <label className="mt-2 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input type="checkbox" checked={config.thirdPlaceAdvance}
            onChange={e => onConfigChange({ thirdPlaceAdvance: e.target.checked })}
            className="h-4 w-4 rounded accent-brand-500" />
          {t('create.thirdPlaceAdvance')}
        </label>
        <label className="mt-2 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input type="checkbox" checked={config.registrationOpen}
            onChange={e => onConfigChange({ registrationOpen: e.target.checked })}
            className="h-4 w-4 rounded accent-brand-500" />
          {t('create.registrationOpen')}
        </label>
      </div>

      {/* Schedule */}
      <div>
        <h3 className="mb-3 text-sm font-bold text-gray-800 dark:text-white">{t('create.schedule')}</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t('create.startTime')}>
            <input
              type="datetime-local"
              value={startISO}
              onChange={e =>
                onScheduleChange({ startTime: e.target.value ? Timestamp.fromDate(new Date(e.target.value)) : null })
              }
              className={inputCls + ' w-full'}
            />
          </Field>
          <Field label={t('create.tableCount')}>
            <input type="number" min={1} max={20} value={schedule.tableCount}
              onChange={e => onScheduleChange({ tableCount: +e.target.value })}
              className={numCls} />
          </Field>
          <Field label={t('create.gameDuration')}>
            <input type="number" min={1} max={120} value={schedule.gameDurationMinutes}
              onChange={e => onScheduleChange({ gameDurationMinutes: +e.target.value })}
              className={numCls} />
          </Field>
          <Field label={t('create.breakBetweenGames')}>
            <input type="number" min={0} max={60} value={schedule.breakBetweenGamesMinutes}
              onChange={e => onScheduleChange({ breakBetweenGamesMinutes: +e.target.value })}
              className={numCls} />
          </Field>
          <Field label={t('create.groupToKOBreak')}>
            <input type="number" min={0} max={120} value={schedule.groupToKOBreakMinutes}
              onChange={e => onScheduleChange({ groupToKOBreakMinutes: +e.target.value })}
              className={numCls} />
          </Field>
        </div>
      </div>
    </div>
  )
}
