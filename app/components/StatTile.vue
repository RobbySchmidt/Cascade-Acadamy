<script setup lang="ts">
defineProps<{
  value: string
  label: string
}>()
</script>

<template>
  <div
    class="border border-border bg-surface p-[20px]"
    style="border-radius: 16px"
  >
    <div
      class="font-display font-extrabold leading-none text-text"
      style="font-size: 28px"
    >{{ value }}</div>
    <div
      class="mt-[8px] font-medium text-text-faint"
      style="font-size: 14px"
    >{{ label }}</div>
  </div>
</template>
