import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { WifiOff } from 'lucide-react'

export function OfflineBanner() {
  const { t } = useTranslation()
  const [offline, setOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const on = () => setOffline(false)
    const off = () => setOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  if (!offline) return null
  return (
    <div className="flex items-center gap-2 bg-yellow-500 px-4 py-2 text-sm font-medium text-white">
      <WifiOff className="h-4 w-4 shrink-0" />
      <span>{t('app.offline')}</span>
    </div>
  )
}
