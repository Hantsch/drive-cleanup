/**
 * Maps a fill fraction (0..1) to a traffic-light tone: a near-full drive reads
 * as a warning, a roomy one as healthy.
 */
export function usageTone(fraction: number): string {
  if (fraction >= 0.9) return '#fb7185' // rose — nearly full
  if (fraction >= 0.75) return '#fbbf24' // amber — getting tight
  return '#34d399' // emerald — healthy
}
