<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import MapCanvas from './components/MapCanvas.vue'
import SitePanel from './components/SitePanel.vue'
import TracePanel from './components/TracePanel.vue'
import { DEFAULT_POINT, useSiteStore } from './stores/site'

const store = useSiteStore()
const { point, loading } = storeToRefs(store)

const query = ref('')
const searching = ref(false)
const copied = ref(false)

async function runSearch() {
  if (!query.value.trim() || searching.value) return
  searching.value = true
  await store.search(query.value)
  searching.value = false
}

async function shareLink() {
  await navigator.clipboard.writeText(window.location.href)
  copied.value = true
  setTimeout(() => (copied.value = false), 1800)
}

/**
 * A site is a URL: every appraisal can be pasted to a colleague.
 * The opening lookup is driven from here rather than from the map's load event,
 * so the appraisal never waits on WebGL to be ready.
 */
onMounted(() => {
  const params = new URLSearchParams(window.location.search)
  const lat = Number(params.get('lat'))
  const lng = Number(params.get('lng'))
  const shared = Number.isFinite(lat) && Number.isFinite(lng) && (lat || lng)
  store.select(shared ? { lat, lng } : DEFAULT_POINT)
})

watch(point, (next) => {
  if (!next) return
  const url = new URL(window.location.href)
  url.searchParams.set('lat', next.lat.toFixed(5))
  url.searchParams.set('lng', next.lng.toFixed(5))
  window.history.replaceState({}, '', url)
})
</script>

<template>
  <div class="flex h-screen flex-col bg-slate-100 lg:flex-row">
    <main class="relative min-h-0 flex-1">
      <MapCanvas />

      <div class="pointer-events-none absolute inset-x-0 top-0 z-10 p-4">
        <div class="pointer-events-auto flex max-w-xl flex-wrap items-center gap-2">
          <div
            class="flex flex-1 items-center gap-2 rounded-xl bg-white/95 px-3.5 py-2.5 shadow-lg shadow-slate-900/5 backdrop-blur"
          >
            <span class="text-sm font-semibold tracking-tight text-slate-900">LandDemo</span>
            <span class="h-4 w-px bg-slate-200" />
            <input
              v-model="query"
              type="search"
              placeholder="Postcode or place — or click the map"
              class="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              @keyup.enter="runSearch"
            />
            <button
              class="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700 disabled:opacity-40"
              :disabled="searching || loading"
              @click="runSearch"
            >
              {{ searching ? '…' : 'Find' }}
            </button>
          </div>

          <button
            class="rounded-xl bg-white/95 px-3.5 py-2.5 text-xs font-medium text-slate-600 shadow-lg shadow-slate-900/5 backdrop-blur transition hover:text-slate-900"
            @click="shareLink"
          >
            {{ copied ? 'Link copied' : 'Share site' }}
          </button>
        </div>
      </div>

      <div class="pointer-events-none absolute bottom-4 left-4 z-10">
        <TracePanel />
      </div>
    </main>

    <div
      class="h-[52vh] w-full shrink-0 border-t border-slate-200 lg:h-full lg:w-[420px] lg:border-l lg:border-t-0"
    >
      <SitePanel />
    </div>
  </div>
</template>
