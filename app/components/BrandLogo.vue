<script setup lang="ts">
const props = withDefaults(defineProps<{
  white?: boolean
  size?: number
}>(), {
  white: false,
  size: 34,
})

// Bar fill: on the white/teal panel the bars are white; on the (dark) default
// chrome the teal square keeps dark bars per the handoff.
const barColor = props.white ? 'white' : '#06201C'
</script>

<template>
  <span class="inline-flex items-center gap-[10px] select-none">
    <span
      class="inline-flex flex-col items-start justify-center gap-[3px]"
      :style="{
        width: size + 'px',
        height: size + 'px',
        borderRadius: '11px',
        padding: '0 8px',
        background: white ? 'rgba(255,255,255,0.18)' : '#12B5A5',
      }"
    >
      <span :style="{ width: '18px', height: '3px', borderRadius: '99px', background: barColor, opacity: 1 }" />
      <span :style="{ width: '13px', height: '3px', borderRadius: '99px', background: barColor, opacity: 0.7 }" />
      <span :style="{ width: '8px', height: '3px', borderRadius: '99px', background: barColor, opacity: 0.45 }" />
    </span>
    <span
      class="font-display font-extrabold leading-none tracking-[-0.3px]"
      :style="{ fontSize: '20px' }"
    >
      <span :style="{ color: '#FFFFFF' }">Cascade</span>
      <span :style="{ color: white ? '#FFFFFF' : '#3FD9C9' }">&nbsp;Academy</span>
    </span>
  </span>
</template>
