const COLOR_PROPS = new Set(['color', 'background-color', 'border-color'])

// Minimal named-color + hex fallback map for colors used in lessons.
// Keyed by lowercase CSS color name, value is canonical rgb() string.
const NAMED_COLORS: Record<string, string> = {
  teal:    'rgb(0,128,128)',
  blue:    'rgb(0,0,255)',
  red:     'rgb(255,0,0)',
  green:   'rgb(0,128,0)',
  black:   'rgb(0,0,0)',
  white:   'rgb(255,255,255)',
  gray:    'rgb(128,128,128)',
  grey:    'rgb(128,128,128)',
  yellow:  'rgb(255,255,0)',
  orange:  'rgb(255,165,0)',
  purple:  'rgb(128,0,128)',
  pink:    'rgb(255,192,203)',
  cyan:    'rgb(0,255,255)',
  magenta: 'rgb(255,0,255)',
}

function parseHex(hex: string): string | null {
  const h = hex.trim().replace(/^#/, '')
  if (h.length === 3) {
    const r = parseInt(h[0] + h[0], 16)
    const g = parseInt(h[1] + h[1], 16)
    const b = parseInt(h[2] + h[2], 16)
    return `rgb(${r},${g},${b})`
  }
  if (h.length === 6) {
    const r = parseInt(h.slice(0, 2), 16)
    const g = parseInt(h.slice(2, 4), 16)
    const b = parseInt(h.slice(4, 6), 16)
    return `rgb(${r},${g},${b})`
  }
  return null
}

function tryDomResolve(value: string): string | null {
  if (typeof document === 'undefined') return null
  try {
    const el = document.createElement('div')
    el.style.color = value
    document.body.appendChild(el)
    const resolved = getComputedStyle(el).color
    el.remove()
    // happy-dom may return '' or the original value if it cannot resolve
    if (!resolved || resolved === value) return null
    const m = resolved.match(/rgba?\(([^)]+)\)/)
    if (!m) return null
    const parts = m[1].split(',').map((s: string) => s.trim())
    return `rgb(${parts.slice(0, 3).join(',')})`
  } catch {
    return null
  }
}

export function normalizeColor(value: string): string {
  const trimmed = value.trim()

  // 1. Try DOM resolution first (works in real browsers and some happy-dom versions)
  const domResult = tryDomResolve(trimmed)
  if (domResult) return domResult

  // 2. If it's already rgb/rgba, normalize whitespace
  const rgbMatch = trimmed.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
  if (rgbMatch) {
    return `rgb(${rgbMatch[1]},${rgbMatch[2]},${rgbMatch[3]})`
  }

  // 3. Hex color
  if (trimmed.startsWith('#')) {
    const parsed = parseHex(trimmed)
    if (parsed) return parsed
  }

  // 4. Named color fallback map
  const lower = trimmed.toLowerCase()
  if (NAMED_COLORS[lower]) return NAMED_COLORS[lower]

  // 5. Return normalized lowercase as last resort
  return lower
}

export function matchesExpected(prop: string, actual: string, expected: string): boolean {
  if (COLOR_PROPS.has(prop) || prop.includes('color')) {
    return normalizeColor(actual) === normalizeColor(expected)
  }
  return actual.trim().toLowerCase() === expected.trim().toLowerCase()
}

export interface Assertion { selector: string; prop: string; expected: string }

// Some shorthand properties are returned inconsistently (or empty) by
// getComputedStyle across browsers (Firefox often returns '' for shorthands).
// When the direct read is empty, fall back to a representative longhand.
const SHORTHAND_FALLBACK: Record<string, string> = {
  'border-width': 'border-top-width',
  'border-style': 'border-top-style',
  'border-color': 'border-top-color',
  'border-radius': 'border-top-left-radius',
  padding: 'padding-top',
  margin: 'margin-top',
}

export function readComputed(el: Element, prop: string): string {
  const style = getComputedStyle(el)
  let value = style.getPropertyValue(prop)
  if (!value.trim() && SHORTHAND_FALLBACK[prop]) {
    value = style.getPropertyValue(SHORTHAND_FALLBACK[prop])
  }
  return value
}

export function evalAssertions(doc: Document, assertions: Assertion[]) {
  return assertions.map(a => {
    const el = doc.querySelector(a.selector)
    const actual = el ? readComputed(el, a.prop) : ''
    return { ...a, actual, passed: !!el && matchesExpected(a.prop, actual, a.expected) }
  })
}
