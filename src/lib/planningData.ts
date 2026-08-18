import type { Geometry } from 'geojson'
import { CONSTRAINT_DATASETS, DATASET_BY_ID, type ConstraintDataset } from './datasets'

const PLANNING_API = 'https://www.planning.data.gov.uk'
const POSTCODES_API = 'https://api.postcodes.io'

export interface LatLng {
  lat: number
  lng: number
}

/** One designation the site sits inside. */
export interface Constraint {
  dataset: ConstraintDataset
  /** Upstream entity id, used to fetch the boundary on demand */
  entity: number | null
  /** Name as published, e.g. "Cirencester Park Conservation Area" */
  name: string
  /** Upstream reference, useful when someone wants to look it up */
  reference: string
  /** Date the designation came into effect, where published */
  startDate: string | null
}

/** Where the site sits administratively — who decides the application. */
export interface SiteContext {
  postcode: string | null
  district: string | null
  parish: string | null
  ward: string | null
  region: string | null
  constituency: string | null
}

/** A single upstream call, timed, so the UI can show its own working. */
export interface TraceEntry {
  label: string
  detail: string
  ms: number
  results: number
  ok: boolean
}

export interface SiteLookup {
  point: LatLng
  context: SiteContext
  constraints: Constraint[]
  trace: TraceEntry[]
  /** Wall-clock time for the whole parallel lookup */
  totalMs: number
}

interface PlanningEntity {
  entity?: number
  dataset: string
  name?: string
  reference?: string
  'start-date'?: string
}

/**
 * Only the fields the appraisal actually reads. Asking for these instead of the
 * default response is the difference between 152 bytes and a megabyte: the
 * boundary of a designation like the Cotswolds runs to ~1MB of coordinates, and
 * the sentence "this site is in a National Landscape" needs none of it.
 */
const SLIM_FIELDS = ['entity', 'dataset', 'name', 'reference', 'start-date']
  .map((field) => `&field=${field}`)
  .join('')

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())

const DATASET_QUERY = CONSTRAINT_DATASETS.map((dataset) => `&dataset=${dataset.id}`).join('')

/**
 * Ask planning.data.gov.uk which designations contain the point.
 *
 * All sixteen datasets go in one request rather than one request each: browsers
 * only open around six connections per host, so sixteen parallel calls queue
 * into three waves and cost more than the single batched query does.
 */
async function queryConstraints(
  point: LatLng,
  signal?: AbortSignal,
): Promise<{ constraints: Constraint[]; trace: TraceEntry }> {
  const url =
    `${PLANNING_API}/entity.json?longitude=${point.lng}&latitude=${point.lat}` +
    `&geometry_relation=intersects&limit=100${DATASET_QUERY}${SLIM_FIELDS}`

  const started = now()
  try {
    const response = await fetch(url, { signal })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const body = (await response.json()) as { entities?: PlanningEntity[] }
    const constraints = (body.entities ?? []).flatMap((entity) => {
      const dataset = DATASET_BY_ID.get(entity.dataset)
      if (!dataset) return []
      return [
        {
          dataset,
          entity: entity.entity ?? null,
          name: entity.name?.trim() || dataset.label,
          reference: entity.reference ?? '',
          startDate: entity['start-date'] || null,
        },
      ]
    })

    return {
      constraints,
      trace: {
        label: 'find_constraints',
        detail: `${CONSTRAINT_DATASETS.length} datasets · intersects(${point.lat.toFixed(4)}, ${point.lng.toFixed(4)})`,
        ms: Math.round(now() - started),
        results: constraints.length,
        ok: true,
      },
    }
  } catch (error) {
    if (signal?.aborted) throw error
    return {
      constraints: [],
      trace: {
        label: 'find_constraints',
        detail: error instanceof Error ? error.message : 'request failed',
        ms: Math.round(now() - started),
        results: 0,
        ok: false,
      },
    }
  }
}

/** Reverse geocode to the administrative context that decides the application. */
async function queryContext(
  point: LatLng,
  signal?: AbortSignal,
): Promise<{ context: SiteContext; trace: TraceEntry }> {
  const empty: SiteContext = {
    postcode: null,
    district: null,
    parish: null,
    ward: null,
    region: null,
    constituency: null,
  }
  const started = now()

  try {
    const response = await fetch(
      `${POSTCODES_API}/postcodes?lon=${point.lng}&lat=${point.lat}&radius=2000&limit=1`,
      { signal },
    )
    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const body = (await response.json()) as {
      result: Array<Record<string, string>> | null
    }
    const nearest = body.result?.[0]

    return {
      context: nearest
        ? {
            postcode: nearest.postcode ?? null,
            district: nearest.admin_district ?? null,
            parish: nearest.parish ?? null,
            ward: nearest.admin_ward ?? null,
            region: nearest.region ?? null,
            constituency: nearest.parliamentary_constituency ?? null,
          }
        : empty,
      trace: {
        label: 'locate_place',
        detail: 'postcodes.io reverse geocode',
        ms: Math.round(now() - started),
        results: nearest ? 1 : 0,
        ok: true,
      },
    }
  } catch (error) {
    if (signal?.aborted) throw error
    return {
      context: empty,
      trace: {
        label: 'locate_place',
        detail: error instanceof Error ? error.message : 'request failed',
        ms: Math.round(now() - started),
        results: 0,
        ok: false,
      },
    }
  }
}

/**
 * Everything known about a point, gathered in one parallel pass: the two
 * independent lookups run together, so the wait is the slower of them rather
 * than the sum.
 */
export async function lookupSite(point: LatLng, signal?: AbortSignal): Promise<SiteLookup> {
  const started = now()

  const [contextResult, constraintResult] = await Promise.all([
    queryContext(point, signal),
    queryConstraints(point, signal),
  ])

  const constraints = [...constraintResult.constraints].sort(
    (a, b) => b.dataset.weight - a.dataset.weight,
  )

  return {
    point,
    context: contextResult.context,
    constraints,
    trace: [contextResult.trace, constraintResult.trace],
    totalMs: Math.round(now() - started),
  }
}

export interface Boundary {
  color: string
  label: string
  geometry: Geometry
}

/**
 * Fetch the boundaries of the designations that were actually hit, one entity
 * at a time. This runs after the appraisal is already on screen: the polygons
 * are worth about a megabyte each and the reader does not need them to read.
 */
export async function fetchBoundaries(
  constraints: Constraint[],
  signal?: AbortSignal,
): Promise<Boundary[]> {
  const results = await Promise.all(
    constraints
      .filter((constraint) => constraint.entity !== null)
      .map(async (constraint) => {
        try {
          const response = await fetch(`${PLANNING_API}/entity/${constraint.entity}.geojson`, {
            signal,
          })
          if (!response.ok) return null

          const body = (await response.json()) as { geometry?: Geometry | null }
          if (!body.geometry) return null

          return {
            color: constraint.dataset.color,
            label: constraint.dataset.label,
            geometry: body.geometry,
          }
        } catch {
          return null
        }
      }),
  )

  return results.filter((boundary): boundary is Boundary => boundary !== null)
}

/** Look up a postcode or place name typed into the search box. */
export async function geocode(query: string, signal?: AbortSignal): Promise<LatLng | null> {
  const trimmed = query.trim()
  if (!trimmed) return null

  const postcodeLike = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d?[A-Z]{0,2}$/i.test(trimmed)
  const url = postcodeLike
    ? `${POSTCODES_API}/postcodes/${encodeURIComponent(trimmed)}/autocomplete`
    : `${POSTCODES_API}/places?q=${encodeURIComponent(trimmed)}&limit=1`

  const response = await fetch(url, { signal })
  if (!response.ok) return null
  const body = (await response.json()) as { result: unknown }

  if (postcodeLike) {
    const candidate = (body.result as string[] | null)?.[0]
    if (!candidate) return null
    const lookup = await fetch(`${POSTCODES_API}/postcodes/${encodeURIComponent(candidate)}`, {
      signal,
    })
    if (!lookup.ok) return null
    const detail = (await lookup.json()) as { result: { latitude: number; longitude: number } }
    return { lat: detail.result.latitude, lng: detail.result.longitude }
  }

  const place = (body.result as Array<{ latitude: number; longitude: number }> | null)?.[0]
  return place ? { lat: place.latitude, lng: place.longitude } : null
}

export { DATASET_BY_ID }
