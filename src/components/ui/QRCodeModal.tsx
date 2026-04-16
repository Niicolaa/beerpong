import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useTranslation } from 'react-i18next'
import { X, Copy, Check } from 'lucide-react'

interface Props {
  shareCode: string
  onClose: () => void
}

export function QRCodeModal({ shareCode, onClose }: Props) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const url = `${window.location.origin}${import.meta.env.BASE_URL}#/join/${shareCode}`

  const copy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold dark:text-white">{t('tournament.qrCode')}</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="h-5 w-5 dark:text-gray-300" />
          </button>
        </div>

        <div className="flex justify-center rounded-xl bg-white p-4">
          <QRCodeSVG value={url} size={200} includeMargin />
        </div>

        <div className="mt-4 rounded-lg bg-gray-100 px-3 py-2 dark:bg-gray-700">
          <p className="text-center text-2xl font-mono font-bold tracking-widest text-brand-600 dark:text-brand-400">
            {shareCode}
          </p>
        </div>

        <div className="mt-3 flex items-center gap-2 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-600">
          <span className="flex-1 truncate px-3 py-2 text-xs text-gray-500 dark:text-gray-400">{url}</span>
          <button
            onClick={copy}
            className="flex items-center gap-1 bg-brand-500 px-3 py-2 text-sm text-white hover:bg-brand-600"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? t('app.copied') : t('app.copy')}
          </button>
        </div>
      </div>
    </div>
  )
}
