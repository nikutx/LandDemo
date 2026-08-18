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
import type { Feature, FeatureCollection } from 'geojson'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { DEFAULT_POINT, useSiteStore } from '../stores/site'
import 'maplibre-gl/dist/maplibre-gl.css'

setWorkerUrl(workerUrl)

const store = useSiteStore()
const { point, boundaries } = storeToRefs(store)

const container = ref<HTMLDivElement | null>(null)
let map: MapLibreMap | null = null
let marker: Marker | null = null
let resizeObserver: ResizeObserver | null = null

const CONSTRAINT_SOURCE = 'constraint-boundaries'

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

    renderBoundaries()
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
