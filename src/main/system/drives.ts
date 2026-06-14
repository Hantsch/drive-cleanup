import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { DriveInfo } from '@shared/types'

const run = promisify(execFile)

interface LogicalDisk {
  DeviceID?: string
  VolumeName?: string
  Size?: number | string
  FreeSpace?: number | string
}

/**
 * Lists fixed local drives (DriveType 3) via PowerShell/CIM. Returns an empty
 * list on any failure so the UI can degrade to the "pick a folder" path.
 */
export async function listDrives(): Promise<DriveInfo[]> {
  const script =
    'Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3" | ' +
    'Select-Object DeviceID,VolumeName,Size,FreeSpace | ConvertTo-Json -Compress'

  try {
    const { stdout } = await run(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', script],
      { windowsHide: true, maxBuffer: 1024 * 1024 }
    )
    if (!stdout.trim()) return []

    const parsed = JSON.parse(stdout) as LogicalDisk | LogicalDisk[]
    const rows = Array.isArray(parsed) ? parsed : [parsed]

    return rows
      .map((row) => ({
        letter: row.DeviceID ?? '',
        label: row.VolumeName?.trim() || 'Local disk',
        totalBytes: Number(row.Size ?? 0),
        freeBytes: Number(row.FreeSpace ?? 0)
      }))
      .filter((drive) => drive.letter !== '' && drive.totalBytes > 0)
  } catch {
    return []
  }
}
