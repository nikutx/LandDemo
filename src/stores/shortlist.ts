import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { LatLng } from '../lib/planningData'

const STORAGE_KEY = 'landdemo.shortlist.v1'

/** A site someone is considering, kept so it can be compared against others. */
export interface ShortlistedSite {
  id: string
  point: LatLng
  place: string
  score: number
  headline: string
  /** Designation labels, worst first */
  designations: string[]
  /** The single action that matters most for this site */
  nextStep: string | null
  savedAt: number
}

/** Sites a few metres apart are the same site for shortlisting purposes. */
function idFor(point: LatLng): string {
  return `${point.lat.toFixed(4)},${point.lng.toFixed(4)}`
}

function load(): ShortlistedSite[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as ShortlistedSite[]) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export const useShortlistStore = defineStore('shortlist', () => {
  const sites = ref<ShortlistedSite[]>(load())

  /** Easiest first — the whole point of keeping a list is the ordering. */
  const ranked = computed(() => [...sites.value].sort((a, b) => a.score - b.score))
  const count = computed(() => sites.value.length)

  function has(point: LatLng): boolean {
    const id = idFor(point)
    return sites.value.some((site) => site.id === id)
  }

  function add(site: Omit<ShortlistedSite, 'id' | 'savedAt'>) {
    const id = idFor(site.point)
    if (sites.value.some((existing) => existing.id === id)) return
    sites.value = [...sites.value, { ...site, id, savedAt: Date.now() }]
  }

  function remove(id: string) {
    sites.value = sites.value.filter((site) => site.id !== id)
  }

  function toggle(site: Omit<ShortlistedSite, 'id' | 'savedAt'>) {
    if (has(site.point)) {
      remove(idFor(site.point))
    } else {
      add(site)
    }
  }

  function clear() {
    sites.value = []
  }

  /** A shortlist worth keeping is one you can paste into an email. */
  function asText(): string {
    if (!ranked.value.length) return ''
    const lines = ranked.value.map((site, index) => {
      const designations = site.designations.length
        ? site.designations.join(', ')
        : 'no mapped designations'
      return (
        `${index + 1}. ${site.place} — ${site.score}/100, ${site.headline.toLowerCase()}\n` +
        `   ${designations}\n` +
        `   ${location.origin}${location.pathname}?lat=${site.point.lat.toFixed(5)}&lng=${site.point.lng.toFixed(5)}`
      )
    })
    return `Shortlist, least constrained first\n\n${lines.join('\n\n')}`
  }

  watch(
    sites,
    (value) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
      } catch {
        // A full or blocked store is not worth breaking the page over.
      }
    },
    { deep: true },
  )

  return { sites, ranked, count, has, add, remove, toggle, clear, asText }
})
