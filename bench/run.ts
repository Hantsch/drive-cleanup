/* Ad-hoc throughput benchmark for the scan engine. Not part of the app. */
import { Scanner } from '../src/main/scan/walk'

async function main() {
  const root = process.argv[2]
  if (!root) {
    console.error('usage: node out/bench.cjs <path>')
    process.exit(1)
  }

  const started = Date.now()
  const scanner = new Scanner({ emitProgress: () => {}, isCancelled: () => false })
  const { stats } = await scanner.scan(root)
  const seconds = (Date.now() - started) / 1000

  console.log(
    JSON.stringify(
      {
        root,
        files: stats.files,
        dirs: stats.dirs,
        gigabytes: +(stats.bytes / 1e9).toFixed(2),
        skipped: stats.skipped.length,
        seconds: +seconds.toFixed(2),
        filesPerSecond: Math.round(stats.files / seconds)
      },
      null,
      2
    )
  )
}

main()
