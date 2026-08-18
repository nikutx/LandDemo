import { POSITIVE_DATASETS } from './datasets'
import type { Constraint, SiteContext, SiteLookup } from './planningData'

export type Verdict = 'clear' | 'light' | 'moderate' | 'significant' | 'severe'

export interface Appraisal {
  /** 0-100, where 0 is an unconstrained site */
  score: number
  verdict: Verdict
  /** Short label for the score band */
  headline: string
  /** Plain-English opening paragraph a non-planner can read */
  summary: string
  /** The designations that drove the score, worst first */
  drivers: Constraint[]
  /** Designations that help rather than hinder */
  opportunities: Constraint[]
  /** Concrete next steps, deduplicated, in severity order */
  nextSteps: string[]
}

const VERDICTS: Array<{ verdict: Verdict; upTo: number; headline: string }> = [
  { verdict: 'clear', upTo: 0, headline: 'No mapped designations' },
  { verdict: 'light', upTo: 20, headline: 'Lightly constrained' },
  { verdict: 'moderate', upTo: 45, headline: 'Moderately constrained' },
  { verdict: 'significant', upTo: 70, headline: 'Significantly constrained' },
  { verdict: 'severe', upTo: 100, headline: 'Severely constrained' },
]

/**
 * Score the site from the designations it sits inside.
 *
 * The heaviest designation dominates — a Green Belt site is hard whether or not
 * it also has a TPO — so additional constraints add with diminishing weight
 * rather than summing into a meaningless 100.
 */
export function scoreConstraints(constraints: Constraint[]): number {
  const restrictive = constraints
    .filter((c) => !POSITIVE_DATASETS.has(c.dataset.id))
    .sort((a, b) => b.dataset.weight - a.dataset.weight)

  if (restrictive.length === 0) return 0

  const score = restrictive.reduce((total, constraint, index) => {
    const contribution = constraint.dataset.weight * 8 * Math.pow(0.25, index)
    return total + contribution
  }, 0)

  return Math.min(100, Math.round(score))
}

export function verdictFor(score: number): { verdict: Verdict; headline: string } {
  const band = VERDICTS.find((v) => score <= v.upTo) ?? VERDICTS[VERDICTS.length - 1]
  return { verdict: band.verdict, headline: band.headline }
}

/**
 * Name the place without repeating itself. Where there is no civil parish the
 * data still returns one, as "<district>, unparished area", which next to the
 * district reads as the same name twice.
 */
export function describeLocation(context: SiteContext): string {
  const district = context.district?.trim() || ''
  const parish = context.parish?.trim() || ''
  const parishIsUseful =
    parish && !/unparished/i.test(parish) && parish !== district && !parish.includes(district)

  return [parishIsUseful ? parish : '', district].filter(Boolean).join(', ')
}

function describePlace(context: SiteContext): string {
  const place = describeLocation(context)
  return place ? `This site in ${place}` : 'This site'
}

function listNames(constraints: Constraint[]): string {
  const names = constraints.map((c) => c.dataset.label)
  if (names.length === 1) return names[0]
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

/** Compose the appraisal a developer actually reads, from the raw lookup. */
export function appraise(lookup: SiteLookup): Appraisal {
  const restrictive = lookup.constraints.filter((c) => !POSITIVE_DATASETS.has(c.dataset.id))
  const opportunities = lookup.constraints.filter((c) => POSITIVE_DATASETS.has(c.dataset.id))

  const score = scoreConstraints(lookup.constraints)
  const { verdict, headline } = verdictFor(score)
  const place = describePlace(lookup.context)
  const authority = lookup.context.district

  let summary: string
  if (restrictive.length === 0) {
    summary =
      `${place} sits outside every national designation checked here. ` +
      `That does not make it developable — allocation, access and local policy still decide that — ` +
      `but nothing in the national constraint layers blocks the door.`
  } else {
    const lead = restrictive[0]
    summary =
      `${place} falls within ${listNames(restrictive)}. ` +
      `${lead.dataset.label} is the binding constraint: ${lead.dataset.hint.toLowerCase()}. ` +
      (authority ? `Any application is decided by ${authority}. ` : '') +
      (opportunities.length
        ? `On the other side, it appears on the ${listNames(opportunities)}, which is a positive signal.`
        : '')
  }

  const nextSteps = [...new Set(restrictive.map((c) => c.dataset.action))]

  return {
    score,
    verdict,
    headline,
    summary: summary.trim(),
    drivers: restrictive,
    opportunities,
    nextSteps,
  }
}
