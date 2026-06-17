<script setup lang="ts">
interface Assertion { selector: string; prop: string; expected: string }

interface Lesson {
  id: number
  title: string
  type: string
  task: string
  html: string
  css_starter: string
  solution: string
  hint: string
  assertions: Assertion[]
  sort: number
  chapter: number
  course: number
}

interface LessonResponse {
  lesson: Lesson
  courseSlug: string | null
  courseTitle: string | null
  chapterTitle: string | null
  index: number
  total: number
  nextLessonId: number | null
}

const route = useRoute()
const { isGuest } = useAuth()
const { markDone } = useGuestProgress()

const { data, error } = await useFetch<LessonResponse>(() => '/api/lessons/' + route.params.id)

const lesson = computed(() => data.value?.lesson)
const courseSlug = computed(() => data.value?.courseSlug ?? '')
const courseTitle = computed(() => data.value?.courseTitle ?? '')
const chapterTitle = computed(() => data.value?.chapterTitle ?? '')
const index = computed(() => data.value?.index ?? 0)
const total = computed(() => data.value?.total ?? 0)
const nextLessonId = computed(() => data.value?.nextLessonId ?? null)

const percent = computed(() => total.value ? Math.round((index.value / total.value) * 100) : 0)

// editor state
const css = ref(lesson.value?.css_starter || '')
const codeTheme = ref<'light' | 'dark'>('dark')

interface CheckResult { selector: string; prop: string; expected: string; actual: string; passed: boolean }
const results = ref<CheckResult[]>([])
const hasChecked = ref(false)
const showHint = ref(false)

const preview = ref<{ getDoc: () => Document | null | undefined } | null>(null)

// re-init css if the lesson data changes (e.g. navigating between lessons)
watch(() => lesson.value?.id, () => {
  css.value = lesson.value?.css_starter || ''
  results.value = []
  hasChecked.value = false
  showHint.value = false
})

const assertions = computed<Assertion[]>(() => lesson.value?.assertions ?? [])

const allPassed = computed(() => {
  if (lesson.value?.type === 'lesen') return true
  if (assertions.value.length === 0) return true
  return hasChecked.value && results.value.length > 0 && results.value.every(r => r.passed)
})

function runCheck() {
  if (lesson.value?.type === 'lesen' || assertions.value.length === 0) {
    results.value = []
    hasChecked.value = true
    return
  }
  const doc = preview.value?.getDoc()
  if (!doc) {
    hasChecked.value = true
    return
  }
  results.value = evalAssertions(doc, assertions.value)
  hasChecked.value = true
}

function showSolution() {
  if (lesson.value?.solution != null) css.value = lesson.value.solution
}

async function markComplete() {
  if (!lesson.value) return
  try {
    await $fetch('/api/progress', { method: 'POST', body: { lessonId: lesson.value.id } })
  } catch {
    // ignore network errors; still record locally for guests
  }
  if (isGuest.value) markDone(lesson.value.id)
}

async function goNext() {
  await markComplete()
  if (nextLessonId.value != null) {
    await navigateTo('/lektion/' + nextLessonId.value)
  } else {
    await navigateTo('/kurse/' + courseSlug.value)
  }
}

function goBack() {
  navigateTo('/kurse/' + courseSlug.value)
}

// split task on backticks -> alternating text / code chip
interface TaskPart { text: string; code: boolean }
const taskParts = computed<TaskPart[]>(() => {
  const t = lesson.value?.task ?? ''
  return t.split('`').map((segment, i) => ({ text: segment, code: i % 2 === 1 }))
})
</script>

<template>
  <div>
    <!-- error -->
    <div v-if="error || !lesson" class="flex flex-col items-start" style="gap: 14px">
      <h1 class="font-display font-bold text-text" style="font-size: 26px">Lektion nicht gefunden</h1>
      <NuxtLink to="/kurse" class="font-semibold text-teal-700 no-underline">← Alle Kurse</NuxtLink>
    </div>

    <div
      v-else
      class="overflow-hidden border border-border bg-surface shadow-elevated"
      style="border-radius: 18px"
    >
      <!-- ===== TOP BAR ===== -->
      <div class="flex items-center justify-between border-b border-border" style="padding: 18px 22px; gap: 16px">
        <!-- left: back + breadcrumb + title -->
        <div class="flex min-w-0 items-center" style="gap: 14px">
          <button
            type="button"
            class="flex shrink-0 items-center justify-center border border-border bg-surface text-text-muted transition-colors hover:text-text"
            style="width: 38px; height: 38px; border-radius: 10px; font-size: 16px"
            aria-label="Zurück"
            @click="goBack"
          >←</button>
          <div class="min-w-0">
            <div class="truncate text-text-muted" style="font-size: 13px">
              {{ courseTitle }} <span class="text-text-faint">›</span> {{ chapterTitle }}
            </div>
            <h1 class="truncate font-display font-bold text-text" style="font-size: 20px; line-height: 1.2; letter-spacing: -0.3px">
              {{ lesson.title }}
            </h1>
          </div>
        </div>

        <!-- right: theme switch + progress + close -->
        <div class="flex shrink-0 items-center" style="gap: 18px">
          <div class="flex items-center" style="gap: 10px">
            <span class="text-text-muted" style="font-size: 13px">Editor</span>
            <div
              class="flex items-center bg-bg"
              style="border-radius: 999px; padding: 3px; gap: 2px"
            >
              <button
                type="button"
                class="rounded-pill font-semibold transition-colors"
                :class="codeTheme === 'light' ? 'bg-teal-700 text-white' : 'text-text-muted'"
                style="padding: 6px 13px; font-size: 13px"
                @click="codeTheme = 'light'"
              >☀ Hell</button>
              <button
                type="button"
                class="rounded-pill font-semibold transition-colors"
                :class="codeTheme === 'dark' ? 'bg-teal-700 text-white' : 'text-text-muted'"
                style="padding: 6px 13px; font-size: 13px"
                @click="codeTheme = 'dark'"
              >☾ Dunkel</button>
            </div>
          </div>

          <div class="flex items-center" style="gap: 10px">
            <span class="shrink-0 whitespace-nowrap text-text-muted" style="font-size: 13px">
              Lektion {{ index }} / {{ total }}
            </span>
            <ProgressBar :percent="percent" style="width: 130px" />
          </div>

          <button
            type="button"
            class="flex shrink-0 items-center justify-center border border-border bg-surface text-text-muted transition-colors hover:text-text"
            style="width: 38px; height: 38px; border-radius: 10px; font-size: 16px"
            aria-label="Schließen"
            @click="goBack"
          >✕</button>
        </div>
      </div>

      <!-- ===== TASK STRIP ===== -->
      <div
        class="bg-teal-soft"
        style="border-bottom: 1px solid #CDEDE8; padding: 16px 22px"
      >
        <div class="flex items-start justify-between" style="gap: 16px">
          <div class="flex items-start" style="gap: 13px">
            <span
              class="flex shrink-0 items-center justify-center bg-teal-600 text-white"
              style="width: 30px; height: 30px; border-radius: 9px; font-size: 15px"
            >✦</span>
            <div>
              <div
                class="font-semibold uppercase text-teal-700"
                style="font-size: 11.5px; letter-spacing: 1px; margin-bottom: 3px"
              >Deine Aufgabe</div>
              <p class="text-text" style="font-size: 15.5px; line-height: 1.5">
                <template v-for="(part, i) in taskParts" :key="i">
                  <code
                    v-if="part.code"
                    class="bg-white/70 font-mono text-teal-700"
                    style="border-radius: 5px; padding: 2px 6px; font-size: 13.5px"
                  >{{ part.text }}</code>
                  <span v-else>{{ part.text }}</span>
                </template>
              </p>
              <p
                v-if="showHint && lesson.hint"
                class="text-text-muted"
                style="font-size: 13.5px; line-height: 1.5; margin-top: 8px"
              >{{ lesson.hint }}</p>
            </div>
          </div>

          <button
            type="button"
            class="flex shrink-0 items-center gap-[6px] border border-border bg-surface font-semibold text-text transition-colors hover:bg-bg"
            style="border-radius: 10px; padding: 8px 14px; font-size: 13.5px"
            @click="showHint = !showHint"
          >💡 Hinweis</button>
        </div>
      </div>

      <!-- ===== 2-COLUMN BODY ===== -->
      <div class="grid lesson-body" style="grid-template-columns: 55% 45%">
        <!-- LEFT: editor -->
        <div class="flex flex-col" style="padding: 18px; gap: 18px">
          <div>
            <div class="flex items-center gap-[8px]" style="margin-bottom: 8px">
              <span class="font-semibold text-text" style="font-size: 13.5px">HTML</span>
              <span
                class="rounded-pill bg-bg font-medium text-text-muted"
                style="padding: 3px 10px; font-size: 11.5px"
              >vorgegeben</span>
            </div>
            <ClientOnly>
              <LessonCodeEditor :model-value="lesson.html" :theme="codeTheme" readonly />
              <template #fallback>
                <pre class="overflow-auto font-mono text-text-muted" style="background:#16162A;color:#8E89A8;border-radius:10px;padding:12px;font-size:13px;min-height:60px">{{ lesson.html }}</pre>
              </template>
            </ClientOnly>
          </div>

          <div>
            <div class="flex items-center gap-[8px]" style="margin-bottom: 8px">
              <span class="font-semibold text-text" style="font-size: 13.5px">CSS</span>
              <span
                class="rounded-pill bg-teal-soft font-medium text-teal-700"
                style="padding: 3px 10px; font-size: 11.5px"
              >dein Code</span>
            </div>
            <ClientOnly>
              <LessonCodeEditor v-model="css" :theme="codeTheme" />
              <template #fallback>
                <pre class="overflow-auto font-mono" style="background:#1B1A2E;color:#E6E3F5;border-radius:10px;padding:12px;font-size:13px;min-height:120px">{{ css }}</pre>
              </template>
            </ClientOnly>
          </div>
        </div>

        <!-- RIGHT: preview + check -->
        <div class="flex flex-col border-l border-border" style="padding: 18px; gap: 18px">
          <ClientOnly>
            <LessonLivePreview ref="preview" :html="lesson.html" :css="css" />
            <template #fallback>
              <div>
                <div
                  class="font-semibold uppercase text-text-faint"
                  style="font-size: 11.5px; letter-spacing: 1px; margin-bottom: 10px"
                >Live-Vorschau</div>
                <div class="border border-border bg-surface" style="border-radius: 12px; min-height: 200px" />
              </div>
            </template>
          </ClientOnly>

          <LessonCheckPanel :results="results" :has-checked="hasChecked" @check="runCheck" />
        </div>
      </div>

      <!-- ===== FOOTER ===== -->
      <div class="flex items-center justify-between border-t border-border" style="padding: 16px 22px; gap: 16px">
        <button
          type="button"
          class="font-medium text-text-muted transition-colors hover:text-text"
          style="font-size: 14px"
          @click="goBack"
        >← Zurück</button>

        <div class="flex items-center" style="gap: 18px">
          <button
            type="button"
            class="font-medium text-teal-700 transition-colors hover:text-teal-600"
            style="font-size: 14px"
            @click="showSolution"
          >Lösung anzeigen</button>
          <button
            type="button"
            class="rounded-[10px] font-semibold text-white transition-colors"
            :class="allPassed ? 'bg-teal-600 hover:bg-teal-700' : 'cursor-not-allowed bg-teal-600/40'"
            style="padding: 10px 20px; font-size: 14px"
            :disabled="!allPassed"
            @click="goNext"
          >Weiter →</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media (max-width: 860px) {
  .lesson-body {
    grid-template-columns: 1fr !important;
  }
  .lesson-body > div + div {
    border-left: none;
    border-top: 1px solid var(--color-border);
  }
}
</style>
