<script setup lang="ts">
// Controlled shortcut recorder. Click to record, then press a key combo.
// Emits the canonical shortcut string only when it is valid and conflict-free.
import { onBeforeUnmount, ref } from 'vue'
import type { ToolName } from '../../shared/messages'
import { eventToShortcut, findShortcutConflict, formatShortcut } from '../../shared/shortcuts'

const props = defineProps<{
  modelValue: string
  /** Current map of all tool shortcuts, used to detect conflicts. */
  shortcuts: Record<ToolName, string>
  /** Which tool this recorder edits (excluded from conflict checks). */
  tool: ToolName
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const recording = ref(false)
const message = ref<string | null>(null)

const MODIFIER_KEYS = ['Shift', 'Control', 'Alt', 'Meta']

function onKeydown(event: KeyboardEvent): void {
  event.preventDefault()
  event.stopPropagation()

  if (event.key === 'Escape') {
    stopRecording()
    return
  }

  // Wait for a non-modifier "final" key.
  if (MODIFIER_KEYS.includes(event.key)) return

  const combo = eventToShortcut(event)
  if (!combo) {
    message.value = 'Use Ctrl/Cmd or Alt with a key'
    return
  }

  const conflict = findShortcutConflict(props.shortcuts, combo, props.tool)
  if (conflict) {
    message.value =
      conflict === 'master' ? 'Reserved for the master toggle' : `Already used by ${conflict}`
    stopRecording()
    return
  }

  emit('update:modelValue', combo)
  stopRecording()
}

function startRecording(): void {
  message.value = null
  recording.value = true
  window.addEventListener('keydown', onKeydown, true)
}

function stopRecording(): void {
  recording.value = false
  window.removeEventListener('keydown', onKeydown, true)
}

function toggleRecording(): void {
  if (recording.value) stopRecording()
  else startRecording()
}

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown, true)
})
</script>

<template>
  <div class="space-y-1">
    <button
      type="button"
      class="w-full rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-150"
      :class="[
        recording
          ? 'border-cyan-400/70 bg-cyan-400/15 text-cyan-100 shadow-[0_0_12px_rgba(34,211,238,0.25)]'
          : 'border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-zinc-600 hover:bg-zinc-800',
      ]"
      @click="toggleRecording"
    >
      <span v-if="recording" class="animate-pulse">Press a key combo… (Esc cancels)</span>
      <span v-else class="font-mono tracking-wide">{{ formatShortcut(modelValue) }}</span>
    </button>

    <p v-if="message" class="text-[11px] text-rose-300">{{ message }}</p>
  </div>
</template>
