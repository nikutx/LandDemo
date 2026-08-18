<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from 'vue'
import { CONSTRAINT_DATASETS } from '../lib/datasets'
import { TOOL_MANIFEST } from '../lib/agentTools'

export type InfoTab = 'about' | 'built'

const props = defineProps<{ tab: InfoTab | null }>()
const emit = defineEmits<{ close: []; select: [tab: InfoTab] }>()

const REPO = 'https://github.com/nikutx/LandDemo'

/** Small inline icon set — no icon dependency for six glyphs. */
const ICONS = {
  scatter: 'M4 6h5M4 12h9M4 18h6M17 5l3 3-3 3M20 8h-6',
  jargon: 'M4 7h16M4 12h10M4 17h7M15 15l5 5M20 15l-5 5',
  clock: 'M12 7v5l3 2M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Z',
  click: 'M9 4v6M4 9h6M14.5 12.5 21 15l-3 1.5L16.5 20l-2-7.5Z',
  speech: 'M4 5h16v10H9l-5 4V5Z',
  link: 'M10 13a4 4 0 0 0 5.66 0l3-3A4 4 0 0 0 13 4.34l-1.5 1.5M14 11a4 4 0 0 0-5.66 0l-3 3A4 4 0 0 0 11 19.66l1.5-1.5',
}

const problems = [
  {
    icon: ICONS.scatter,
    title: 'Spread across sixteen datasets',
    body: 'You have to know a layer exists before you can ask about it.',
  },
  {
    icon: ICONS.jargon,
    title: 'Written for planners',
    body: 'The words assume you already know what they mean for a scheme.',
  },
  {
    icon: ICONS.clock,
    title: 'Costs an afternoon',
    body: '“Is this site worth a second look?” shouldn’t need a specialist.',
  },
]

const answers = [
  {
    icon: ICONS.click,
    title: 'One click, one second',
    body: 'Sixteen national layers checked against the point you picked.',
  },
  {
    icon: ICONS.speech,
    title: 'An answer, not a legend',
    body: 'The binding constraint, who decides, and what to do next.',
  },
  {
    icon: ICONS.link,
    title: 'Every site is a link',
    body: 'Paste it to a colleague and it opens on the same spot.',
  },
]

const stats = [
  { value: '1,652', label: 'lines of code' },
  { value: '~2 hrs', label: 'empty folder to live' },
  { value: '12', label: 'unit tests, green' },
  { value: '16', label: 'datasets queried' },
]

const pipeline = [
  { step: 'Click', detail: 'a point on the map', tone: 'slate' },
  { step: 'locate_place', detail: 'which authority decides', tone: 'sky' },
  { step: 'find_constraints', detail: '16 datasets, one request', tone: 'sky' },
  { step: 'appraise_site', detail: 'score + plain English', tone: 'emerald' },
  { step: 'Boundaries', detail: 'drawn after the answer', tone: 'slate' },
]

const perf = [
  { label: 'Bytes per response', from: '1,062,090', to: '152', pct: 0.02 },
  { label: 'Requests per appraisal', from: '16', to: '1', pct: 6 },
  { label: 'Time to an answer', from: '12,423ms', to: '~1,200ms', pct: 10 },
]

const stack = [
  { name: 'Vue 3', role: 'Composition API, five components' },
  { name: 'TypeScript', role: 'typed to the API edge' },
  { name: 'Pinia', role: 'one store, cancels stale lookups' },
  { name: 'Tailwind v4', role: 'no component library' },
  { name: 'MapLibre GL', role: 'vector map + GeoJSON overlays' },
  { name: 'Vite', role: 'build, dev server, CI deploy' },
  { name: 'Vitest', role: 'scoring engine under test' },
]

function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
})

// The map sits behind the dialog and would otherwise scroll under it.
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
      class="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 backdrop-blur-sm sm:items-center sm:p-6"
      @click.self="emit('close')"
    >
      <div
        class="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl bg-slate-950 text-slate-300 shadow-2xl ring-1 ring-white/10 sm:rounded-2xl"
      >
        <header
          class="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 px-4 py-3 sm:px-6"
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
            <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" stroke-linecap="round" />
            </svg>
          </button>
        </header>

        <div class="overflow-y-auto px-5 py-8 sm:px-10 sm:py-10">
          <!-- ABOUT -->
          <template v-if="tab === 'about'">
            <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-400">
              What this is
            </p>
            <h2 class="mt-3 max-w-2xl text-2xl font-semibold leading-snug text-white sm:text-[32px]">
              The facts about a site are public. Reading them shouldn't take a planning degree.
            </h2>
            <p class="mt-4 max-w-2xl text-[16px] leading-relaxed text-slate-400">
              Click any point in Great Britain. In about a second you get what it sits inside, which
              designation actually binds, who would decide an application, and what to do next.
            </p>

            <h3 class="mt-10 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Why it's hard today
            </h3>
            <div class="mt-4 grid gap-3 sm:grid-cols-3">
              <div
                v-for="item in problems"
                :key="item.title"
                class="rounded-xl border border-white/10 bg-white/[0.03] p-4"
              >
                <svg
                  viewBox="0 0 24 24"
                  class="h-5 w-5 text-rose-400/90"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path :d="item.icon" />
                </svg>
                <p class="mt-3 font-medium text-white">{{ item.title }}</p>
                <p class="mt-1 text-sm leading-relaxed text-slate-400">{{ item.body }}</p>
              </div>
            </div>

            <h3 class="mt-9 text-sm font-semibold uppercase tracking-wide text-slate-500">
              What this does instead
            </h3>
            <div class="mt-4 grid gap-3 sm:grid-cols-3">
              <div
                v-for="item in answers"
                :key="item.title"
                class="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4"
              >
                <svg
                  viewBox="0 0 24 24"
                  class="h-5 w-5 text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path :d="item.icon" />
                </svg>
                <p class="mt-3 font-medium text-white">{{ item.title }}</p>
                <p class="mt-1 text-sm leading-relaxed text-slate-400">{{ item.body }}</p>
              </div>
            </div>

            <h3 class="mt-10 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Where I think it could go
            </h3>
            <div class="mt-4 grid gap-3 sm:grid-cols-2">
              <div class="rounded-xl border border-white/10 p-5">
                <p class="font-medium text-white">A free front door</p>
                <p class="mt-2 text-sm leading-relaxed text-slate-400">
                  Someone checks one site, gets something genuinely useful, and shares the link.
                  They arrive at a paid product already understanding what it does — a warmer start
                  than a feature list, and every shared link is a site someone cared about.
                </p>
              </div>
              <div class="rounded-xl border border-sky-400/30 bg-sky-400/[0.06] p-5">
                <p class="flex items-center gap-2 font-medium text-white">
                  Land data an assistant can call
                  <span
                    class="rounded-full bg-sky-400/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-300"
                    >the interesting one</span
                  >
                </p>
                <p class="mt-2 text-sm leading-relaxed text-slate-400">
                  The same engine here is also exposed as tools an AI agent can call, with every
                  answer traceable to the dataset it came from. Land data is exactly what assistants
                  guess badly and look up well — and whoever is easiest to reach becomes the source
                  they reach for.
                </p>
              </div>
            </div>

            <p class="mt-8 border-t border-white/10 pt-5 text-sm leading-relaxed text-slate-500">
              Indicative only, and deliberately modest: local plan policy, allocations, access,
              ownership and site history decide real outcomes and none of them are here. The scoring
              weights are my own reading of how much each designation constrains development — they
              are meant to be argued with.
            </p>
          </template>

          <!-- HOW IT'S BUILT -->
          <template v-else>
            <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-400">
              How it's built
            </p>
            <h2 class="mt-3 text-2xl font-semibold text-white sm:text-[32px]">
              Small, typed, tested, fast
            </h2>

            <div class="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-white/10 sm:grid-cols-4">
              <div v-for="stat in stats" :key="stat.label" class="bg-slate-950 px-4 py-5">
                <p class="font-mono text-2xl text-white">{{ stat.value }}</p>
                <p class="mt-1 text-xs text-slate-400">{{ stat.label }}</p>
              </div>
            </div>

            <h3 class="mt-10 text-sm font-semibold uppercase tracking-wide text-slate-500">
              What happens when you click
            </h3>
            <ol class="mt-4 space-y-2">
              <li
                v-for="(node, index) in pipeline"
                :key="node.step"
                class="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3"
              >
                <span class="font-mono text-xs text-slate-600">{{ index + 1 }}</span>
                <span
                  class="font-mono text-sm"
                  :class="{
                    'text-sky-300': node.tone === 'sky',
                    'text-emerald-300': node.tone === 'emerald',
                    'text-slate-200': node.tone === 'slate',
                  }"
                  >{{ node.step }}</span
                >
                <span class="ml-auto text-right text-sm text-slate-400">{{ node.detail }}</span>
              </li>
            </ol>
            <p class="mt-3 text-sm text-slate-500">
              Steps 2 and 3 run together, and step 5 runs after you can already read the answer.
            </p>

            <h3 class="mt-10 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Two decisions took it from twelve seconds to one
            </h3>
            <div class="mt-4 space-y-4">
              <div v-for="row in perf" :key="row.label">
                <div class="flex items-baseline justify-between text-sm">
                  <span class="text-slate-300">{{ row.label }}</span>
                  <span class="font-mono text-xs">
                    <span class="text-slate-500 line-through">{{ row.from }}</span>
                    <span class="mx-2 text-slate-600">→</span>
                    <span class="text-emerald-300">{{ row.to }}</span>
                  </span>
                </div>
                <div class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    class="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-400"
                    :style="{ width: Math.max(row.pct, 1.5) + '%' }"
                  />
                </div>
              </div>
            </div>
            <p class="mt-4 text-sm leading-relaxed text-slate-400">
              Ask for the five fields the sentence needs instead of whole records — the Cotswolds
              boundary alone is a megabyte of coordinates. Then send all sixteen datasets in one
              request, because a browser opens about six connections per host and sixteen parallel
              calls just queue into three waves.
            </p>

            <h3 class="mt-10 text-sm font-semibold uppercase tracking-wide text-slate-500">
              The same engine, twice
            </h3>
            <p class="mt-3 text-sm leading-relaxed text-slate-400">
              The panel on the map is one caller. These tools are the other, described in JSON
              Schema so an assistant can ask the same questions. The domain logic never learned
              which one is calling, so putting an MCP server in front of it is an adapter, not a
              rewrite.
            </p>
            <div class="mt-4 grid gap-2 sm:grid-cols-2">
              <div
                v-for="tool in TOOL_MANIFEST"
                :key="tool.name"
                class="rounded-lg border border-white/10 px-4 py-3"
              >
                <p class="font-mono text-sm text-sky-300">{{ tool.name }}</p>
                <p class="mt-1 text-xs leading-relaxed text-slate-400">{{ tool.description }}</p>
              </div>
            </div>

            <h3 class="mt-10 text-sm font-semibold uppercase tracking-wide text-slate-500">
              The stack
            </h3>
            <div class="mt-4 flex flex-wrap gap-2">
              <span
                v-for="item in stack"
                :key="item.name"
                class="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm"
              >
                <span class="font-medium text-white">{{ item.name }}</span>
                <span class="ml-2 text-xs text-slate-400">{{ item.role }}</span>
              </span>
            </div>
            <p class="mt-4 text-sm leading-relaxed text-slate-400">
              Data from
              <a
                class="text-sky-400 underline-offset-4 hover:underline"
                href="https://www.planning.data.gov.uk"
                target="_blank"
                rel="noopener"
                >planning.data.gov.uk</a
              >
              ({{ CONSTRAINT_DATASETS.length }} designation datasets) and
              <a
                class="text-sky-400 underline-offset-4 hover:underline"
                href="https://postcodes.io"
                target="_blank"
                rel="noopener"
                >postcodes.io</a
              >. No back end and no key: the browser talks straight to them, so the whole thing is a
              static file anyone can host, fork or audit.
            </p>

            <div class="mt-10 rounded-xl border border-sky-400/25 bg-sky-400/[0.06] p-5">
              <h3 class="font-medium text-white">How it was actually written</h3>
              <p class="mt-2 text-sm leading-relaxed text-slate-300">
                With AI agents, not typed by hand — from empty folder to deployed in about two
                hours. I set the direction, review every diff and verify the result in a browser
                before it counts as done.
              </p>
              <p class="mt-3 text-sm leading-relaxed text-slate-400">
                That last part is the job. The three real bugs here were all silent ones a passing
                build would have hidden: a bundler that never emitted MapLibre's tile worker, a
                readiness check that quietly dropped every boundary update, and a megabyte of
                geometry being downloaded to write one sentence. Agents write quickly; someone still
                has to notice the map is empty.
              </p>
            </div>
          </template>
        </div>

        <footer
          class="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-3 text-sm sm:px-6"
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
    </div>
  </Transition>
</template>
