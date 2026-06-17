<script setup lang="ts">
interface Course {
  title: string
  level: string
  status: 'active' | 'locked'
  slug: string
  unlock_hint?: string
  doneCount?: number
  totalCount?: number
  percent?: number
}

const props = defineProps<{
  course: Course
}>()
</script>

<template>
  <!-- ACTIVE -->
  <NuxtLink
    v-if="course.status === 'active'"
    :to="`/kurse/${course.slug}`"
    class="group flex flex-col overflow-hidden border border-border bg-surface no-underline shadow-card transition-all duration-200 hover:-translate-y-[3px] hover:shadow-elevated"
    style="border-radius: 18px"
  >
    <!-- cover -->
    <div
      class="relative overflow-hidden"
      style="height: 120px; background: linear-gradient(135deg,#0E7A70,#12B5A5)"
    >
      <LightCircles :circles="[{ size: 150, top: '-50px', right: '-40px', opacity: 0.1 }]" />
      <span
        class="absolute z-10 font-mono font-bold text-white/90"
        style="top: 16px; left: 18px; font-size: 18px"
      >{ }</span>
      <span
        class="absolute z-10 font-display font-extrabold text-white"
        style="bottom: 14px; left: 18px; right: 18px; font-size: 22px; line-height: 1.15"
      >{{ course.title }}</span>
    </div>

    <!-- body -->
    <div class="flex flex-1 flex-col gap-[14px]" style="padding: 18px">
      <div class="flex flex-wrap gap-[8px]">
        <span
          class="rounded-pill bg-teal-soft px-[12px] py-[4px] font-semibold text-teal-700"
          style="font-size: 12.5px"
        >{{ course.level }}</span>
        <span
          class="rounded-pill bg-teal-soft px-[12px] py-[4px] font-semibold text-teal-700"
          style="font-size: 12.5px"
        >{{ course.totalCount }} Lektionen</span>
      </div>

      <div class="flex flex-col gap-[8px]">
        <ProgressBar :percent="course.percent ?? 0" variant="teal" />
        <span class="font-medium text-text-muted" style="font-size: 13px">
          {{ course.percent }} % · {{ course.doneCount }} / {{ course.totalCount }} Lektionen
        </span>
      </div>

      <span
        class="mt-auto flex w-full items-center justify-center rounded-pill bg-teal-600 px-[16px] py-[11px] font-semibold text-white shadow-btn transition-colors group-hover:bg-teal-700"
        style="font-size: 14px"
      >Weiterlernen →</span>
    </div>
  </NuxtLink>

  <!-- LOCKED -->
  <div
    v-else
    class="flex cursor-default flex-col overflow-hidden border bg-surface opacity-[0.85]"
    style="border-radius: 18px; border-color: #E8F0EE"
  >
    <!-- muted cover -->
    <div
      class="relative flex items-center justify-center overflow-hidden"
      style="height: 120px; background: linear-gradient(135deg,#A9C6C0,#C3D8D3)"
    >
      <span class="text-white/90" style="font-size: 30px">🔒</span>
    </div>

    <!-- body -->
    <div class="flex flex-1 flex-col gap-[12px]" style="padding: 18px">
      <span
        class="self-start rounded-pill bg-teal-soft px-[12px] py-[4px] font-semibold text-text-muted"
        style="font-size: 12.5px"
      >{{ course.level }}</span>
      <span class="font-display font-extrabold text-text" style="font-size: 20px">{{ course.title }}</span>
      <span class="font-medium text-text-muted" style="font-size: 13.5px">{{ course.unlock_hint }}</span>
    </div>
  </div>
</template>
