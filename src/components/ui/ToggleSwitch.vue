<script setup lang="ts">
// Accessible toggle switch with smooth CSS transitions.
defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

function onChange(event: Event): void {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.checked)
}
</script>

<template>
  <label class="relative inline-flex cursor-pointer items-center">
    <input
      :checked="modelValue"
      type="checkbox"
      class="peer sr-only"
      @change="onChange"
    />
    <!-- Track -->
    <span
      class="h-6 w-11 rounded-full bg-zinc-700 shadow-inner transition-colors duration-200 peer-checked:bg-cyan-500 peer-focus-visible:ring-2 peer-focus-visible:ring-cyan-400/50"
    />
    <!-- Thumb -->
    <span
      class="absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform duration-200 peer-checked:translate-x-5"
    />
  </label>
</template>
