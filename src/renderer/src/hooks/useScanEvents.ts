import { useEffect } from 'react'
import { useScanStore } from '@renderer/store/scanStore'

/** Wires main-process scan events into the store for the lifetime of the app. */
export function useScanEvents(): void {
  useEffect(() => {
    const { applyProgress, applyDone, applyError } = useScanStore.getState()
    const unsubscribers = [
      window.api.onScanProgress(applyProgress),
      window.api.onScanDone(applyDone),
      window.api.onScanError(applyError)
    ]
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe())
  }, [])
}
