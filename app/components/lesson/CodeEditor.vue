<script setup lang="ts">
import { EditorView, lineNumbers, keymap } from '@codemirror/view'
import { EditorState, Compartment } from '@codemirror/state'
import { defaultKeymap, indentWithTab, history, historyKeymap } from '@codemirror/commands'
import { css } from '@codemirror/lang-css'
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language'
import { tags } from '@lezer/highlight'

const props = withDefaults(defineProps<{
  modelValue: string
  theme: 'light' | 'dark'
  readonly?: boolean
}>(), {
  readonly: false,
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const el = ref<HTMLDivElement | null>(null)
let view: EditorView | null = null
const themeCompartment = new Compartment()

interface ThemePalette {
  codeBg: string
  edge: string
  gutterBg: string
  gutterText: string
  codeText: string
  selector: string
  property: string
  value: string
}

// Teal-harmonized to match the app's dark, teal-tinted chrome:
// dark = deep teal ink (not purple), light = cool teal-white (not warm cream).
const PALETTES: Record<'light' | 'dark', ThemePalette> = {
  light: {
    codeBg: '#F3FAF8',
    edge: '#D4E7E1',
    gutterBg: '#E6F2EE',
    gutterText: '#9DBDB6',
    codeText: '#18211F',
    selector: '#1F2937',
    property: '#0E7490',
    value: '#15803D',
  },
  dark: {
    codeBg: '#0E1C19',
    edge: '#1E332E',
    gutterBg: '#0A1714',
    gutterText: '#557068',
    codeText: '#DDEBE8',
    selector: '#FFCB6B',
    property: '#5FE0D2',
    value: '#B6E59E',
  },
}

function buildTheme(name: 'light' | 'dark') {
  const p = PALETTES[name]

  const editorTheme = EditorView.theme({
    '&': {
      backgroundColor: p.codeBg,
      color: p.codeText,
      fontSize: '13px',
      borderRadius: '10px',
      border: `1px solid ${p.edge}`,
    },
    '.cm-scroller': {
      fontFamily: '"JetBrains Mono", monospace',
      lineHeight: '1.7',
    },
    '.cm-content': {
      caretColor: p.codeText,
      padding: '12px 0',
    },
    '.cm-gutters': {
      backgroundColor: p.gutterBg,
      color: p.gutterText,
      border: 'none',
      minWidth: '42px',
    },
    '.cm-lineNumbers .cm-gutterElement': {
      padding: '0 14px 0 0',
      minWidth: '42px',
      textAlign: 'right',
    },
    '.cm-activeLine': { backgroundColor: 'transparent' },
    '.cm-activeLineGutter': { backgroundColor: 'transparent' },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: p.codeText },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: name === 'dark' ? 'rgba(18,181,165,0.22)' : '#CFE9E3',
    },
    '.cm-line': { padding: '0 12px' },
  }, { dark: name === 'dark' })

  const highlight = HighlightStyle.define([
    { tag: tags.tagName, color: p.selector },
    { tag: tags.typeName, color: p.selector },
    { tag: tags.className, color: p.selector },
    { tag: tags.angleBracket, color: name === 'dark' ? '#7FB5AD' : '#6B7280' },
    { tag: tags.propertyName, color: p.property },
    { tag: tags.string, color: p.value },
    { tag: tags.number, color: p.value },
    { tag: tags.unit, color: p.value },
    { tag: tags.keyword, color: p.value },
    { tag: tags.atom, color: p.value },
    { tag: tags.constant(tags.name), color: p.value },
    { tag: tags.literal, color: p.value },
    { tag: tags.color, color: p.value },
    { tag: tags.variableName, color: p.value },
    { tag: tags.comment, color: name === 'dark' ? '#5C7A74' : '#8AA39D', fontStyle: 'italic' },
    { tag: tags.punctuation, color: p.codeText },
  ])

  return [editorTheme, syntaxHighlighting(highlight)]
}

function createView() {
  if (!el.value) return

  const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged && !props.readonly) {
      const value = update.state.doc.toString()
      if (value !== props.modelValue) emit('update:modelValue', value)
    }
  })

  const extensions = [
    lineNumbers(),
    history(),
    keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
    css(),
    EditorState.readOnly.of(props.readonly),
    EditorView.editable.of(!props.readonly),
    themeCompartment.of(buildTheme(props.theme)),
    updateListener,
  ]

  view = new EditorView({
    state: EditorState.create({
      doc: props.modelValue,
      extensions,
    }),
    parent: el.value,
  })
}

onMounted(() => {
  createView()
})

onBeforeUnmount(() => {
  view?.destroy()
  view = null
})

// React to external theme changes by reconfiguring the theme compartment
watch(() => props.theme, (next) => {
  if (!view) return
  view.dispatch({ effects: themeCompartment.reconfigure(buildTheme(next)) })
})

// React to external modelValue changes (e.g. "Lösung anzeigen")
watch(() => props.modelValue, (next) => {
  if (!view) return
  const current = view.state.doc.toString()
  if (next !== current) {
    view.dispatch({
      changes: { from: 0, to: current.length, insert: next ?? '' },
    })
  }
})
</script>

<template>
  <div
    ref="el"
    class="cm-editor-host overflow-hidden font-mono"
    style="border-radius: 10px; font-size: 13px"
  />
</template>

<style scoped>
.cm-editor-host :deep(.cm-editor) {
  border-radius: 10px;
}
.cm-editor-host :deep(.cm-editor.cm-focused) {
  outline: none;
}
.cm-editor-host :deep(.cm-scroller) {
  overflow: auto;
}
</style>
