<script setup lang="ts">
import { ArrowLeft, ArrowRight, ChevronRight, Sun, Moon, X, Sparkles, Lightbulb } from 'lucide-vue-next'

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
  prevLessonId: number | null
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
const prevLessonId = computed(() => data.value?.prevLessonId ?? null)

const percent = computed(() => total.value ? Math.round((index.value / total.value) * 100) : 0)

// editor state
const css = ref(lesson.value?.css_starter || '')
const codeTheme = ref<'light' | 'dark'>('dark')

interface CheckResult { selector: string; prop: string; expected: string; actual: string; passed: boolean }
const results = ref<CheckResult[]>([])
const hasChecked = ref(false)
const showHint = ref(false)

// "Lösung anzeigen" toggle — back up the user's code so it can be restored.
const solutionShown = ref(false)
const userCssBackup = ref<string | null>(null)

const preview = ref<{ getDoc: () => Document | null | undefined } | null>(null)

// re-init css if the lesson data changes (e.g. navigating between lessons)
watch(() => lesson.value?.id, () => {
  css.value = lesson.value?.css_starter || ''
  results.value = []
  hasChecked.value = false
  showHint.value = false
  solutionShown.value = false
  userCssBackup.value = null
})

const assertions = computed<Assertion[]>(() => lesson.value?.assertions ?? [])

// Reading lessons (type "lesen" / no assertions) only explain — no check or solution.
const hasCheck = computed(() => lesson.value?.type !== 'lesen' && assertions.value.length > 0)
const canShowSolution = computed(() => hasCheck.value && lesson.value?.solution != null)

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

function toggleSolution() {
  if (!lesson.value) return
  if (solutionShown.value) {
    // restore the user's own code
    css.value = userCssBackup.value ?? lesson.value.css_starter ?? ''
    userCssBackup.value = null
    solutionShown.value = false
  } else {
    if (lesson.value.solution == null) return
    userCssBackup.value = css.value
    css.value = lesson.value.solution
    solutionShown.value = true
  }
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

// Top arrow / ✕ close the editor back to the course detail.
function goBack() {
  navigateTo('/kurse/' + courseSlug.value)
}

// Footer "← Zurück" steps one lesson back; on the first lesson it falls back
// to the course detail.
function goPrev() {
  if (prevLessonId.value != null) {
    navigateTo('/lektion/' + prevLessonId.value)
  } else {
    navigateTo('/kurse/' + courseSlug.value)
  }
}

// split task on backticks -> alternating text / code chip
interface TaskPart { text: string; code: boolean }
function splitOnBackticks(text: string): TaskPart[] {
  return text.split('`').map((segment, i) => ({ text: segment, code: i % 2 === 1 }))
}

const taskParts = computed<TaskPart[]>(() => splitOnBackticks(lesson.value?.task ?? ''))
const hintParts = computed<TaskPart[]>(() => splitOnBackticks(lesson.value?.hint ?? ''))
</script>

<template>
  <div>
    <!-- error -->
    <div v-if="error || !lesson" class="flex flex-col items-start" style="gap: 14px">
      <h1 class="font-display font-bold text-text" style="font-size: 26px">Lektion nicht gefunden</h1>
      <NuxtLink to="/kurse" class="inline-flex items-center gap-[6px] font-semibold text-teal-700 no-underline"><ArrowLeft :size="16" /> Alle Kurse</NuxtLink>
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
            style="width: 38px; height: 38px; border-radius: 10px"
            aria-label="Zurück"
            @click="goBack"
          ><ArrowLeft :size="18" /></button>
          <div class="min-w-0">
            <div class="flex items-center gap-[5px] truncate text-text-muted" style="font-size: 13px">
              {{ courseTitle }} <ChevronRight :size="14" class="shrink-0 text-text-faint" /> {{ chapterTitle }}
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
              class="flex items-center bg-inset-2"
              style="border-radius: 999px; padding: 3px; gap: 2px"
            >
              <button
                type="button"
                class="flex items-center gap-[6px] rounded-pill font-semibold transition-colors"
                :class="codeTheme === 'light' ? 'bg-teal-600 text-on-teal' : 'text-text-faint'"
                style="padding: 6px 13px; font-size: 13px"
                @click="codeTheme = 'light'"
              ><Sun :size="14" /> Hell</button>
              <button
                type="button"
                class="flex items-center gap-[6px] rounded-pill font-semibold transition-colors"
                :class="codeTheme === 'dark' ? 'bg-teal-600 text-on-teal' : 'text-text-faint'"
                style="padding: 6px 13px; font-size: 13px"
                @click="codeTheme = 'dark'"
              ><Moon :size="14" /> Dunkel</button>
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
            style="width: 38px; height: 38px; border-radius: 10px"
            aria-label="Schließen"
            @click="goBack"
          ><X :size="18" /></button>
        </div>
      </div>

      <!-- ===== TASK STRIP ===== -->
      <div
        class="bg-teal-soft"
        style="border-bottom: 1px solid rgba(18,181,165,0.25); padding: 16px 22px"
      >
        <div class="flex items-start justify-between" style="gap: 16px">
          <div class="flex items-start" style="gap: 13px">
            <span
              class="flex shrink-0 items-center justify-center bg-teal-600 text-on-teal"
              style="width: 30px; height: 30px; border-radius: 9px"
            ><Sparkles :size="16" /></span>
            <div>
              <div
                class="font-semibold uppercase text-teal-500"
                style="font-size: 11.5px; letter-spacing: 1px; margin-bottom: 3px"
              >Deine Aufgabe</div>
              <p class="text-text-body" style="font-size: 15.5px; line-height: 1.5">
                <template v-for="(part, i) in taskParts" :key="i">
                  <code
                    v-if="part.code"
                    class="bg-inset font-mono text-teal-500"
                    style="border-radius: 5px; padding: 2px 6px; font-size: 13.5px"
                  >{{ part.text }}</code>
                  <span v-else>{{ part.text }}</span>
                </template>
              </p>
              <p
                v-if="showHint && lesson.hint"
                class="text-text-muted"
                style="font-size: 13.5px; line-height: 1.5; margin-top: 8px"
              >
                <template v-for="(part, i) in hintParts" :key="i">
                  <code
                    v-if="part.code"
                    class="bg-inset font-mono text-teal-500"
                    style="border-radius: 5px; padding: 1px 5px; font-size: 12.5px"
                  >{{ part.text }}</code>
                  <span v-else>{{ part.text }}</span>
                </template>
              </p>
            </div>
          </div>

          <button
            type="button"
            class="flex shrink-0 items-center gap-[6px] border border-border bg-inset font-semibold text-teal-700 transition-colors hover:bg-inset-2"
            style="border-radius: 10px; padding: 8px 14px; font-size: 13.5px"
            @click="showHint = !showHint"
          ><Lightbulb :size="15" /> Hinweis</button>
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
                <pre class="overflow-auto font-mono" style="background:#0E1C19;color:#557068;border:1px solid #1E332E;border-radius:10px;padding:12px;font-size:13px;min-height:60px">{{ lesson.html }}</pre>
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
                <pre class="overflow-auto font-mono" style="background:#0E1C19;color:#DDEBE8;border:1px solid #1E332E;border-radius:10px;padding:12px;font-size:13px;min-height:120px">{{ css }}</pre>
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
                <div class="border border-border" style="border-radius: 12px; min-height: 200px; background: #F3FAF8" />
              </div>
            </template>
          </ClientOnly>

          <LessonCheckPanel v-if="hasCheck" :results="results" :has-checked="hasChecked" @check="runCheck" />
        </div>
      </div>

      <!-- ===== FOOTER ===== -->
      <div class="flex items-center justify-between border-t border-border" style="padding: 16px 22px; gap: 16px">
        <button
          type="button"
          class="flex items-center gap-[6px] font-medium text-text-muted transition-colors hover:text-text"
          style="font-size: 14px"
          @click="goPrev"
        ><ArrowLeft :size="16" /> Zurück</button>

        <div class="flex items-center" style="gap: 18px">
          <button
            v-if="canShowSolution"
            type="button"
            class="font-medium text-teal-700 transition-colors hover:text-teal-600"
            style="font-size: 14px"
            @click="toggleSolution"
          >{{ solutionShown ? 'Lösung verbergen' : 'Lösung anzeigen' }}</button>
          <button
            type="button"
            class="flex items-center gap-[6px] rounded-[10px] font-semibold text-on-teal transition-colors"
            :class="allPassed ? 'bg-teal-600 hover:bg-teal-700' : 'cursor-not-allowed bg-teal-600/40'"
            style="padding: 10px 20px; font-size: 14px"
            :disabled="!allPassed"
            @click="goNext"
          >Weiter <ArrowRight :size="16" /></button>
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
