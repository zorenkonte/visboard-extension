<script setup lang="ts">
// Reusable color picker: renders a styled swatch that opens the native <input type="color">.
defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function onInput(event: Event): void {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <label
    class="relative block size-12 cursor-pointer overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950 transition hover:border-zinc-500"
  >
    <input
      :value="modelValue"
      type="color"
      class="absolute inset-0 size-full cursor-pointer opacity-0"
      @input="onInput"
    />
    <span
      class="pointer-events-none absolute inset-1 rounded-lg transition-all duration-150"
      :style="{ backgroundColor: modelValue }"
    />
  </label>
</template>
