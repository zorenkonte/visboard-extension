<script setup lang="ts">
// Laser tool settings: color picker with live neon preview bar.
import { storeToRefs } from 'pinia'
import { Sparkles } from 'lucide-vue-next'
import { useAnnotationStore } from '../../stores/annotation'
import ColorSwatch from '../../components/ui/ColorSwatch.vue'

const store = useAnnotationStore()
const { laserColor } = storeToRefs(store)
</script>

<template>
  <section class="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 backdrop-blur">
    <div class="mb-3 flex items-center justify-between">
      <div>
        <p class="text-sm font-medium text-zinc-100">Laser Color</p>
        <p class="text-xs text-zinc-400">Real-time synced across devices</p>
      </div>
      <Sparkles class="size-4 text-fuchsia-300" />
    </div>

    <div class="flex items-center gap-3">
      <ColorSwatch
        :model-value="laserColor"
        @update:model-value="(v) => void store.setLaserColor(v)"
      />

      <!-- Live color preview bar with neon glow -->
      <div class="flex-1 space-y-1.5">
        <div class="h-2 overflow-hidden rounded-full bg-zinc-800">
          <div
            class="h-full w-full rounded-full transition-colors duration-150"
            :style="{
              backgroundColor: laserColor,
              boxShadow: `0 0 12px ${laserColor}`,
            }"
          />
        </div>
        <p class="text-xs font-mono uppercase tracking-wide text-zinc-300">{{ laserColor }}</p>
      </div>
    </div>
  </section>
</template>
