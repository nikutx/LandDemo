<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from 'vue'
import { CONSTRAINT_DATASETS } from '../lib/datasets'
import { TOOL_MANIFEST } from '../lib/agentTools'

export type InfoTab = 'about' | 'built'

const props = defineProps<{ tab: InfoTab | null }>()
const emit = defineEmits<{ close: []; select: [tab: InfoTab] }>()

const REPO = 'https://github.com/nikutx/LandDemo'

const stack = [
  { name: 'Vue 3', note: 'Composition API, <script setup> throughout' },
  { name: 'TypeScript', note: 'strict, typed all the way to the API edge' },
  { name: 'Vite', note: 'build and dev server' },
  { name: 'Pinia', note: 'one store, aborts superseded lookups' },
  { name: 'Tailwind CSS v4', note: 'no component library' },
  { name: 'MapLibre GL', note: 'vector map, GeoJSON overlays' },
  { name: 'Vitest', note: 'unit tests over the scoring engine' },
]

const steps = [
  {
    n: '01',
    title: 'Ask every layer at once',
    body: 'Sixteen designation datasets are checked against the point you clicked. They go in one request rather than sixteen, because a browser only opens about six connections to a host and sixteen parallel calls simply queue into three waves.',
  },
  {
    n: '02',
    title: 'Take only what the sentence needs',
    body: 'The default response carries each designation’s full boundary. The Cotswolds National Landscape boundary alone is about a megabyte of coordinates, and the words “this site is in a National Landscape” need none of it. Asking for the five fields the appraisal actually reads took one response from 1,062,090 bytes to 152.',
  },
  {
    n: '03',
    title: 'Say it in English, then draw it',
    body: 'The designations are scored, the binding constraint identified and the deciding authority named. Only then are the boundaries fetched to draw on the map, so reading the answer never waits on a megabyte of polygon.',
  },
]

function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

// The map sits behind the overlay and would otherwise scroll and zoom under it.
watch(
  () => props.tab,
  (tab) => {
    document.body.style.overflow = tab ? 'hidden' : ''
  },
)
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0"
    leave-active-class="transition duration-150 ease-in"
    leave-to-class="opacity-0"
  >
    <div
      v-if="tab"
      class="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      @click.self="emit('close')"
    >
      <Transition
        appear
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="translate-y-6 opacity-0 sm:scale-95"
      >
        <div
          class="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-slate-950 text-slate-300 shadow-2xl sm:rounded-2xl"
        >
          <header
            class="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 px-5 py-3.5"
          >
            <nav class="flex gap-1">
              <button
                v-for="option in (['about', 'built'] as const)"
                :key="option"
                class="rounded-lg px-3 py-1.5 text-sm font-medium transition"
                :class="
                  tab === option ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'
                "
                @click="emit('select', option)"
              >
                {{ option === 'about' ? 'About this project' : "How it's built" }}
              </button>
            </nav>
            <button
              class="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
              aria-label="Close"
              @click="emit('close')"
            >
              <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M5 5l10 10M15 5L5 15" stroke-linecap="round" />
              </svg>
            </button>
          </header>

          <div class="overflow-y-auto px-6 py-8 sm:px-10 sm:py-10">
            <template v-if="tab === 'about'">
              <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-400">
                What this is
              </p>
              <h2 class="mt-3 text-2xl font-semibold leading-snug text-white sm:text-3xl">
                The facts about a site are public. Reading them shouldn't take a planning degree.
              </h2>

              <div class="mt-6 space-y-5 text-[16px] leading-relaxed">
                <p>
                  Click any point in Great Britain and this tells you what it sits inside, which
                  designation actually binds, who would decide an application, and what to do next —
                  in a second, in plain English, with no account and nothing stored.
                </p>

                <h3 class="pt-3 text-lg font-medium text-white">The problem it solves</h3>
                <p>
                  All of this is already public. The trouble is that it arrives spread across
                  sixteen separate datasets, keyed by coordinates, and written for planners. Anyone
                  outside that world has to know which layers exist before they can ask about them,
                  so the practical answer to "is this site worth a second look?" costs a specialist's
                  afternoon rather than a click.
                </p>
                <p>
                  The gap is not data. It is the translation between the data and a decision, and
                  that translation is an interface problem.
                </p>

                <h3 class="pt-3 text-lg font-medium text-white">Where I think it could go</h3>
                <p>
                  A free, instant, shareable answer is a good front door. Someone checks one site,
                  gets something genuinely useful, and arrives at the paid product already
                  understanding what it does — which is a warmer start than a feature list.
                </p>
                <p>
                  The second face matters more. The same engine here is exposed as tools an AI
                  assistant can call, so the answer can be asked for in a sentence rather than
                  clicked for. Land data is exactly the kind of structured, geographic, constantly
                  updated information that agents are poor at guessing and good at looking up — and
                  whoever makes their data the easiest for an assistant to reach becomes the source
                  it reaches for.
                </p>

                <h3 class="pt-3 text-lg font-medium text-white">What it is not</h3>
                <p>
                  It is indicative, and deliberately modest. Local plan policy, allocations, access,
                  ownership and site history decide real outcomes and none of them are here. The
                  scoring weights are my own reading of how much each designation constrains
                  development, and they are meant to be argued with.
                </p>
                <p class="text-slate-400">
                  Every appraisal is also a link — the address bar follows the point you picked, so a
                  site can be pasted to a colleague and it opens on the same spot.
                </p>
              </div>
            </template>

            <template v-else>
              <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-400">
                How it works
              </p>
              <h2 class="mt-3 text-2xl font-semibold text-white sm:text-3xl">
                Twelve seconds down to one
              </h2>
              <p class="mt-4 text-[16px] leading-relaxed">
                The first version took over twelve seconds to answer. Two changes fixed it, and
                neither involved a faster machine.
              </p>

              <ol class="mt-8 space-y-7">
                <li v-for="step in steps" :key="step.n" class="flex gap-5">
                  <span class="font-mono text-sm text-sky-400/80">{{ step.n }}</span>
                  <div>
                    <h3 class="font-medium text-white">{{ step.title }}</h3>
                    <p class="mt-1.5 leading-relaxed">{{ step.body }}</p>
                  </div>
                </li>
              </ol>

              <div class="mt-9 grid gap-px overflow-hidden rounded-xl bg-white/10 sm:grid-cols-3">
                <div class="bg-slate-950 px-4 py-5">
                  <p class="font-mono text-xl text-white">1,062,090 → 152</p>
                  <p class="mt-1 text-xs text-slate-400">bytes per designation response</p>
                </div>
                <div class="bg-slate-950 px-4 py-5">
                  <p class="font-mono text-xl text-white">16 → 1</p>
                  <p class="mt-1 text-xs text-slate-400">requests per appraisal</p>
                </div>
                <div class="bg-slate-950 px-4 py-5">
                  <p class="font-mono text-xl text-white">12,423 → ~1,200</p>
                  <p class="mt-1 text-xs text-slate-400">milliseconds to an answer</p>
                </div>
              </div>

              <h3 class="mt-10 text-lg font-medium text-white">Built for a person and an agent</h3>
              <p class="mt-3 leading-relaxed">
                The panel on the map is one face of the engine. The other is the same logic
                described in JSON Schema, so an assistant can ask the same questions and get
                structured answers back. The domain logic never learned which one is calling it,
                which is what makes wrapping it in an MCP server an adapter rather than a rewrite.
              </p>
              <ul class="mt-5 space-y-2.5">
                <li
                  v-for="tool in TOOL_MANIFEST"
                  :key="tool.name"
                  class="rounded-lg border border-white/10 px-4 py-2.5"
                >
                  <p class="font-mono text-sm text-sky-300">{{ tool.name }}</p>
                  <p class="mt-1 text-sm leading-relaxed text-slate-400">{{ tool.description }}</p>
                </li>
              </ul>
              <p class="mt-4 text-sm text-slate-500">
                Open the <span class="text-slate-300">Agent tool calls</span> panel on the map to
                watch them run.
              </p>

              <h3 class="mt-10 text-lg font-medium text-white">The stack</h3>
              <dl class="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                <div v-for="item in stack" :key="item.name" class="border-t border-white/10 pt-3">
                  <dt class="text-sm font-medium text-white">{{ item.name }}</dt>
                  <dd class="mt-0.5 text-sm text-slate-400">{{ item.note }}</dd>
                </div>
              </dl>

              <h3 class="mt-10 text-lg font-medium text-white">Where the data comes from</h3>
              <p class="mt-3 leading-relaxed">
                <a
                  class="text-sky-400 underline-offset-4 hover:underline"
                  href="https://www.planning.data.gov.uk"
                  target="_blank"
                  rel="noopener"
                  >planning.data.gov.uk</a
                >
                for the {{ CONSTRAINT_DATASETS.length }} designation datasets, and
                <a
                  class="text-sky-400 underline-offset-4 hover:underline"
                  href="https://postcodes.io"
                  target="_blank"
                  rel="noopener"
                  >postcodes.io</a
                >
                to work out which authority would decide an application. Both public, both free, no
                key required. There is no back end: the browser talks straight to them, which is why
                the whole thing is a static file anyone can host or audit.
              </p>
            </template>
          </div>

          <footer
            class="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-3.5 text-sm"
          >
            <span class="text-slate-500">Petras Newman-Predko</span>
            <a
              :href="REPO"
              target="_blank"
              rel="noopener"
              class="inline-flex items-center gap-2 rounded-lg bg-white px-3.5 py-2 font-medium text-slate-900 transition hover:bg-slate-200"
            >
              <svg viewBox="0 0 16 16" class="h-4 w-4" fill="currentColor" aria-hidden="true">
                <path
                  d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
                />
              </svg>
              Read the code
            </a>
          </footer>
        </div>
      </Transition>
    </div>
  </Transition>
</template>
