import { create } from 'zustand'
import type { CategoryId } from '@shared/categories'
import type { DriveInfo, ScanProgress, ScanResult } from '@shared/types'

export type ScanPhase = 'idle' | 'scanning' | 'done' | 'error'

interface ScanStore {
  phase: ScanPhase
  drives: DriveInfo[]
  root: string | null
  progress: ScanProgress | null
  result: ScanResult | null
  error: string | null

  /** Bytes expected for the scan (used space of the drive), the progress %
   *  denominator. Null for folder scans where the total is unknown. */
  scanTotalBytes: number | null
  /** Wall-clock start of the current scan, used to estimate time remaining. */
  scanStartedAt: number | null

  // View state for the result screen
  filter: string
  selectedCategory: CategoryId | null

  // Commands
  loadDrives: () => Promise<void>
  startScan: (root: string) => Promise<void>
  cancelScan: () => Promise<void>
  reset: () => void
  setFilter: (value: string) => void
  toggleCategory: (id: CategoryId) => void

  // Applied from main-process scan events (see useScanEvents)
  applyProgress: (progress: ScanProgress) => void
  applyDone: (result: ScanResult) => void
  applyError: (message: string) => void
}

const FRESH = {
  root: null,
  progress: null,
  result: null,
  error: null,
  filter: '',
  selectedCategory: null,
  scanTotalBytes: null,
  scanStartedAt: null
} as const

export const useScanStore = create<ScanStore>((set, get) => ({
  phase: 'idle',
  drives: [],
  ...FRESH,

  loadDrives: async () => set({ drives: await window.api.listDrives() }),

  startScan: async (root) => {
    const drive = get().drives.find(
      (candidate) => `${candidate.letter}\\`.toLowerCase() === root.toLowerCase()
    )
    const scanTotalBytes =
      drive && drive.totalBytes > 0 ? drive.totalBytes - drive.freeBytes : null

    set({ ...FRESH, phase: 'scanning', root, scanTotalBytes, scanStartedAt: Date.now() })
    await window.api.startScan(root)
  },

  cancelScan: async () => {
    await window.api.cancelScan()
    set({ ...FRESH, phase: 'idle' })
  },

  reset: () => set({ ...FRESH, phase: 'idle' }),

  setFilter: (filter) => set({ filter }),

  toggleCategory: (id) =>
    set({ selectedCategory: get().selectedCategory === id ? null : id }),

  // Late events are ignored unless a scan is actually in progress, so cancelling
  // reliably returns to the start screen.
  applyProgress: (progress) => {
    if (get().phase === 'scanning') set({ progress })
  },
  applyDone: (result) => {
    if (get().phase === 'scanning') set({ phase: 'done', result, progress: null })
  },
  applyError: (message) => {
    if (get().phase === 'scanning') set({ phase: 'error', error: message })
  }
}))
