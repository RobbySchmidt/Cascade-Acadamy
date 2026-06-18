<script setup lang="ts">
interface Circle {
  size: number
  top?: string
  right?: string
  bottom?: string
  left?: string
  opacity?: number
}

const props = withDefaults(defineProps<{
  circles?: Circle[]
  /** Circle tint: 'white' (on teal panels) or 'dark' faint white (on dark surfaces). */
  color?: string
}>(), {
  circles: () => [
    // Off-edge top-right — very faint white on dark surfaces
    { size: 260, top: '-90px', right: '-70px', opacity: 0.035 },
    // Off-edge bottom-right
    { size: 200, bottom: '-110px', right: '60px', opacity: 0.03 },
  ],
  color: '255,255,255',
})
</script>

<template>
  <div class="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
    <span
      v-for="(c, i) in circles"
      :key="i"
      class="absolute rounded-full"
      :style="{
        width: c.size + 'px',
        height: c.size + 'px',
        top: c.top,
        right: c.right,
        bottom: c.bottom,
        left: c.left,
        background: `rgba(${color},${c.opacity ?? 0.035})`,
      }"
    />
  </div>
</template>
