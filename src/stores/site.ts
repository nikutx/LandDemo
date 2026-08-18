import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import { appraise, type Appraisal } from '../lib/appraisal'
import { scanNearby, type ScanCandidate } from '../lib/scan'
import {
  fetchBoundaries,
  geocode,
  lookupSite,
  type Boundary,
  type LatLng,
  type SiteLookup,
} from '../lib/planningData'

/** Cirencester — the demo opens on Cotswolds AONB and a conservation area. */
export const DEFAULT_POINT: LatLng = { lat: 51.7157, lng: -1.9756 }

export const useSiteStore = defineStore('site', () => {
  const point = ref<LatLng | null>(null)
  const lookup = shallowRef<SiteLookup | null>(null)
  const boundaries = shallowRef<Boundary[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /** Results of looking for easier land nearby, and how that search is going. */
  const candidates = shallowRef<ScanCandidate[]>([])
  const scanning = ref(false)
  const scanProgress = ref(0)
  const scanRadius = ref(2000)
  const scanned = ref(false)
  let scanController: AbortController | null = null

  /** Lets a newer click cancel the in-flight lookup of an older one. */
  let inFlight: AbortController | null = null

  const appraisal = computed<Appraisal | null>(() => (lookup.value ? appraise(lookup.value) : null))
  const hasResult = computed(() => lookup.value !== null)

  async function select(next: LatLng) {
    inFlight?.abort()
    const controller = new AbortController()
    inFlight = controller

    // A new site invalidates any search for easier land around the old one.
    scanController?.abort()
    candidates.value = []
    scanning.value = false
    scanned.value = false

    point.value = next
    loading.value = true
    error.value = null
    boundaries.value = []

    try {
      const result = await lookupSite(next, controller.signal)
      if (controller.signal.aborted) return
      lookup.value = result

      // Boundaries are heavy and only decorate the map, so they load after the
      // appraisal is already readable rather than holding it up.
      void fetchBoundaries(result.constraints, controller.signal).then((found) => {
        if (!controller.signal.aborted) boundaries.value = found
      })
    } catch (cause) {
      if (controller.signal.aborted) return
      error.value = cause instanceof Error ? cause.message : 'Lookup failed'
      lookup.value = null
    } finally {
      if (!controller.signal.aborted) loading.value = false
    }
  }

  /** Resolve a postcode or place name, then appraise it. Returns the point found. */
  async function search(query: string): Promise<LatLng | null> {
    error.value = null
    try {
      const found = await geocode(query)
      if (!found) {
        error.value = `Nothing found for "${query}"`
        return null
      }
      await select(found)
      return found
    } catch {
      error.value = 'Search failed'
      return null
    }
  }

  /** Look around the current site for land that is less constrained than it is. */
  async function findEasierNearby() {
    const origin = point.value
    const current = appraisal.value
    if (!origin || !current || scanning.value) return

    scanController?.abort()
    const controller = new AbortController()
    scanController = controller

    scanning.value = true
    scanned.value = false
    scanProgress.value = 0
    candidates.value = []

    try {
      const found = await scanNearby(origin, current.score, {
        radius: scanRadius.value,
        signal: controller.signal,
        onProgress: (done, total) => {
          if (!controller.signal.aborted) scanProgress.value = Math.round((done / total) * 100)
        },
      })
      if (controller.signal.aborted) return
      candidates.value = found
      scanned.value = true
    } catch {
      if (!controller.signal.aborted) error.value = 'Could not search the surrounding area'
    } finally {
      if (!controller.signal.aborted) scanning.value = false
    }
  }

  return {
    point,
    lookup,
    boundaries,
    appraisal,
    loading,
    error,
    hasResult,
    candidates,
    scanning,
    scanProgress,
    scanRadius,
    scanned,
    select,
    search,
    findEasierNearby,
  }
})
