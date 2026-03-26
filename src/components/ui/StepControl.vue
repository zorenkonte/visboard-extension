<script setup lang="ts">
// Numeric stepper with +/- buttons and a progress bar.
// Emits the clamped new value — does not mutate props directly.
import { computed } from 'vue'
import { Minus, Plus } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: number
  min?: number
  max?: number
  step?: number
  /** Progress bar fill color (CSS color string). Defaults to blue-400. */
  color?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const resolvedMin = computed(() => props.min ?? 1)
const resolvedMax = computed(() => props.max ?? 100)
const resolvedStep = computed(() => props.step ?? 1)
const progress = computed(() =>
  ((props.modelValue - resolvedMin.value) / (resolvedMax.value - resolvedMin.value)) * 100,
)

function decrement(): void {
  emit('update:modelValue', Math.max(resolvedMin.value, props.modelValue - resolvedStep.value))
}

function increment(): void {
  emit('update:modelValue', Math.min(resolvedMax.value, props.modelValue + resolvedStep.value))
}
</script>

<template>
  <div class="flex items-center gap-2">
    <button
      type="button"
      class="rounded-lg border border-zinc-700 bg-zinc-900 p-1 transition hover:border-zinc-600 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
      :disabled="modelValue <= resolvedMin"
      @click="decrement"
    >
      <Minus class="size-4 text-zinc-300" />
    </button>

    <div class="flex-1 h-2 overflow-hidden rounded-full bg-zinc-800">
      <div
        class="h-full rounded-full transition-all duration-150"
        :style="{ width: `${progress}%`, backgroundColor: color ?? '#60a5fa' }"
      />
    </div>

    <button
      type="button"
      class="rounded-lg border border-zinc-700 bg-zinc-900 p-1 transition hover:border-zinc-600 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
      :disabled="modelValue >= resolvedMax"
      @click="increment"
    >
      <Plus class="size-4 text-zinc-300" />
    </button>
  </div>
</template>
