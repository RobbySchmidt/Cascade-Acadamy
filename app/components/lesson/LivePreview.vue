<script setup lang="ts">
const props = defineProps<{
  html: string
  css: string
}>()

const frame = ref<HTMLIFrameElement | null>(null)

const doc = computed(() =>
  '<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:sans-serif;margin:16px;}'
  + (props.css || '')
  + '</style></head><body>'
  + (props.html || '')
  + '</body></html>',
)

function getDoc(): Document | null | undefined {
  return frame.value?.contentDocument
}

defineExpose({ getDoc })
</script>

<template>
  <div>
    <!-- header row -->
    <div class="flex items-center justify-between" style="margin-bottom: 10px">
      <span
        class="font-semibold uppercase text-text-faint"
        style="font-size: 11.5px; letter-spacing: 1px"
      >Live-Vorschau</span>
      <span class="flex items-center gap-[6px] font-medium" style="font-size: 12.5px; color: #2BB673">
        <span style="font-size: 9px; line-height: 1">●</span> aktualisiert
      </span>
    </div>

    <!-- preview box -->
    <div
      class="overflow-hidden border border-border bg-surface"
      style="border-radius: 12px; min-height: 200px"
    >
      <iframe
        ref="frame"
        sandbox="allow-same-origin"
        :srcdoc="doc"
        title="Live-Vorschau"
        style="width: 100%; height: 200px; border: 0; display: block"
      />
    </div>
  </div>
</template>
