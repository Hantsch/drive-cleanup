import { useScanStore } from '@renderer/store/scanStore'
import { BrandMark } from '@renderer/components/common/BrandMark'
import { Button } from '@renderer/components/common/Button'
import { Chip } from '@renderer/components/common/Chip'
import { SearchInput } from '@renderer/components/common/SearchInput'

export function TopBar() {
  const drives = useScanStore((state) => state.drives)
  const root = useScanStore((state) => state.root)
  const filter = useScanStore((state) => state.filter)
  const startScan = useScanStore((state) => state.startScan)
  const setFilter = useScanStore((state) => state.setFilter)
  const reset = useScanStore((state) => state.reset)

  const scanFolder = async () => {
    const folder = await window.api.selectFolder()
    if (folder) startScan(folder)
  }

  return (
    <header className="flex flex-wrap items-center gap-3">
      <BrandMark />

      <div className="flex flex-wrap gap-1.5">
        {drives.map((drive) => {
          const driveRoot = `${drive.letter}\\`
          const active = root?.toLowerCase() === driveRoot.toLowerCase()
          return (
            <Chip key={drive.letter} active={active} onClick={() => !active && startScan(driveRoot)}>
              {drive.letter}\
            </Chip>
          )
        })}
        <Chip onClick={scanFolder}>＋ Folder…</Chip>
      </div>

      <div className="flex-1" />

      <SearchInput value={filter} onChange={setFilter} />
      <Button variant="primary" onClick={reset}>
        ↻ New scan
      </Button>
    </header>
  )
}
