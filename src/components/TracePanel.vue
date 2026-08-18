<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useSiteStore } from '../stores/site'
import { TOOL_MANIFEST } from '../lib/agentTools'

const { lookup } = storeToRefs(useSiteStore())
const open = ref(false)
const tab = ref<'trace' | 'tools'>('trace')

const slowest = computed(() =>
  lookup.value?.trace.reduce((worst, entry) => (entry.ms > worst.ms ? entry : worst)),
)
</script>

<template>
  <div class="pointer-events-auto w-[min(420px,calc(100vw-2rem))] text-slate-100">
    <button
      class="flex w-full items-center justify-between rounded-t-xl bg-slate-900/95 px-4 py-2.5 text-left text-xs backdrop-blur transition hover:bg-slate-900"
      :class="open ? '' : 'rounded-b-xl'"
      @click="open = !open"
    >
      <span class="flex items-center gap-2 font-medium">
        <span class="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        Agent tool calls
      </span>
      <span class="font-mono text-slate-400">
        <template v-if="lookup">
          {{ lookup.trace.length }} calls · {{ lookup.totalMs }}ms wall · {{ slowest?.ms }}ms slowest
        </template>
        <template v-else>idle</template>
      </span>
    </button>

    <div v-if="open" class="rounded-b-xl bg-slate-900/95 backdrop-blur">
      <div class="flex gap-1 border-b border-white/10 px-3 pt-2">
        <button
          v-for="option in (['trace', 'tools'] as const)"
          :key="option"
          class="rounded-t-md px-3 py-1.5 text-[11px] font-medium transition"
          :class="tab === option ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'"
          @click="tab = option"
        >
          {{ option === 'trace' ? 'This lookup' : 'Tool manifest' }}
        </button>
      </div>

      <div class="max-h-64 overflow-y-auto p-3">
        <table v-if="tab === 'trace' && lookup" class="w-full font-mono text-[11px]">
          <tbody>
            <tr v-for="entry in lookup.trace" :key="entry.label" class="align-top">
              <td class="py-1 pr-2">
                <span :class="entry.ok ? 'text-emerald-400' : 'text-rose-400'">
                  {{ entry.ok ? '✓' : '✕' }}
                </span>
              </td>
              <td class="py-1 pr-2 text-slate-300">{{ entry.label }}</td>
              <td class="py-1 pr-2 text-right text-slate-500">{{ entry.ms }}ms</td>
              <td class="py-1 text-right" :class="entry.results ? 'text-sky-300' : 'text-slate-600'">
                {{ entry.results }} hit{{ entry.results === 1 ? '' : 's' }}
              </td>
            </tr>
          </tbody>
        </table>

        <p v-else-if="tab === 'trace'" class="p-2 text-[11px] text-slate-400">
          Click the map to run a lookup.
        </p>

        <ul v-else class="space-y-2.5">
          <li v-for="tool in TOOL_MANIFEST" :key="tool.name">
            <p class="font-mono text-[11px] text-sky-300">{{ tool.name }}</p>
            <p class="text-[11px] leading-relaxed text-slate-400">{{ tool.description }}</p>
          </li>
        </ul>
      </div>

      <p class="border-t border-white/10 px-3 py-2 text-[10px] leading-relaxed text-slate-500">
        The panel above the map is rendered from these same calls. The manifest is the JSON Schema an
        MCP server advertises, so exposing this engine to an assistant is an adapter, not a rewrite.
      </p>
    </div>
  </div>
</template>
