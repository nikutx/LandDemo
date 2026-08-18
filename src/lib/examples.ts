import type { LatLng } from './planningData'

/**
 * Places that show what the tool is for. Each was chosen because it lands in a
 * genuinely different position — a protected landscape, a Green Belt edge, a
 * National Park, a World Heritage Site, and open farmland with nothing on it —
 * so the contrast between them is the demonstration.
 */
export interface ExampleSite {
  label: string
  hint: string
  point: LatLng
}

export const EXAMPLE_SITES: ExampleSite[] = [
  {
    label: 'Cirencester',
    hint: 'National Landscape and a conservation area',
    point: { lat: 51.7157, lng: -1.9756 },
  },
  {
    label: 'Bath',
    hint: 'World Heritage Site',
    point: { lat: 51.381, lng: -2.359 },
  },
  {
    label: 'Bristol Green Belt',
    hint: 'Green Belt with flood risk',
    point: { lat: 51.42, lng: -2.51 },
  },
  {
    label: 'Lake District',
    hint: 'National Park and an SSSI',
    point: { lat: 54.46, lng: -3.09 },
  },
  {
    label: 'Fenland farmland',
    hint: 'nothing mapped against it',
    point: { lat: 52.6, lng: -0.45 },
  },
]
