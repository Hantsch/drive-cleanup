import { useScanStore } from '@renderer/store/scanStore'
import { Button } from '@renderer/components/common/Button'

export function ErrorScreen() {
  const error = useScanStore((state) => state.error)
  const reset = useScanStore((state) => state.reset)

  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col items-center justify-center px-8 py-20 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#2a1620] text-2xl">⚠️</span>
      <h2 className="mt-6 text-2xl font-semibold">Scan failed</h2>
      <p className="mt-3 font-mono text-sm text-muted">{error ?? 'Unknown error'}</p>
      <Button variant="primary" onClick={reset} className="mt-8">
        Back to start
      </Button>
    </div>
  )
}
