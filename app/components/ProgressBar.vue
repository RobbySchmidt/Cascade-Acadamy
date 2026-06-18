<script setup lang="ts">
const props = withDefaults(defineProps<{
  percent: number
  variant?: 'teal' | 'onTeal'
}>(), {
  variant: 'teal',
})

const clamped = computed(() => Math.max(0, Math.min(100, props.percent)))

const trackColor = computed(() => props.variant === 'onTeal' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)')
const fillColor = computed(() => props.variant === 'onTeal' ? '#FFFFFF' : '#12B5A5')
</script>

<template>
  <div
    class="w-full overflow-hidden rounded-pill"
    :style="{ height: '8px', background: trackColor }"
    role="progressbar"
    :aria-valuenow="clamped"
    aria-valuemin="0"
    aria-valuemax="100"
  >
    <div
      class="h-full rounded-pill transition-[width] duration-300"
      :style="{ width: clamped + '%', background: fillColor }"
    />
  </div>
</template>
