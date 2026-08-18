/**
 * Planning constraint datasets checked for every site, all served by the
 * planning.data.gov.uk open data platform. Each is a polygon dataset that
 * supports point-intersection queries.
 *
 * `weight` drives the planning-difficulty score: it is a 1-10 judgement of how
 * much a designation constrains development, not a value published upstream.
 */
export interface ConstraintDataset {
  /** Dataset slug on planning.data.gov.uk */
  id: string
  /** Human-readable label shown in the panel */
  label: string
  /** What it means for a developer, in one line */
  hint: string
  /** The practical next step when a site hits this designation */
  action: string
  /** Colour for the panel dot and the map polygon */
  color: string
  /** Constraint severity, 1 (procedural) to 10 (near-prohibitive) */
  weight: number
}

export const CONSTRAINT_DATASETS: ConstraintDataset[] = [
  {
    id: 'green-belt',
    label: 'Green Belt',
    hint: 'Only very special circumstances outweigh Green Belt harm',
    action: 'Test against NPPF Green Belt exceptions before spending on design',
    color: '#22c55e',
    weight: 9,
  },
  {
    id: 'national-park',
    label: 'National Park',
    hint: 'The National Park authority is the planning authority here',
    action: 'Engage the Park authority early — their policies override district ones',
    color: '#0d9488',
    weight: 9,
  },
  {
    id: 'ancient-woodland',
    label: 'Ancient Woodland',
    hint: 'Irreplaceable habitat — loss or deterioration is refused save in wholly exceptional cases',
    action: 'Commission an arboricultural survey and design a buffer',
    color: '#166534',
    weight: 9,
  },
  {
    id: 'site-of-special-scientific-interest',
    label: 'SSSI',
    hint: 'Natural England is a statutory consultee on anything affecting the site',
    action: 'Check the SSSI impact risk zones before assuming a residential use',
    color: '#a855f7',
    weight: 8,
  },
  {
    id: 'scheduled-monument',
    label: 'Scheduled Monument',
    hint: 'Nationally important archaeology — separate consent sits above planning',
    action: 'Budget for scheduled monument consent and a heritage statement',
    color: '#b45309',
    weight: 8,
  },
  {
    id: 'world-heritage-site',
    label: 'World Heritage Site',
    hint: 'Outstanding universal value is protected, including the setting',
    action: 'Expect a heritage impact assessment against the site management plan',
    color: '#e11d48',
    weight: 8,
  },
  {
    id: 'special-area-of-conservation',
    label: 'Special Area of Conservation',
    hint: 'Habitats Regulations apply — nutrient and recreation impacts bite',
    action: 'Scope a Habitats Regulations Assessment early',
    color: '#7c3aed',
    weight: 8,
  },
  {
    id: 'area-of-outstanding-natural-beauty',
    label: 'National Landscape (AONB)',
    hint: 'Great weight is given to conserving landscape and scenic beauty',
    action: 'Commission a landscape and visual impact appraisal',
    color: '#84cc16',
    weight: 7,
  },
  {
    id: 'flood-risk-zone',
    label: 'Flood Risk Zone',
    hint: 'Environment Agency flood zone — the sequential test applies',
    action: 'Get a flood risk assessment and check the zone 2 / 3a / 3b split',
    color: '#3b82f6',
    weight: 7,
  },
  {
    id: 'ramsar',
    label: 'Ramsar Site',
    hint: 'Internationally important wetland, treated as a European site',
    action: 'Assume Habitats Regulations screening is required',
    color: '#0891b2',
    weight: 7,
  },
  {
    id: 'conservation-area',
    label: 'Conservation Area',
    hint: 'Character and appearance are protected; demolition needs consent',
    action: 'Read the conservation area appraisal before fixing the layout',
    color: '#f59e0b',
    weight: 6,
  },
  {
    id: 'listed-building-outline',
    label: 'Listed Building',
    hint: 'Listed building consent runs alongside planning permission',
    action: 'Check whether the listing covers curtilage structures too',
    color: '#dc2626',
    weight: 6,
  },
  {
    id: 'article-4-direction-area',
    label: 'Article 4 Direction',
    hint: 'Permitted development rights are withdrawn in this area',
    action: 'Confirm which rights are removed — it changes the consent route',
    color: '#f97316',
    weight: 5,
  },
  {
    id: 'agricultural-land-classification',
    label: 'Agricultural Land',
    hint: 'Best and most versatile farmland weighs against development',
    action: 'Check the grade — 1, 2 and 3a carry real policy weight',
    color: '#ca8a04',
    weight: 4,
  },
  {
    id: 'tree-preservation-zone',
    label: 'Tree Preservation Order',
    hint: 'Protected trees — works need council consent',
    action: 'Survey the protected trees and design around root protection areas',
    color: '#65a30d',
    weight: 4,
  },
  {
    id: 'brownfield-land',
    label: 'Brownfield Register',
    hint: 'Previously developed land the authority has already identified',
    action: 'Positive signal — check whether permission in principle is available',
    color: '#64748b',
    weight: 1,
  },
]

/** Slug -> dataset, for joining API rows back to their presentation metadata. */
export const DATASET_BY_ID = new Map(CONSTRAINT_DATASETS.map((d) => [d.id, d]))

/** Datasets that describe opportunity rather than restriction. */
export const POSITIVE_DATASETS = new Set(['brownfield-land'])
