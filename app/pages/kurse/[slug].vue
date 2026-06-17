<script setup lang="ts">
interface Lesson {
  id: number
  title: string
  type: 'lesen' | 'uebung'
  sort: number
  status: 'done' | 'current' | 'locked'
}

interface Chapter {
  id: number
  title: string
  sort: number
  lessons: Lesson[]
}

interface CourseDetail {
  course: {
    id: number
    title: string
    slug: string
    level: string
    description: string
    status: string
    unlock_hint?: string
    doneCount: number
    totalCount: number
    percent: number
    chapterCount: number
  }
  chapters: Chapter[]
}

const route = useRoute()
const { data, error } = await useFetch<CourseDetail>(() => '/api/courses/' + route.params.slug)

const course = computed(() => data.value?.course)
const chapters = computed(() => data.value?.chapters ?? [])

function chapterBadge(chapter: Chapter): { label: string; class: string } | null {
  if (chapter.lessons.length === 0) return null
  const allDone = chapter.lessons.every(l => l.status === 'done')
  if (allDone) return { label: 'abgeschlossen', class: 'bg-success-soft text-success' }
  const anyActive = chapter.lessons.some(l => l.status === 'done' || l.status === 'current')
  if (anyActive) return { label: 'in Arbeit', class: 'bg-teal-soft text-teal-700' }
  return null
}

function goToLesson(id: number | string) {
  navigateTo('/lektion/' + id)
}
</script>

<template>
  <div class="mx-auto max-w-[920px]">
    <!-- 404 -->
    <div v-if="error || !course" class="flex flex-col items-start" style="gap: 14px">
      <h1 class="font-display font-bold text-text" style="font-size: 26px">Kurs nicht gefunden</h1>
      <NuxtLink to="/kurse" class="font-semibold text-teal-700 no-underline">← Alle Kurse</NuxtLink>
    </div>

    <template v-else>
      <!-- back link -->
      <NuxtLink
        to="/kurse"
        class="inline-block font-medium text-text-muted no-underline transition-colors hover:text-text"
        style="font-size: 14px; margin-bottom: 16px"
      >← Alle Kurse</NuxtLink>

      <!-- HEADER BANNER -->
      <section
        class="relative overflow-hidden"
        style="border-radius: 20px; padding: 32px 36px; background: linear-gradient(135deg,#0E7A70,#12B5A5); box-shadow: 0 20px 44px -22px rgba(14,122,112,0.7)"
      >
        <LightCircles
          :circles="[{ size: 240, top: '-60px', right: '-50px', opacity: 0.10 }]"
        />

        <div class="relative z-10 flex flex-col" style="gap: 14px">
          <div class="flex flex-wrap" style="gap: 8px">
            <span
              class="rounded-pill bg-white/15 font-semibold text-white"
              style="padding: 5px 13px; font-size: 12.5px"
            >{{ course.level }}</span>
            <span
              class="rounded-pill bg-white/15 font-semibold text-white"
              style="padding: 5px 13px; font-size: 12.5px"
            >{{ course.totalCount }} Lektionen · {{ course.chapterCount }} Kapitel</span>
          </div>

          <h1
            class="font-display font-extrabold text-white"
            style="font-size: 30px; line-height: 1.15; letter-spacing: -0.5px"
          >{{ course.title }}</h1>

          <p class="text-white/85" style="font-size: 16px; line-height: 1.5; max-width: 640px">
            {{ course.description }}
          </p>

          <div class="flex items-center" style="gap: 16px; margin-top: 6px">
            <ProgressBar :percent="course.percent" variant="onTeal" class="flex-1" />
            <span class="shrink-0 font-medium text-white" style="font-size: 14px">
              {{ course.percent }} % · {{ course.doneCount }} / {{ course.totalCount }}
            </span>
          </div>
        </div>
      </section>

      <!-- CHAPTERS -->
      <div class="flex flex-col" style="gap: 28px; margin-top: 32px">
        <section v-for="chapter in chapters" :key="chapter.id" class="flex flex-col" style="gap: 14px">
          <div class="flex items-center" style="gap: 12px">
            <h2 class="font-display font-bold text-text" style="font-size: 18px; letter-spacing: -0.3px">{{ chapter.title }}</h2>
            <span
              v-if="chapterBadge(chapter)"
              class="rounded-pill font-semibold"
              :class="chapterBadge(chapter)!.class"
              style="padding: 4px 12px; font-size: 12.5px"
            >{{ chapterBadge(chapter)!.label }}</span>
          </div>

          <div class="flex flex-col gap-[9px]">
            <LessonRow
              v-for="lesson in chapter.lessons"
              :key="lesson.id"
              :lesson="lesson"
              :status="lesson.status"
              @select="goToLesson"
            />
          </div>
        </section>
      </div>
    </template>
  </div>
</template>
