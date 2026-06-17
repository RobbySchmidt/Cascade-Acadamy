import { describe, it, expect, vi, afterEach } from 'vitest'
import { normalizeColor, matchesExpected, readComputed } from '../app/utils/checker'

describe('normalizeColor', () => {
  it('treats teal, #008080, rgb(0,128,128) as equal', () => {
    const a = normalizeColor('teal'), b = normalizeColor('#008080'), c = normalizeColor('rgb(0, 128, 128)')
    expect(a).toBe(b); expect(b).toBe(c)
  })
})
describe('matchesExpected', () => {
  it('matches color expectations regardless of format', () => {
    expect(matchesExpected('color', 'rgb(0, 128, 128)', 'teal')).toBe(true)
  })
  it('matches keyword props with whitespace/case tolerance', () => {
    expect(matchesExpected('text-align', 'center', 'CENTER')).toBe(true)
  })
  it('fails on mismatch', () => {
    expect(matchesExpected('text-align', 'left', 'center')).toBe(false)
  })
})

describe('readComputed shorthand fallback', () => {
  afterEach(() => vi.unstubAllGlobals())

  function stubStyle(map: Record<string, string>) {
    vi.stubGlobal('getComputedStyle', () => ({
      getPropertyValue: (p: string) => map[p] ?? '',
    }))
  }

  it('falls back to a longhand when the shorthand returns empty (Firefox case)', () => {
    stubStyle({ 'border-top-width': '2px', 'border-top-style': 'solid', 'border-top-left-radius': '12px' })
    const el = {} as Element
    expect(readComputed(el, 'border-width')).toBe('2px')
    expect(readComputed(el, 'border-style')).toBe('solid')
    expect(readComputed(el, 'border-radius')).toBe('12px')
  })

  it('uses the shorthand value directly when present (Chrome case)', () => {
    stubStyle({ 'border-radius': '12px', 'border-top-left-radius': '99px' })
    expect(readComputed({} as Element, 'border-radius')).toBe('12px')
  })

  it('returns the direct value for normal longhand props', () => {
    stubStyle({ 'padding-top': '24px' })
    expect(readComputed({} as Element, 'padding-top')).toBe('24px')
  })
})
