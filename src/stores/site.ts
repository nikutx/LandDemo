import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import { appraise, type Appraisal } from '../lib/appraisal'
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

  /** Lets a newer click cancel the in-flight lookup of an older one. */
  let inFlight: AbortController | null = null

  const appraisal = computed<Appraisal | null>(() => (lookup.value ? appraise(lookup.value) : null))
  const hasResult = computed(() => lookup.value !== null)

  async function select(next: LatLng) {
    inFlight?.abort()
    const controller = new AbortController()
    inFlight = controller

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

  return { point, lookup, boundaries, appraisal, loading, error, hasResult, select, search }
})
