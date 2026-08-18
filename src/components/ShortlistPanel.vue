<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useShortlistStore } from '../stores/shortlist'
import { useSiteStore } from '../stores/site'
import { verdictFor } from '../lib/appraisal'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const shortlist = useShortlistStore()
const site = useSiteStore()
const { ranked } = storeToRefs(shortlist)

const copied = ref(false)

const VERDICT_COLOR: Record<string, string> = {
  clear: '#10b981',
  light: '#84cc16',
  moderate: '#f59e0b',
  significant: '#f97316',
  severe: '#e11d48',
}

function colorFor(score: number) {
  return VERDICT_COLOR[verdictFor(score).verdict]
}

async function copyAll() {
  await navigator.clipboard.writeText(shortlist.asText())
  copied.value = true
  setTimeout(() => (copied.value = false), 1800)
}

// Deliberately not called `open`: a binding of that name would shadow the
// `open` prop inside the template, and a function is always truthy.
function revisit(id: string) {
  const found = ranked.value.find((entry) => entry.id === id)
  if (found) site.select(found.point)
}
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="translate-x-full"
    leave-active-class="transition duration-150 ease-in"
    leave-to-class="translate-x-full"
  >
    <aside
      v-if="open"
      class="absolute inset-y-0 right-0 z-30 flex w-[min(28rem,100%)] flex-col border-l border-slate-200 bg-white shadow-2xl"
    >
      <header class="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div>
          <h2 class="text-lg font-semibold text-slate-900">Shortlist</h2>
          <p class="mt-0.5 text-sm text-slate-500">
            {{ ranked.length ? 'Least constrained first' : 'Nothing saved yet' }}
          </p>
        </div>
        <button
          class="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
          aria-label="Close shortlist"
          @click="emit('close')"
        >
          <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <path d="M5 5l10 10M15 5L5 15" stroke-linecap="round" />
          </svg>
        </button>
      </header>

      <div v-if="!ranked.length" class="flex flex-1 items-center px-8 text-center">
        <p class="text-sm leading-relaxed text-slate-500">
          Click sites on the map and save the ones worth considering. They are ranked here from
          easiest to hardest, so a shortlist becomes an order to work through.
        </p>
      </div>

      <ol v-else class="flex-1 divide-y divide-slate-100 overflow-y-auto">
        <li v-for="(entry, index) in ranked" :key="entry.id" class="px-5 py-4">
          <div class="flex items-start gap-3">
            <span
              class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600"
            >
              {{ index + 1 }}
            </span>

            <div class="min-w-0 flex-1">
              <button
                class="block max-w-full truncate text-left text-sm font-medium text-slate-900 hover:text-sky-700 hover:underline"
                @click="revisit(entry.id)"
              >
                {{ entry.place }}
              </button>

              <div class="mt-1.5 flex items-center gap-2">
                <div class="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                  <div
                    class="h-full rounded-full"
                    :style="{ width: Math.max(entry.score, 3) + '%', background: colorFor(entry.score) }"
                  />
                </div>
                <span class="font-mono text-xs text-slate-500">{{ entry.score }}/100</span>
                <span class="text-xs" :style="{ color: colorFor(entry.score) }">
                  {{ entry.headline }}
                </span>
              </div>

              <p class="mt-1.5 text-xs leading-relaxed text-slate-500">
                {{ entry.designations.length ? entry.designations.join(' · ') : 'Nothing mapped against it' }}
              </p>
              <p v-if="entry.nextStep" class="mt-1 text-xs leading-relaxed text-slate-400">
                Next: {{ entry.nextStep }}
              </p>
            </div>

            <button
              class="rounded-lg p-1.5 text-slate-300 transition hover:bg-rose-50 hover:text-rose-600"
              :aria-label="`Remove ${entry.place} from shortlist`"
              @click="shortlist.remove(entry.id)"
            >
              <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
                <path d="M4 6h12M8 6V4h4v2M6 6l1 10h6l1-10" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>
        </li>
      </ol>

      <footer v-if="ranked.length" class="shrink-0 space-y-2 border-t border-slate-200 px-5 py-4">
        <button
          class="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
          @click="copyAll"
        >
          {{ copied ? 'Shortlist copied' : 'Copy shortlist' }}
        </button>
        <button
          class="w-full rounded-lg px-4 py-2 text-xs text-slate-400 transition hover:text-rose-600"
          @click="shortlist.clear()"
        >
          Clear all
        </button>
      </footer>
    </aside>
  </Transition>
</template>
