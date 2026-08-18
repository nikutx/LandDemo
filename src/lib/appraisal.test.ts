import { describe, expect, it } from 'vitest'
import { appraise, describeLocation, scoreConstraints, verdictFor } from './appraisal'
import { DATASET_BY_ID } from './datasets'
import type { Constraint, SiteLookup } from './planningData'

function constraint(datasetId: string, name = 'Test designation'): Constraint {
  const dataset = DATASET_BY_ID.get(datasetId)
  if (!dataset) throw new Error(`Unknown dataset in test fixture: ${datasetId}`)
  return { dataset, entity: 1, name, reference: 'TEST/1', startDate: null }
}

function lookup(constraints: Constraint[]): SiteLookup {
  return {
    point: { lat: 51.7157, lng: -1.9756 },
    context: {
      postcode: 'GL7 1FP',
      district: 'Cotswold',
      parish: 'Cirencester',
      ward: 'Cirencester Park',
      region: 'South West',
      constituency: 'South Cotswolds',
    },
    constraints,
    trace: [],
    totalMs: 120,
  }
}

describe('scoreConstraints', () => {
  it('scores an unconstrained site at zero', () => {
    expect(scoreConstraints([])).toBe(0)
  })

  it('ignores positive designations when scoring difficulty', () => {
    expect(scoreConstraints([constraint('brownfield-land')])).toBe(0)
  })

  it('lets the heaviest designation dominate regardless of input order', () => {
    const greenBeltFirst = scoreConstraints([
      constraint('green-belt'),
      constraint('tree-preservation-zone'),
    ])
    const treesFirst = scoreConstraints([
      constraint('tree-preservation-zone'),
      constraint('green-belt'),
    ])
    expect(greenBeltFirst).toBe(treesFirst)
    expect(greenBeltFirst).toBeGreaterThan(scoreConstraints([constraint('tree-preservation-zone')]))
  })

  it('adds later constraints with diminishing weight, never above 100', () => {
    const stacked = scoreConstraints(
      ['green-belt', 'national-park', 'ancient-woodland', 'scheduled-monument'].map((id) =>
        constraint(id),
      ),
    )
    expect(stacked).toBeLessThanOrEqual(100)
    expect(stacked).toBeGreaterThan(scoreConstraints([constraint('green-belt')]))
  })
})

describe('describeLocation', () => {
  const base = { postcode: null, ward: null, region: null, constituency: null }

  it('names the parish and the district when they differ', () => {
    expect(describeLocation({ ...base, parish: 'Cirencester', district: 'Cotswold' })).toBe(
      'Cirencester, Cotswold',
    )
  })

  it('drops an unparished-area placeholder rather than repeating the district', () => {
    expect(
      describeLocation({
        ...base,
        parish: 'Bath and North East Somerset, unparished area',
        district: 'Bath and North East Somerset',
      }),
    ).toBe('Bath and North East Somerset')
  })

  it('falls back to whatever is known', () => {
    expect(describeLocation({ ...base, parish: null, district: 'Cotswold' })).toBe('Cotswold')
    expect(describeLocation({ ...base, parish: null, district: null })).toBe('')
  })
})

describe('verdictFor', () => {
  it('bands a clean site as clear and a Green Belt site as severe', () => {
    expect(verdictFor(0).verdict).toBe('clear')
    expect(verdictFor(scoreConstraints([constraint('green-belt')])).verdict).toBe('severe')
  })
})

describe('appraise', () => {
  it('reports an unconstrained site without claiming it is developable', () => {
    const result = appraise(lookup([]))
    expect(result.score).toBe(0)
    expect(result.drivers).toHaveLength(0)
    expect(result.summary).toContain('outside every national designation')
    expect(result.summary).toContain('does not make it developable')
  })

  it('names the binding constraint and the deciding authority', () => {
    const result = appraise(
      lookup([constraint('green-belt', 'Bristol Green Belt'), constraint('conservation-area')]),
    )
    expect(result.summary).toContain('Green Belt')
    expect(result.summary).toContain('Cotswold')
    expect(result.drivers[0].dataset.id).toBe('green-belt')
  })

  it('separates opportunities from constraints', () => {
    const result = appraise(lookup([constraint('brownfield-land'), constraint('flood-risk-zone')]))
    expect(result.opportunities.map((c) => c.dataset.id)).toEqual(['brownfield-land'])
    expect(result.drivers.map((c) => c.dataset.id)).toEqual(['flood-risk-zone'])
    expect(result.summary).toContain('positive signal')
  })

  it('deduplicates next steps so the same action is never listed twice', () => {
    const result = appraise(lookup([constraint('flood-risk-zone'), constraint('flood-risk-zone')]))
    expect(result.nextSteps).toHaveLength(1)
  })
})
