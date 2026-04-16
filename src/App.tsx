import { useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { useUIStore } from './store/uiStore'
import { HomeScreen } from './screens/HomeScreen'
import { CreateTournamentScreen } from './screens/CreateTournamentScreen'
import { AdminDashboard } from './screens/AdminDashboard'
import { SpectatorView } from './screens/SpectatorView'
import { MatchScoringScreen } from './screens/MatchScoringScreen'
import { DisplayScreen } from './screens/DisplayScreen'
import { RegistrationScreen } from './screens/RegistrationScreen'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { getTournamentByShareCode } from './services/tournamentService'

function JoinRedirect() {
  const { shareCode } = useParams<{ shareCode: string }>()
  const [target, setTarget] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!shareCode) return
    getTournamentByShareCode(shareCode).then(t => {
      if (t) setTarget(`/t/${t.id}/spectate`)
      else setNotFound(true)
    })
  }, [shareCode])

  if (notFound) return <Navigate to="/" replace />
  if (!target) return null
  return <Navigate to={target} replace />
}

// useState import fix
import { useState } from 'react'

function DarkModeWrapper({ children }: { children: React.ReactNode }) {
  const { darkMode } = useUIStore()
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])
  return <>{children}</>
}

export default function App() {
  return (
    <ErrorBoundary>
      <DarkModeWrapper>
        <HashRouter>
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/create" element={<CreateTournamentScreen />} />
            <Route path="/join/:shareCode" element={<JoinRedirect />} />
            <Route path="/t/:tournamentId/admin" element={<AdminDashboard />} />
            <Route path="/t/:tournamentId/spectate" element={<SpectatorView />} />
            <Route path="/t/:tournamentId/display" element={<DisplayScreen />} />
            <Route path="/t/:tournamentId/register" element={<RegistrationScreen />} />
            <Route path="/t/:tournamentId/match/:matchId" element={<MatchScoringScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </DarkModeWrapper>
    </ErrorBoundary>
  )
}
