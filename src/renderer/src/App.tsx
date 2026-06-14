import { useEffect } from 'react'
import { useScanStore } from '@renderer/store/scanStore'
import { useScanEvents } from '@renderer/hooks/useScanEvents'
import { BackdropGlow } from '@renderer/components/common/BackdropGlow'
import { StartScreen } from '@renderer/components/start/StartScreen'
import { ScanningView } from '@renderer/components/scanning/ScanningView'
import { ErrorScreen } from '@renderer/components/error/ErrorScreen'
import { ResultView } from '@renderer/components/result/ResultView'

export default function App() {
  useScanEvents()

  const phase = useScanStore((state) => state.phase)
  const loadDrives = useScanStore((state) => state.loadDrives)

  useEffect(() => {
    loadDrives()
  }, [loadDrives])

  return (
    <div className="relative min-h-full">
      <BackdropGlow />
      <div className="relative min-h-full">
        {phase === 'idle' && <StartScreen />}
        {phase === 'scanning' && <ScanningView />}
        {phase === 'error' && <ErrorScreen />}
        {phase === 'done' && <ResultView />}
      </div>
    </div>
  )
}
