import { appraise } from './appraisal'
import { lookupSite, type LatLng } from './planningData'

/** One sampled point near the site, with its appraisal. */
export interface ScanCandidate {
  point: LatLng
  score: number
  headline: string
  designations: string[]
  /** Metres from the point the scan started at */
  distance: number
  /** Compass direction from the origin, e.g. "NE" */
  bearing: string
}

export interface ScanOptions {
  /** How far out to look, in metres */
  radius: number
  signal?: AbortSignal
  /** Called as each sample lands, for progress */
  onProgress?: (done: number, total: number) => void
}

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
const METRES_PER_DEGREE_LAT = 111_320

/**
 * Sample points on two rings around the origin: four at half the radius and
 * eight at the full radius. Twelve samples is enough to say "the land that way
 * is easier" without hammering a public API for a demo.
 */
function samplePoints(origin: LatLng, radius: number): Array<Omit<ScanCandidate, 'score' | 'headline' | 'designations'>> {
  const lngScale = Math.cos((origin.lat * Math.PI) / 180) || 1
  const rings: Array<{ distance: number; directions: number[] }> = [
    { distance: radius / 2, directions: [0, 2, 4, 6] },
    { distance: radius, directions: [0, 1, 2, 3, 4, 5, 6, 7] },
  ]

  return rings.flatMap((ring) =>
    ring.directions.map((index) => {
      const angle = (index / COMPASS.length) * 2 * Math.PI
      const north = Math.cos(angle) * ring.distance
      const east = Math.sin(angle) * ring.distance
      return {
        point: {
          lat: origin.lat + north / METRES_PER_DEGREE_LAT,
          lng: origin.lng + east / (METRES_PER_DEGREE_LAT * lngScale),
        },
        distance: Math.round(ring.distance),
        bearing: COMPASS[index],
      }
    }),
  )
}

/** Run tasks a few at a time, so a scan stays a polite neighbour to a public API. */
async function pooled<T, R>(items: T[], limit: number, task: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length)
  let next = 0

  async function worker() {
    while (next < items.length) {
      const index = next++
      results[index] = await task(items[index])
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

/**
 * Look at the land around a point and report which of it is less constrained.
 * Candidates come back easiest first; anything scoring no better than the
 * origin is dropped, because "here is somewhere equally difficult" is noise.
 */
export async function scanNearby(
  origin: LatLng,
  originScore: number,
  { radius, signal, onProgress }: ScanOptions,
): Promise<ScanCandidate[]> {
  const samples = samplePoints(origin, radius)
  let done = 0

  const scored = await pooled(samples, 4, async (sample) => {
    const lookup = await lookupSite(sample.point, signal)
    const appraisal = appraise(lookup)
    onProgress?.(++done, samples.length)

    return {
      ...sample,
      score: appraisal.score,
      headline: appraisal.headline,
      designations: appraisal.drivers.map((constraint) => constraint.dataset.label),
    }
  })

  return scored
    .filter((candidate) => candidate.score < originScore)
    .sort((a, b) => a.score - b.score || a.distance - b.distance)
}
