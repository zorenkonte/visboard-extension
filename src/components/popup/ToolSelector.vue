<script setup lang="ts">
// Tool selector: renders a button grid for all available annotation tools.
import { storeToRefs } from 'pinia'
import { Crosshair, PenSquare, Shapes, Sticker } from 'lucide-vue-next'
import { useAnnotationStore } from '../../stores/annotation'
import type { ToolName } from '../../shared/messages'
import { formatShortcut } from '../../shared/shortcuts'

// Keep icon map here — it's pure presentational config, not business logic.
const toolMeta: Record<ToolName, { label: string; icon: typeof Crosshair }> = {
  laser:    { label: 'Laser',    icon: Crosshair  },
  pen:      { label: 'Pen',      icon: PenSquare  },
  shapes:   { label: 'Shapes',   icon: Shapes     },
  stickers: { label: 'Stickers', icon: Sticker    },
}

const store = useAnnotationStore()
const { currentTool, activeTool, toolOptions, toolShortcuts } = storeToRefs(store)
</script>

<template>
  <section class="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 backdrop-blur">
    <p class="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-400">Tools</p>

    <div class="grid grid-cols-2 gap-2">
      <button
        v-for="tool in toolOptions"
        :key="tool"
        type="button"
        class="group relative flex flex-col gap-1 rounded-lg border px-2.5 py-2 text-sm transition-all duration-150"
        :class="[
          currentTool === tool
            ? 'border-cyan-400/60 bg-cyan-400/15 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.2)]'
            : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800',
        ]"
        @click="() => void store.setTool(tool)"
      >
        <span class="flex items-center gap-2">
          <component :is="toolMeta[tool].icon" class="size-4 shrink-0" />
          <span>{{ toolMeta[tool].label }}</span>
          <!-- Active indicator: this tool's overlay is currently live -->
          <span
            v-if="activeTool === tool"
            class="ml-auto size-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"
          />
        </span>
        <span class="font-mono text-[10px] tracking-wide text-zinc-500">
          {{ formatShortcut(toolShortcuts[tool]) }}
        </span>
      </button>
    </div>
  </section>
</template>
