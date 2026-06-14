import { useScanStore } from '@renderer/store/scanStore'
import { BrandMark } from '@renderer/components/common/BrandMark'
import { DriveCard } from './DriveCard'

export function StartScreen() {
  const drives = useScanStore((state) => state.drives)
  const startScan = useScanStore((state) => state.startScan)

  const scanFolder = async () => {
    const folder = await window.api.selectFolder()
    if (folder) startScan(folder)
  }

  return (
    <div className="mx-auto flex min-h-full max-w-5xl flex-col px-8 py-12">
      <BrandMark />

      <header className="animate-rise mt-16">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
          Disk usage analyzer
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Where did your space go?</h1>
        <p className="mt-3 max-w-xl text-muted">
          Pick a drive to scan. Drive Cleaner groups everything by category and folder so the space
          hogs are obvious. It is read-only — nothing is ever deleted.
        </p>
      </header>

      <section className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {drives.map((drive, index) => (
          <DriveCard
            key={drive.letter}
            drive={drive}
            index={index}
            onScan={() => startScan(`${drive.letter}\\`)}
          />
        ))}
      </section>

      {drives.length === 0 && (
        <p className="mt-8 text-sm text-muted">
          No fixed drives detected. You can still scan any folder below.
        </p>
      )}

      <button
        onClick={scanFolder}
        className="animate-rise mt-6 inline-flex w-fit cursor-default items-center gap-2 rounded-xl border border-dashed border-line px-5 py-3 text-sm text-muted transition hover:border-accent hover:text-ink"
        style={{ animationDelay: '240ms' }}
      >
        ＋ Scan a specific folder instead
      </button>
    </div>
  )
}
