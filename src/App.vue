<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import MapCanvas from './components/MapCanvas.vue'
import SitePanel from './components/SitePanel.vue'
import TracePanel from './components/TracePanel.vue'
import InfoOverlay, { type InfoTab } from './components/InfoOverlay.vue'
import { DEFAULT_POINT, useSiteStore } from './stores/site'
import { EXAMPLE_SITES } from './lib/examples'

const store = useSiteStore()
const { point, loading } = storeToRefs(store)

const REPO = 'https://github.com/nikutx/LandDemo'

const query = ref('')
const searching = ref(false)
const infoTab = ref<InfoTab | null>(null)

async function runSearch() {
  if (!query.value.trim() || searching.value) return
  searching.value = true
  await store.search(query.value)
  searching.value = false
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
  <div class="flex h-screen flex-col overflow-hidden bg-slate-100 lg:flex-row">
    <main class="relative min-h-0 flex-1">
      <MapCanvas />

      <div class="pointer-events-none absolute inset-x-0 top-0 z-10 p-4">
        <div class="pointer-events-auto flex max-w-3xl flex-wrap items-center gap-2">
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

          <nav
            class="flex items-center gap-1 rounded-xl bg-white/95 px-1.5 py-1.5 text-xs font-medium text-slate-500 shadow-lg shadow-slate-900/5 backdrop-blur"
          >
            <button
              class="rounded-lg px-2.5 py-1.5 transition hover:bg-slate-100 hover:text-slate-900"
              @click="infoTab = 'about'"
            >
              About
            </button>
            <button
              class="rounded-lg px-2.5 py-1.5 transition hover:bg-slate-100 hover:text-slate-900"
              @click="infoTab = 'built'"
            >
              How it's built
            </button>
            <a
              class="flex items-center gap-1.5 rounded-lg bg-slate-900 px-2.5 py-1.5 text-white transition hover:bg-slate-700"
              :href="REPO"
              target="_blank"
              rel="noopener"
            >
              <svg viewBox="0 0 16 16" class="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
                <path
                  d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
                />
              </svg>
              Code
            </a>
          </nav>
        </div>

        <div class="pointer-events-auto mt-2 flex max-w-3xl flex-wrap items-center gap-1.5">
          <span
            class="rounded-lg bg-white/90 px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400 shadow backdrop-blur"
          >
            Try
          </span>
          <button
            v-for="example in EXAMPLE_SITES"
            :key="example.label"
            class="rounded-lg bg-white/90 px-2.5 py-1.5 text-xs text-slate-600 shadow backdrop-blur transition hover:bg-white hover:text-slate-900"
            :title="example.hint"
            @click="store.select(example.point)"
          >
            {{ example.label }}
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

    <InfoOverlay :tab="infoTab" @close="infoTab = null" @select="infoTab = $event" />
  </div>
</template>
