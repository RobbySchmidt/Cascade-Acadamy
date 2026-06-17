<script setup lang="ts">
interface Course {
  id: number
  title: string
  slug: string
  level: string
  description: string
  status: 'active' | 'locked'
  unlock_hint?: string
  sort: number
  doneCount: number
  totalCount: number
  percent: number
}

const { data: courses } = await useFetch<Course[]>('/api/courses')

const activeCourse = computed(() => courses.value?.find(c => c.status === 'active'))
const done = computed(() => activeCourse.value?.doneCount ?? 0)
const total = computed(() => activeCourse.value?.totalCount ?? 0)
</script>

<template>
  <div class="flex flex-col gap-[28px]">
    <!-- HERO -->
    <section
      class="relative overflow-hidden"
      style="border-radius: 22px; padding: 40px 44px; background: linear-gradient(135deg,#0E7A70,#12B5A5); box-shadow: 0 20px 44px -22px rgba(14,122,112,0.7)"
    >
      <LightCircles
        :circles="[
          { size: 280, top: '-80px', right: '-60px', opacity: 0.10 },
          { size: 220, bottom: '-130px', right: '90px', opacity: 0.08 },
        ]"
      />

      <div class="relative z-10 flex flex-col" style="gap: 16px">
        <span
          class="self-start rounded-pill bg-white/15 font-semibold uppercase tracking-wide text-white"
          style="padding: 6px 14px; font-size: 12px; letter-spacing: 0.6px"
        >CSS lernen by doing</span>

        <h1
          class="font-display font-extrabold text-white"
          style="font-size: 36px; line-height: 1.1; letter-spacing: -0.5px"
        >Schreib echtes CSS, sieh es sofort.</h1>

        <p class="text-white/85" style="font-size: 17px; line-height: 1.5; max-width: 620px">
          Kleine Lektionen, ein Code-Editor mit Live-Vorschau und automatischer Prüfung. Lerne in deinem Tempo.
        </p>

        <div class="flex flex-wrap items-center" style="gap: 18px; margin-top: 8px">
          <NuxtLink
            v-if="activeCourse"
            :to="`/kurse/${activeCourse.slug}`"
            class="flex items-center bg-white font-semibold text-teal-700 no-underline shadow-btn transition-transform hover:-translate-y-[1px]"
            style="border-radius: 11px; padding: 13px 22px; font-size: 15px"
          >Weiterlernen →</NuxtLink>
          <span class="font-semibold text-white/90" style="font-size: 15px">
            {{ done }} von {{ total }} Lektionen geschafft
          </span>
        </div>
      </div>
    </section>

    <!-- DEINE KURSE -->
    <section class="flex flex-col gap-[18px]">
      <div class="flex items-baseline justify-between">
        <h2 class="font-display font-bold text-text" style="font-size: 22px; letter-spacing: -0.3px">Deine Kurse</h2>
        <span class="font-medium text-text-muted" style="font-size: 14px">{{ courses?.length ?? 0 }} Kurse</span>
      </div>

      <div class="grid grid-cols-1 gap-[22px] md:grid-cols-2 lg:grid-cols-3">
        <CourseCard v-for="course in courses" :key="course.id" :course="course" />
      </div>
    </section>
  </div>
</template>
