<script setup lang="ts">
import {
  GeoJSONSource,
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  ScaleControl,
  setWorkerUrl,
  type LngLatLike,
} from 'maplibre-gl'
// MapLibre decodes vector tiles in a web worker. Dependency pre-bundling
// rewrites the library without emitting that worker beside it, so in dev the
// worker fails to load and the map renders no tiles at all — silently, because
// tile loading is delegated to a worker that never started. Handing MapLibre an
// explicit URL for its shipped worker makes dev and production agree.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-csp-worker.js?url'
import type { Feature, FeatureCollection, Point } from 'geojson'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { DEFAULT_POINT, useSiteStore } from '../stores/site'
import 'maplibre-gl/dist/maplibre-gl.css'

setWorkerUrl(workerUrl)

const store = useSiteStore()
const { point, boundaries, candidates } = storeToRefs(store)

const container = ref<HTMLDivElement | null>(null)
let map: MapLibreMap | null = null
let marker: Marker | null = null
let resizeObserver: ResizeObserver | null = null

const CONSTRAINT_SOURCE = 'constraint-boundaries'
const CANDIDATE_SOURCE = 'nearby-candidates'

/** Green through amber, matching the score bands used in the panel. */
function scoreColor(score: number): string {
  if (score === 0) return '#10b981'
  if (score <= 20) return '#84cc16'
  if (score <= 45) return '#f59e0b'
  return '#f97316'
}

/**
 * Redraw the designation boundaries returned for the current point.
 *
 * The guard is whether the source exists, not `isStyleLoaded()`: that reports
 * false whenever the style has any work outstanding, which on a live vector map
 * is very nearly always, so guarding on it silently drops every update. If the
 * source has been added, it can take data.
 */
function renderBoundaries() {
  const source = map?.getSource(CONSTRAINT_SOURCE) as GeoJSONSource | undefined
  if (!source) return

  const features: Feature[] = boundaries.value.map((boundary) => ({
    type: 'Feature',
    geometry: boundary.geometry,
    properties: { color: boundary.color, label: boundary.label },
  }))

  const collection: FeatureCollection = { type: 'FeatureCollection', features }
  source.setData(collection)
}

/** Plot the less-constrained land found around the current site. */
function renderCandidates() {
  const source = map?.getSource(CANDIDATE_SOURCE) as GeoJSONSource | undefined
  if (!source) return

  const features: Feature[] = candidates.value.map((candidate) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [candidate.point.lng, candidate.point.lat] },
    properties: {
      color: scoreColor(candidate.score),
      label: `${candidate.score}`,
    },
  }))

  source.setData({ type: 'FeatureCollection', features })
}

onMounted(() => {
  if (!container.value) return

  const instance = new MapLibreMap({
    container: container.value,
    style: 'https://tiles.openfreemap.org/styles/positron',
    center: [DEFAULT_POINT.lng, DEFAULT_POINT.lat] as LngLatLike,
    zoom: 13.5,
  })
  map = instance

  instance.addControl(new NavigationControl({ showCompass: false }), 'bottom-right')
  instance.addControl(new ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-left')

  instance.on('load', () => {
    instance.addSource(CONSTRAINT_SOURCE, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    })
    instance.addLayer({
      id: 'constraint-fill',
      type: 'fill',
      source: CONSTRAINT_SOURCE,
      paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.22 },
    })
    instance.addLayer({
      id: 'constraint-line',
      type: 'line',
      source: CONSTRAINT_SOURCE,
      paint: { 'line-color': ['get', 'color'], 'line-width': 2.5, 'line-opacity': 0.9 },
    })

    instance.addSource(CANDIDATE_SOURCE, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    })
    instance.addLayer({
      id: 'candidate-halo',
      type: 'circle',
      source: CANDIDATE_SOURCE,
      paint: {
        'circle-radius': 15,
        'circle-color': ['get', 'color'],
        'circle-opacity': 0.22,
      },
    })
    instance.addLayer({
      id: 'candidate-dot',
      type: 'circle',
      source: CANDIDATE_SOURCE,
      paint: {
        'circle-radius': 11,
        'circle-color': ['get', 'color'],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
      },
    })
    instance.addLayer({
      id: 'candidate-label',
      type: 'symbol',
      source: CANDIDATE_SOURCE,
      layout: {
        'text-field': ['get', 'label'],
        'text-size': 11,
        'text-font': ['Noto Sans Bold'],
        'text-allow-overlap': true,
      },
      paint: { 'text-color': '#ffffff' },
    })

    instance.on('click', 'candidate-dot', (event) => {
      const [lng, lat] = (event.features?.[0]?.geometry as Point).coordinates
      store.select({ lat, lng })
      event.originalEvent.stopPropagation()
    })

    renderBoundaries()
    renderCandidates()
  })

  instance.on('click', (event) => {
    store.select({ lat: event.lngLat.lat, lng: event.lngLat.lng })
  })

  instance.getCanvas().style.cursor = 'crosshair'

  // The map measures its container once, at construction. Inside a flex column
  // that height can still be zero at that moment, and a zero-height map never
  // works out which tiles it needs — so it silently renders nothing. Watching
  // the container covers both that first layout and the responsive breakpoint
  // where the panel moves from beside the map to beneath it.
  resizeObserver = new ResizeObserver(() => instance.resize())
  resizeObserver.observe(container.value)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  marker?.remove()
  map?.remove()
  map = null
})

watch(point, (next) => {
  if (!map || !next) return

  const position: LngLatLike = [next.lng, next.lat]
  if (marker) {
    marker.setLngLat(position)
  } else {
    const element = document.createElement('div')
    element.className = 'site-pin'
    marker = new Marker({ element, anchor: 'center' }).setLngLat(position).addTo(map)
  }

  map.easeTo({ center: position, duration: 600 })
})

watch(boundaries, renderBoundaries)
watch(candidates, renderCandidates)
</script>

<template>
  <div ref="container" class="h-full w-full" />
</template>

<style>
.site-pin {
  width: 18px;
  height: 18px;
  border-radius: 9999px;
  background: #0f172a;
  border: 3px solid #f8fafc;
  box-shadow: 0 0 0 4px rgb(15 23 42 / 0.18);
}

.maplibregl-ctrl-attrib {
  font-size: 10px;
}
</style>
