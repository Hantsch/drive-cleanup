/* End-to-end check: build a fake game library, scan it, print installations. */
import { mkdir, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { Scanner } from '../src/main/scan/walk'

const ROOT = join(tmpdir(), 'drivecleaner-e2e')

async function file(path: string, sizeMB: number) {
  await mkdir(join(path, '..'), { recursive: true })
  await writeFile(path, Buffer.alloc(sizeMB * 1024 * 1024))
}

async function main() {
  await rm(ROOT, { recursive: true, force: true })

  // Steam library with two games (one nested), an Epic game, and other data.
  await file(join(ROOT, 'SteamLibrary\\steamapps\\common\\Elden Ring\\game.exe'), 30)
  await file(join(ROOT, 'SteamLibrary\\steamapps\\common\\Elden Ring\\data\\pak.dat'), 20)
  await file(join(ROOT, 'SteamLibrary\\steamapps\\common\\Dota 2\\dota.exe'), 15)
  await file(join(ROOT, 'Program Files\\Epic Games\\Fortnite\\fort.exe'), 25)
  await file(join(ROOT, 'Users\\me\\Videos\\movie.mkv'), 40)

  const scanner = new Scanner({ emitProgress: () => {}, isCancelled: () => false })
  const { installations, stats } = await scanner.scan(ROOT)

  console.log('files:', stats.files, ' bytes(MB):', Math.round(stats.bytes / 1024 / 1024))
  console.log('installations:')
  for (const game of installations) {
    console.log(`  [${game.category}] ${game.name} = ${Math.round(game.sizeBytes / 1024 / 1024)} MB (${game.fileCount} files)`)
  }

  await rm(ROOT, { recursive: true, force: true })
}

main()
