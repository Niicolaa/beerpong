import { useTranslation } from 'react-i18next'
import type { Standing } from '../../types/tournament'

interface Props {
  standings: Standing[]
  advanceCount: number
}

export function StandingsTable({ standings, advanceCount }: Props) {
  const { t } = useTranslation()

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase text-gray-500 dark:border-gray-700 dark:text-gray-400">
            <th className="pb-2 pr-2">{t('groups.position')}</th>
            <th className="pb-2 pr-2">{t('groups.team')}</th>
            <th className="pb-2 pr-2 text-center">{t('groups.wins')}</th>
            <th className="pb-2 pr-2 text-center">{t('groups.losses')}</th>
            <th className="pb-2 pr-2 text-center">{t('groups.cups')}</th>
            <th className="pb-2 text-center">{t('groups.diff')}</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s, i) => (
            <tr
              key={s.teamId}
              className={`border-b border-gray-100 dark:border-gray-800 ${
                i < advanceCount
                  ? 'font-medium text-green-700 dark:text-green-400'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              <td className="py-1.5 pr-2">{i + 1}</td>
              <td className="py-1.5 pr-2 max-w-[120px] truncate">{s.teamName}</td>
              <td className="py-1.5 pr-2 text-center">{s.wins}</td>
              <td className="py-1.5 pr-2 text-center">{s.losses}</td>
              <td className="py-1.5 pr-2 text-center">{s.cupsFor}</td>
              <td className={`py-1.5 text-center ${s.pointDiff >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                {s.pointDiff > 0 ? '+' : ''}{s.pointDiff}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
