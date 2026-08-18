<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSiteStore } from '../stores/site'
import { CONSTRAINT_DATASETS } from '../lib/datasets'
import type { Verdict } from '../lib/appraisal'

const datasetCount = CONSTRAINT_DATASETS.length

const store = useSiteStore()
const { lookup, appraisal, loading, error, point } = storeToRefs(store)

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

/** Circumference of the r=34 score ring, for the stroke-dash animation. */
const RING_LENGTH = 2 * Math.PI * 34
const ringOffset = computed(() =>
  appraisal.value ? RING_LENGTH * (1 - appraisal.value.score / 100) : RING_LENGTH,
)

const place = computed(() => {
  const context = lookup.value?.context
  if (!context) return null
  return [context.parish, context.district].filter(Boolean).join(', ') || context.region
})

const coordinates = computed(() =>
  point.value ? `${point.value.lat.toFixed(5)}, ${point.value.lng.toFixed(5)}` : '',
)
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
        <svg viewBox="0 0 80 80" class="h-20 w-20 shrink-0 -rotate-90">
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
              <p class="truncate text-sm text-slate-500">{{ c.name }}</p>
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

      <footer class="mt-auto border-t border-slate-200 px-6 py-4 text-xs text-slate-400">
        {{ datasetCount }} designation datasets checked against government open data in
        <span class="font-mono text-slate-600">{{ lookup?.totalMs }}ms</span>. Indicative only —
        always verify against the local planning authority.
      </footer>
    </template>
  </aside>
</template>
