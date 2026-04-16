import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="text-5xl">🍺</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Hoppla, etwas ist schiefgelaufen
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Bitte Seite neu laden
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-brand-500 px-6 py-2 text-white hover:bg-brand-600"
          >
            Neu laden
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
