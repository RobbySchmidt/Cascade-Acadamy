<script setup lang="ts">
interface Lesson {
  id: string | number
  title: string
  type: 'lesen' | 'uebung'
}

const props = defineProps<{
  lesson: Lesson
  status: 'done' | 'current' | 'locked'
}>()

const emit = defineEmits<{
  (e: 'select', id: Lesson['id']): void
}>()

const typeLabel = computed(() => props.lesson.type === 'lesen' ? 'Lesen' : 'Übung')

function onClick() {
  if (props.status === 'locked') return
  emit('select', props.lesson.id)
}
</script>

<template>
  <!-- DONE -->
  <button
    v-if="status === 'done'"
    type="button"
    class="flex w-full items-center gap-[14px] border border-border bg-surface px-[16px] py-[13px] text-left shadow-card transition hover:border-teal-soft-border"
    style="border-radius: 14px"
    @click="onClick"
  >
    <span
      class="flex shrink-0 items-center justify-center rounded-full text-white"
      style="width: 26px; height: 26px; background: #2BB673; font-size: 14px"
    >✓</span>
    <span class="flex-1 font-medium text-text" style="font-size: 15px">{{ lesson.title }}</span>
    <span
      class="shrink-0 rounded-pill bg-teal-soft px-[12px] py-[4px] font-semibold text-text-muted"
      style="font-size: 12.5px"
    >{{ typeLabel }}</span>
  </button>

  <!-- CURRENT -->
  <button
    v-else-if="status === 'current'"
    type="button"
    class="flex w-full items-center gap-[14px] bg-surface px-[16px] py-[13px] text-left"
    style="border-radius: 14px; border: 2px solid #12B5A5; box-shadow: 0 0 0 4px rgba(18,181,165,0.12), 0 10px 24px -18px rgba(31,42,40,0.22)"
    @click="onClick"
  >
    <span
      class="flex shrink-0 items-center justify-center rounded-full"
      style="width: 26px; height: 26px; border: 2px solid #12B5A5; color: #12B5A5; font-size: 11px"
    >▶</span>
    <span class="flex-1">
      <span class="block font-semibold text-text" style="font-size: 15px">{{ lesson.title }}</span>
      <span class="block font-medium text-teal-600" style="font-size: 13px">Hier geht's weiter</span>
    </span>
    <span
      class="shrink-0 rounded-pill bg-teal-600 px-[16px] py-[8px] font-semibold text-white shadow-btn"
      style="font-size: 13.5px"
    >Starten →</span>
  </button>

  <!-- LOCKED -->
  <div
    v-else
    class="flex w-full cursor-default items-center gap-[14px] border-2 border-dashed bg-surface-alt px-[16px] py-[13px] opacity-75"
    style="border-radius: 14px; border-color: #CFE0DC"
  >
    <span
      class="flex shrink-0 items-center justify-center rounded-full"
      style="width: 26px; height: 26px; background: #E8F0EE; color: #8A9794; font-size: 12px"
    >🔒</span>
    <span class="flex-1 font-medium text-text-faint" style="font-size: 15px">{{ lesson.title }}</span>
    <span class="shrink-0 font-semibold text-text-faint" style="font-size: 12.5px">gesperrt</span>
  </div>
</template>
