<script setup lang="ts">
import { Check } from 'lucide-vue-next'

interface CheckResult {
  selector: string
  prop: string
  expected: string
  passed: boolean
}

const props = defineProps<{
  results: CheckResult[]
  hasChecked: boolean
}>()

const emit = defineEmits<{ check: [] }>()

const total = computed(() => props.results.length)
const passedCount = computed(() => props.results.filter(r => r.passed).length)
</script>

<template>
  <div class="bg-inset border border-border" style="border-radius: 14px; padding: 16px 18px">
    <!-- header -->
    <div class="flex items-center justify-between" style="margin-bottom: 12px">
      <span
        class="font-semibold uppercase text-text"
        style="font-size: 11.5px; letter-spacing: 1px"
      >Prüfung</span>
      <span class="font-medium text-text-muted" style="font-size: 13px">
        {{ passedCount }} / {{ total }} erfüllt
      </span>
    </div>

    <!-- rows -->
    <div class="flex flex-col" style="gap: 10px; margin-bottom: 14px">
      <div
        v-for="(r, i) in results"
        :key="i"
        class="flex items-center gap-[10px] font-mono"
        style="font-size: 13px"
      >
        <!-- circle -->
        <span
          v-if="r.passed"
          class="flex shrink-0 items-center justify-center rounded-full text-on-teal"
          style="width: 19px; height: 19px; background: #2BD68A"
        ><Check :size="12" :stroke-width="3" /></span>
        <span
          v-else
          class="shrink-0 rounded-full"
          style="width: 19px; height: 19px; border: 2px solid rgba(255,255,255,0.12); box-sizing: border-box"
        />

        <!-- Until a criterion passes we reveal only WHAT is checked (selector · prop),
             not the expected value — otherwise the panel would hand out the answer. -->
        <span :class="r.passed ? 'text-text-body' : 'text-text-muted'">
          {{ r.selector }} · {{ r.prop }}<template v-if="r.passed">: {{ r.expected }}</template>
        </span>
      </div>

      <p
        v-if="total === 0"
        class="text-text-muted"
        style="font-size: 13px"
      >Keine Prüfkriterien für diese Lektion.</p>
    </div>

    <!-- button -->
    <button
      type="button"
      class="w-full rounded-[10px] bg-teal-600 font-semibold text-on-teal transition-colors hover:bg-teal-700"
      style="padding: 11px 16px; font-size: 14px"
      @click="emit('check')"
    >Code prüfen</button>
  </div>
</template>
