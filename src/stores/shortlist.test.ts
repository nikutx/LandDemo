import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useShortlistStore, type ShortlistedSite } from './shortlist'

function site(overrides: Partial<ShortlistedSite> & { score: number }) {
  return {
    point: { lat: 51.7157, lng: -1.9756 },
    place: 'Cirencester, Cotswold',
    headline: 'Significantly constrained',
    designations: ['National Landscape (AONB)'],
    nextStep: 'Commission a landscape and visual impact appraisal',
    ...overrides,
  }
}

describe('shortlist store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('ranks saved sites from least to most constrained', () => {
    const shortlist = useShortlistStore()
    shortlist.add(site({ score: 84, place: 'Bath', point: { lat: 51.381, lng: -2.359 } }))
    shortlist.add(site({ score: 32, place: 'Wittering', point: { lat: 52.6, lng: -0.45 } }))
    shortlist.add(site({ score: 70 }))

    expect(shortlist.ranked.map((entry) => entry.place)).toEqual([
      'Wittering',
      'Cirencester, Cotswold',
      'Bath',
    ])
  })

  it('treats a point a few metres away as the same site', () => {
    const shortlist = useShortlistStore()
    shortlist.add(site({ score: 70 }))
    shortlist.add(site({ score: 70, point: { lat: 51.71571, lng: -1.97561 } }))

    expect(shortlist.count).toBe(1)
  })

  it('reports whether a point is already saved, and toggles it off again', () => {
    const shortlist = useShortlistStore()
    const point = { lat: 51.7157, lng: -1.9756 }

    expect(shortlist.has(point)).toBe(false)
    shortlist.toggle(site({ score: 70 }))
    expect(shortlist.has(point)).toBe(true)
    shortlist.toggle(site({ score: 70 }))
    expect(shortlist.has(point)).toBe(false)
  })

  it('writes a pasteable summary in ranked order with a link per site', () => {
    const shortlist = useShortlistStore()
    shortlist.add(site({ score: 84, place: 'Bath', point: { lat: 51.381, lng: -2.359 } }))
    shortlist.add(site({ score: 32, place: 'Wittering', point: { lat: 52.6, lng: -0.45 } }))

    const text = shortlist.asText()
    expect(text.indexOf('Wittering')).toBeLessThan(text.indexOf('Bath'))
    expect(text).toContain('lat=52.60000&lng=-0.45000')
    expect(text).toContain('32/100')
  })

  it('has nothing to say when nothing is saved', () => {
    expect(useShortlistStore().asText()).toBe('')
  })
})
