<script setup lang="ts">
type Accent = 'teal' | 'orange' | 'violet'

const props = defineProps<{
  value: string
  label: string
  icon: string
  accent: Accent
}>()

const themes: Record<Accent, {
  text: string
  label: string
  gradient: string
  border: string
  circle: string
}> = {
  teal: {
    text: '#0E7A70',
    label: '#3C7A72',
    gradient: 'linear-gradient(150deg,#E7F8F4,#D2F2EB)',
    border: '#BFEAE0',
    circle: 'rgba(18,181,165,0.13)',
  },
  orange: {
    text: '#C2640C',
    label: '#9C6232',
    gradient: 'linear-gradient(150deg,#FFF1E6,#FFE2CC)',
    border: '#FBD3B4',
    circle: 'rgba(194,100,12,0.12)',
  },
  violet: {
    text: '#5B4BD0',
    label: '#5C548C',
    gradient: 'linear-gradient(150deg,#EEECFB,#E0DCF8)',
    border: '#CFC9F0',
    circle: 'rgba(91,75,208,0.12)',
  },
}

const t = computed(() => themes[props.accent])
</script>

<template>
  <div
    class="relative overflow-hidden p-[18px]"
    :style="{
      borderRadius: '16px',
      background: t.gradient,
      border: `1px solid ${t.border}`,
    }"
  >
    <!-- soft accent circle bottom-right, off-edge -->
    <span
      class="pointer-events-none absolute z-0 rounded-full"
      :style="{
        width: '120px',
        height: '120px',
        bottom: '-46px',
        right: '-30px',
        background: t.circle,
      }"
    />
    <!-- white icon bubble top-right -->
    <span
      class="absolute z-10 flex items-center justify-center"
      :style="{
        top: '16px',
        right: '16px',
        width: '38px',
        height: '38px',
        borderRadius: '11px',
        background: 'rgba(255,255,255,0.6)',
        fontSize: '18px',
      }"
    >{{ icon }}</span>

    <div class="relative z-10">
      <div
        class="font-display font-extrabold leading-none"
        :style="{ fontSize: '32px', color: t.text }"
      >{{ value }}</div>
      <div
        class="mt-[8px] font-medium"
        :style="{ fontSize: '14px', color: t.label }"
      >{{ label }}</div>
    </div>
  </div>
</template>
