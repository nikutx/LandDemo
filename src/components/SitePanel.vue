<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useSiteStore } from '../stores/site'
import { CONSTRAINT_DATASETS } from '../lib/datasets'
import { describeLocation, verdictFor, type Verdict } from '../lib/appraisal'
import { useShortlistStore } from '../stores/shortlist'

const datasetCount = CONSTRAINT_DATASETS.length

const store = useSiteStore()
const { lookup, appraisal, loading, error, point, candidates, scanning, scanProgress, scanRadius, scanned } =
  storeToRefs(store)

const RADIUS_OPTIONS = [
  { value: 1000, label: '1 km' },
  { value: 2000, label: '2 km' },
  { value: 5000, label: '5 km' },
]

function formatDistance(metres: number) {
  return metres >= 1000 ? `${(metres / 1000).toFixed(metres % 1000 ? 1 : 0)} km` : `${metres} m`
}

const VERDICT_COLOR: Record<Verdict, string> = {
  clear: '#10b981',
  light: '#84cc16',
  moderate: '#f59e0b',
  significant: '#f97316',
  severe: '#e11d48',
}

const ringColor = computed(() =>
  appraisal.value ? VERDICT_COLOR[appraisal.value.verdict] : '#94a3b8',
)

function scoreColor(score: number) {
  return VERDICT_COLOR[verdictFor(score).verdict]
}

/** Circumference of the r=34 score ring, for the stroke-dash animation. */
const RING_LENGTH = 2 * Math.PI * 34
const ringOffset = computed(() =>
  appraisal.value ? RING_LENGTH * (1 - appraisal.value.score / 100) : RING_LENGTH,
)

const place = computed(() => {
  const context = lookup.value?.context
  if (!context) return null
  return describeLocation(context) || context.region
})

const coordinates = computed(() =>
  point.value ? `${point.value.lat.toFixed(5)}, ${point.value.lng.toFixed(5)}` : '',
)

const shortlist = useShortlistStore()

const isSaved = computed(() => (point.value ? shortlist.has(point.value) : false))

function toggleShortlist() {
  if (!point.value || !appraisal.value) return
  shortlist.toggle({
    point: point.value,
    place: place.value || 'Unnamed site',
    score: appraisal.value.score,
    headline: appraisal.value.headline,
    designations: appraisal.value.drivers.map((c) => c.dataset.label),
    nextStep: appraisal.value.nextSteps[0] ?? null,
  })
}

const copied = ref(false)

async function copyLink() {
  await navigator.clipboard.writeText(window.location.href)
  copied.value = true
  setTimeout(() => (copied.value = false), 1800)
}
</script>

<template>
  <aside class="flex h-full w-full flex-col overflow-y-auto bg-white">
    <header class="border-b border-slate-200 px-6 py-5">
      <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        Site snapshot
      </p>
      <h2 class="mt-1 text-lg font-semibold text-slate-900">
        {{ place || 'Click anywhere in Great Britain' }}
      </h2>
      <p v-if="coordinates" class="mt-0.5 font-mono text-xs text-slate-400">{{ coordinates }}</p>
    </header>

    <div v-if="error" class="m-6 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
      {{ error }}
    </div>

    <div v-if="loading" class="space-y-3 p-6">
      <div class="h-24 animate-pulse rounded-xl bg-slate-100" />
      <div class="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
      <div class="h-4 w-full animate-pulse rounded bg-slate-100" />
      <div class="h-4 w-5/6 animate-pulse rounded bg-slate-100" />
    </div>

    <template v-else-if="appraisal">
      <section class="flex items-center gap-5 px-6 py-6">
        <svg viewBox="0 0 80 80" class="h-20 w-20 shrink-0 -rotate-90" aria-hidden="true">
          <circle cx="40" cy="40" r="34" fill="none" stroke="#e2e8f0" stroke-width="8" />
          <circle
            cx="40"
            cy="40"
            r="34"
            fill="none"
            :stroke="ringColor"
            stroke-width="8"
            stroke-linecap="round"
            :stroke-dasharray="RING_LENGTH"
            :stroke-dashoffset="ringOffset"
            class="transition-[stroke-dashoffset] duration-700 ease-out"
          />
        </svg>
        <div>
          <p class="text-3xl font-semibold text-slate-900">
            {{ appraisal.score }}<span class="text-base text-slate-400">/100</span>
          </p>
          <p class="text-sm font-medium" :style="{ color: ringColor }">{{ appraisal.headline }}</p>
          <p class="mt-0.5 text-xs text-slate-400">Planning difficulty</p>
        </div>
      </section>

      <section class="px-6 pb-6">
        <p class="text-[15px] leading-relaxed text-slate-700">{{ appraisal.summary }}</p>
      </section>

      <section v-if="appraisal.drivers.length" class="border-t border-slate-200 px-6 py-5">
        <h3 class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          Designations found
        </h3>
        <ul class="mt-3 space-y-3">
          <li v-for="c in appraisal.drivers" :key="c.dataset.id + c.reference" class="flex gap-3">
            <span
              class="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
              :style="{ background: c.dataset.color }"
            />
            <div class="min-w-0">
              <p class="text-sm font-medium text-slate-900">{{ c.dataset.label }}</p>
              <a
                v-if="c.entity"
                class="group inline-flex max-w-full items-center gap-1 text-sm text-slate-500 transition hover:text-sky-700"
                :href="`https://www.planning.data.gov.uk/entity/${c.entity}`"
                target="_blank"
                rel="noopener"
                :title="`Open ${c.name} on planning.data.gov.uk`"
              >
                <span class="truncate group-hover:underline">{{ c.name }}</span>
                <svg
                  viewBox="0 0 24 24"
                  class="h-3 w-3 shrink-0 opacity-50"
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                >
                  <path d="M14 5h5v5M19 5l-7 7M18 13v6H5V6h6" />
                </svg>
              </a>
              <p v-else class="truncate text-sm text-slate-500">{{ c.name }}</p>
              <p class="mt-0.5 text-xs leading-relaxed text-slate-400">{{ c.dataset.hint }}</p>
            </div>
          </li>
        </ul>
      </section>

      <section v-if="appraisal.opportunities.length" class="border-t border-slate-200 px-6 py-5">
        <h3 class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          In your favour
        </h3>
        <ul class="mt-3 space-y-2">
          <li
            v-for="c in appraisal.opportunities"
            :key="c.dataset.id"
            class="text-sm text-emerald-700"
          >
            {{ c.dataset.label }} — {{ c.dataset.hint }}
          </li>
        </ul>
      </section>

      <section v-if="appraisal.nextSteps.length" class="border-t border-slate-200 px-6 py-5">
        <h3 class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          What to do next
        </h3>
        <ol class="mt-3 space-y-2.5">
          <li
            v-for="(step, index) in appraisal.nextSteps"
            :key="step"
            class="flex gap-3 text-sm text-slate-700"
          >
            <span
              class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-500"
            >
              {{ index + 1 }}
            </span>
            {{ step }}
          </li>
        </ol>
      </section>

      <section v-if="appraisal.score > 0" class="border-t border-slate-200 px-6 py-5">
        <h3 class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          Somewhere easier nearby?
        </h3>

        <div class="mt-3 flex gap-1.5">
          <button
            v-for="option in RADIUS_OPTIONS"
            :key="option.value"
            class="flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition"
            :class="
              scanRadius === option.value
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 text-slate-600 hover:border-slate-400'
            "
            :disabled="scanning"
            @click="scanRadius = option.value"
          >
            {{ option.label }}
          </button>
        </div>

        <button
          class="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-60"
          :disabled="scanning"
          @click="store.findEasierNearby()"
        >
          {{ scanning ? `Looking around… ${scanProgress}%` : 'Search the surrounding land' }}
        </button>

        <div v-if="scanning" class="mt-2 h-1 overflow-hidden rounded-full bg-slate-100">
          <div
            class="h-full rounded-full bg-slate-900 transition-[width] duration-300"
            :style="{ width: scanProgress + '%' }"
          />
        </div>

        <ul v-if="candidates.length" class="mt-4 space-y-2">
          <li v-for="candidate in candidates.slice(0, 5)" :key="candidate.bearing + candidate.distance">
            <button
              class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-left transition hover:border-slate-400 hover:bg-slate-50"
              @click="store.select(candidate.point)"
            >
              <div class="flex items-baseline justify-between gap-2">
                <span class="text-sm font-medium text-slate-900">
                  {{ formatDistance(candidate.distance) }} {{ candidate.bearing }}
                </span>
                <span class="font-mono text-xs" :style="{ color: scoreColor(candidate.score) }">
                  {{ candidate.score }}/100
                </span>
              </div>
              <p class="mt-0.5 text-xs leading-relaxed text-slate-500">
                {{
                  candidate.designations.length
                    ? candidate.designations.join(', ')
                    : 'Nothing mapped against it'
                }}
              </p>
            </button>
          </li>
        </ul>

        <p v-else-if="scanned && !scanning" class="mt-3 text-xs leading-relaxed text-slate-500">
          Nothing within {{ formatDistance(scanRadius) }} came back easier than this site. Try a
          wider search, or take the constraints here as the ones to work with.
        </p>
        <p v-else-if="!scanning" class="mt-2 text-xs leading-relaxed text-slate-400">
          Samples twelve points around this one and reports any that are less constrained.
        </p>
      </section>

      <section class="border-t border-slate-200 px-6 py-5">
        <button
          class="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition"
          :class="
            isSaved
              ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100'
              : 'bg-slate-900 text-white hover:bg-slate-700'
          "
          @click="toggleShortlist"
        >
          <svg
            viewBox="0 0 24 24"
            class="h-4 w-4"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path v-if="isSaved" d="M5 12.5 10 17l9-10" />
            <path v-else d="M12 5v14M5 12h14" />
          </svg>
          {{ isSaved ? 'On your shortlist' : 'Add to shortlist' }}
        </button>
        <p class="mt-2 text-center text-xs leading-relaxed text-slate-400">
          Save the sites worth considering and compare them, easiest first.
          <button class="underline underline-offset-2 transition hover:text-slate-600" @click="copyLink">
            {{ copied ? 'Link copied' : 'Or copy a link to this one' }}
          </button>
        </p>
      </section>

      <footer class="mt-auto border-t border-slate-200 px-6 py-4 text-xs text-slate-400">
        {{ datasetCount }} designation datasets checked against government open data in
        <span class="font-mono text-slate-600">{{ lookup?.totalMs }}ms</span>. Indicative only —
        always verify against the local planning authority.
      </footer>
    </template>
  </aside>
</template>
