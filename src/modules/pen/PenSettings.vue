<script setup lang="ts">
// Pen tool settings: color picker + numeric width stepper.
import { storeToRefs } from 'pinia'
import { PenSquare } from 'lucide-vue-next'
import { useAnnotationStore } from '../../stores/annotation'
import ColorSwatch from '../../components/ui/ColorSwatch.vue'
import StepControl from '../../components/ui/StepControl.vue'
import KeyboardShortcutRecorder from '../../components/ui/KeyboardShortcutRecorder.vue'

const store = useAnnotationStore()
const { penColor, penWidth, toolShortcuts } = storeToRefs(store)
</script>

<template>
  <section class="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 backdrop-blur">
    <!-- Color -->
    <div>
      <div class="mb-2 flex items-center justify-between">
        <p class="text-sm font-medium text-zinc-100">Pen Color</p>
        <PenSquare class="size-4 text-blue-300" />
      </div>
      <div class="flex items-center gap-3">
        <ColorSwatch
          :model-value="penColor"
          @update:model-value="(v) => void store.setPenColor(v)"
        />
        <p class="text-xs font-mono uppercase tracking-wide text-zinc-300">{{ penColor }}</p>
      </div>
    </div>

    <!-- Width -->
    <div>
      <div class="mb-2 flex items-center justify-between">
        <p class="text-sm font-medium text-zinc-100">Pen Width</p>
        <span class="text-xs tabular-nums text-zinc-400">{{ penWidth }}px</span>
      </div>
      <StepControl
        :model-value="penWidth"
        :min="1"
        :max="20"
        color="#60a5fa"
        @update:model-value="(v) => void store.setPenWidth(v)"
      />
    </div>

    <!-- Toggle shortcut -->
    <div class="border-t border-zinc-800 pt-3">
      <div class="mb-2 flex items-center justify-between">
        <p class="text-sm font-medium text-zinc-100">Shortcut</p>
        <span class="text-[11px] text-zinc-400">Toggle this tool</span>
      </div>
      <KeyboardShortcutRecorder
        :model-value="toolShortcuts.pen"
        :shortcuts="toolShortcuts"
        tool="pen"
        @update:model-value="(v) => void store.setToolShortcut('pen', v)"
      />
    </div>
  </section>
</template>
