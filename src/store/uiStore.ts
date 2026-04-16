import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIStore {
  darkMode: boolean
  toggleDarkMode: () => void
  activeTab: string
  setActiveTab: (tab: string) => void
  qrModalOpen: boolean
  setQRModalOpen: (open: boolean) => void
}

export const useUIStore = create<UIStore>()(
  persist(
    set => ({
      darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
      toggleDarkMode: () => set(s => ({ darkMode: !s.darkMode })),
      activeTab: 'groups',
      setActiveTab: (tab: string) => set({ activeTab: tab }),
      qrModalOpen: false,
      setQRModalOpen: (open: boolean) => set({ qrModalOpen: open }),
    }),
    { name: 'bp-ui' }
  )
)
