<script setup lang="ts">
import { CONSTRAINT_DATASETS } from '../lib/datasets'
import { TOOL_MANIFEST } from '../lib/agentTools'

const REPO = 'https://github.com/nikutx/LandDemo'

const stack = [
  { name: 'Vue 3', note: 'Composition API, <script setup> throughout' },
  { name: 'TypeScript', note: 'strict, no any in the data layer' },
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
    body: 'Sixteen designation datasets are checked against the point you clicked. They go in a single request rather than sixteen, because a browser only opens about six connections to one host and sixteen parallel calls just queue into three waves.',
  },
  {
    n: '02',
    title: 'Take only what the sentence needs',
    body: 'The default response carries each designation’s boundary. The Cotswolds National Landscape boundary alone is about a megabyte of coordinates, and the words “this site is in a National Landscape” need none of it. Requesting the five fields the appraisal actually reads took one response from 1,062,090 bytes to 152.',
  },
  {
    n: '03',
    title: 'Say it in English, then draw it',
    body: 'The designations are scored, the binding constraint identified and the deciding authority named, all in language someone outside planning can act on. Only then are the boundaries fetched to draw on the map, so the reading never waits on the drawing.',
  },
]
</script>

<template>
  <div class="bg-slate-950 text-slate-300">
    <section class="mx-auto max-w-3xl px-6 py-24 sm:py-32">
      <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-400">Why I built it</p>
      <h2 class="mt-4 text-3xl font-semibold leading-tight text-white sm:text-4xl">
        The facts about a site are public. Reading them shouldn't take a planning degree.
      </h2>
      <div class="mt-8 space-y-5 text-[17px] leading-relaxed">
        <p>
          Everything above comes from government open data that anyone can query today. The trouble
          is that it arrives spread across sixteen datasets, in language written for planners rather
          than for the person deciding whether a site is worth a second look.
        </p>
        <p>
          So I built the thing I wanted: click a point, and get the honest answer in a sentence —
          what it sits inside, which designation actually binds, who decides an application, and
          what to do next. No account, no key, nothing stored.
        </p>
        <p>
          It is deliberately built the way the job is advertised: Vue 3, TypeScript, a map, and real
          data behind it. I would rather show you a working thing than describe one.
        </p>
      </div>
    </section>

    <section class="border-t border-white/10">
      <div class="mx-auto max-w-3xl px-6 py-20">
        <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-400">How it works</p>
        <h2 class="mt-4 text-2xl font-semibold text-white sm:text-3xl">
          Twelve seconds down to one
        </h2>
        <p class="mt-4 text-[17px] leading-relaxed">
          The first version took over twelve seconds to answer. Two changes fixed it, and neither
          involved a faster machine.
        </p>

        <ol class="mt-10 space-y-8">
          <li v-for="step in steps" :key="step.n" class="flex gap-5">
            <span class="font-mono text-sm text-sky-400/80">{{ step.n }}</span>
            <div>
              <h3 class="text-lg font-medium text-white">{{ step.title }}</h3>
              <p class="mt-2 leading-relaxed">{{ step.body }}</p>
            </div>
          </li>
        </ol>

        <div class="mt-12 grid gap-px overflow-hidden rounded-xl bg-white/10 sm:grid-cols-3">
          <div class="bg-slate-950 px-5 py-6">
            <p class="font-mono text-2xl text-white">1,062,090 → 152</p>
            <p class="mt-1 text-sm text-slate-400">bytes per designation response</p>
          </div>
          <div class="bg-slate-950 px-5 py-6">
            <p class="font-mono text-2xl text-white">16 → 1</p>
            <p class="mt-1 text-sm text-slate-400">requests per appraisal</p>
          </div>
          <div class="bg-slate-950 px-5 py-6">
            <p class="font-mono text-2xl text-white">12,423 → ~1,200</p>
            <p class="mt-1 text-sm text-slate-400">milliseconds to an answer</p>
          </div>
        </div>
      </div>
    </section>

    <section class="border-t border-white/10">
      <div class="mx-auto max-w-3xl px-6 py-20">
        <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-400">
          The same engine, twice
        </p>
        <h2 class="mt-4 text-2xl font-semibold text-white sm:text-3xl">
          Built for a person and for an agent
        </h2>
        <p class="mt-4 text-[17px] leading-relaxed">
          The panel you scrolled past is one face of the engine. The other is a set of tools
          described in JSON Schema, so an assistant can ask the same questions and get structured
          answers rather than a screenshot. The domain logic never learned which one is calling it,
          which is what keeps it honest — and makes wrapping it in an MCP server an adapter rather
          than a rewrite.
        </p>
        <ul class="mt-8 space-y-3">
          <li
            v-for="tool in TOOL_MANIFEST"
            :key="tool.name"
            class="rounded-lg border border-white/10 px-4 py-3"
          >
            <p class="font-mono text-sm text-sky-300">{{ tool.name }}</p>
            <p class="mt-1 text-sm leading-relaxed text-slate-400">{{ tool.description }}</p>
          </li>
        </ul>
        <p class="mt-6 text-sm text-slate-500">
          Open the <span class="text-slate-300">Agent tool calls</span> panel on the map to watch
          them run.
        </p>
      </div>
    </section>

    <section class="border-t border-white/10">
      <div class="mx-auto max-w-3xl px-6 py-20">
        <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-400">Built with</p>
        <h2 class="mt-4 text-2xl font-semibold text-white sm:text-3xl">The stack</h2>

        <dl class="mt-8 grid gap-x-8 gap-y-5 sm:grid-cols-2">
          <div v-for="item in stack" :key="item.name" class="border-t border-white/10 pt-4">
            <dt class="font-medium text-white">{{ item.name }}</dt>
            <dd class="mt-1 text-sm text-slate-400">{{ item.note }}</dd>
          </div>
        </dl>

        <div class="mt-12 border-t border-white/10 pt-8">
          <h3 class="font-medium text-white">Where the data comes from</h3>
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
            to work out which authority would decide an application. Both are public and free. The
            scoring weights are my own reading of how much each designation constrains development,
            and they are deliberately easy to argue with.
          </p>
        </div>
      </div>
    </section>

    <footer class="border-t border-white/10">
      <div
        class="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 px-6 py-12 text-sm"
      >
        <div>
          <p class="font-medium text-white">Petras Newman-Predko</p>
          <p class="mt-1 text-slate-500">Indicative only — always verify with the authority.</p>
        </div>
        <a
          :href="REPO"
          target="_blank"
          rel="noopener"
          class="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 font-medium text-slate-900 transition hover:bg-slate-200"
        >
          <svg viewBox="0 0 16 16" class="h-4 w-4" fill="currentColor" aria-hidden="true">
            <path
              d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
            />
          </svg>
          Read the code on GitHub
        </a>
      </div>
    </footer>
  </div>
</template>
