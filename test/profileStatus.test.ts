import { describe, it, expect } from 'vitest'
import { deriveCourseStatus } from '../server/utils/profileStatus'

const meta = {
  '1': { slug: 'css-grundlagen', title: 'CSS-Grundlagen' },
  '2': { slug: 'flexbox-layout', title: 'Flexbox' },
}

describe('deriveCourseStatus', () => {
  it('marks a fully-done course as abgeschlossen with 100%', () => {
    const res = deriveCourseStatus({ '1': 15 }, { '1': 15 }, meta)
    expect(res).toHaveLength(1)
    expect(res[0]).toMatchObject({ slug: 'css-grundlagen', status: 'abgeschlossen', percent: 100, done: 15, total: 15 })
  })

  it('marks a partially-done course as begonnen with rounded percent', () => {
    const res = deriveCourseStatus({ '2': 3 }, { '2': 15 }, meta)
    expect(res[0]).toMatchObject({ slug: 'flexbox-layout', status: 'begonnen', percent: 20, done: 3, total: 15 })
  })

  it('rounds the percentage', () => {
    const res = deriveCourseStatus({ '2': 1 }, { '2': 3 }, meta) // 33.33%
    expect(res[0].percent).toBe(33)
  })

  it('sorts completed courses before started ones', () => {
    const res = deriveCourseStatus({ '1': 15, '2': 3 }, { '1': 15, '2': 15 }, meta)
    expect(res.map(c => c.slug)).toEqual(['css-grundlagen', 'flexbox-layout'])
  })

  it('returns only courses with progress', () => {
    const res = deriveCourseStatus({}, { '1': 15 }, meta)
    expect(res).toEqual([])
  })

  it('does not divide by zero when totals are missing', () => {
    const res = deriveCourseStatus({ '9': 2 }, {}, { '9': { slug: 'x', title: 'X' } })
    expect(res[0]).toMatchObject({ percent: 0, status: 'begonnen', total: 0 })
  })
})
