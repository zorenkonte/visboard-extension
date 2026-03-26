<script setup lang="ts">
// Annotation mode card: enable/disable toggle + keyboard shortcut hint.
import { storeToRefs } from 'pinia'
import { useAnnotationStore } from '../../stores/annotation'
import ToggleSwitch from '../ui/ToggleSwitch.vue'

const store = useAnnotationStore()
const { enabled } = storeToRefs(store)
</script>

<template>
  <section class="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 backdrop-blur">
    <div class="mb-2 flex items-center justify-between">
      <div>
        <p class="text-sm font-medium text-zinc-100">Annotation Mode</p>
        <p class="text-xs text-zinc-400">Blocks page interactions while active</p>
      </div>
      <ToggleSwitch
        :model-value="enabled"
        @update:model-value="(v) => void store.setEnabled(v)"
      />
    </div>

    <!-- Keyboard shortcut hint -->
    <div class="rounded-lg border border-cyan-400/25 bg-cyan-400/5 px-2 py-1 text-[11px] text-cyan-200">
      Shortcut: <span class="font-semibold">Ctrl/Cmd + Shift + L</span>
    </div>
  </section>
</template>
