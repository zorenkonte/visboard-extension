<script setup lang="ts">
// Tool selector: renders a button grid for all available annotation tools.
import { storeToRefs } from 'pinia'
import { Crosshair, PenSquare, Shapes, Sticker } from 'lucide-vue-next'
import { useAnnotationStore } from '../../stores/annotation'
import type { ToolName } from '../../shared/messages'

// Keep icon map here — it's pure presentational config, not business logic.
const toolMeta: Record<ToolName, { label: string; icon: typeof Crosshair }> = {
  laser:    { label: 'Laser',    icon: Crosshair  },
  pen:      { label: 'Pen',      icon: PenSquare  },
  shapes:   { label: 'Shapes',   icon: Shapes     },
  stickers: { label: 'Stickers', icon: Sticker    },
}

const store = useAnnotationStore()
const { currentTool, toolOptions } = storeToRefs(store)
</script>

<template>
  <section class="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 backdrop-blur">
    <p class="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-400">Tools</p>

    <div class="grid grid-cols-2 gap-2">
      <button
        v-for="tool in toolOptions"
        :key="tool"
        type="button"
        class="group relative flex items-center gap-2 rounded-lg border px-2.5 py-2 text-sm transition-all duration-150"
        :class="[
          currentTool === tool
            ? 'border-cyan-400/60 bg-cyan-400/15 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.2)]'
            : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800',
        ]"
        @click="() => void store.setTool(tool)"
      >
        <component :is="toolMeta[tool].icon" class="size-4 shrink-0" />
        <span>{{ toolMeta[tool].label }}</span>
      </button>
    </div>
  </section>
</template>
