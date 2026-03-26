<script setup lang="ts">
// Shapes tool settings: color picker + shape type selector.
import { storeToRefs } from 'pinia'
import { Shapes } from 'lucide-vue-next'
import { useAnnotationStore } from '../../stores/annotation'
import ColorSwatch from '../../components/ui/ColorSwatch.vue'

const SHAPE_TYPES = ['rect', 'circle', 'line'] as const
type ShapeType = (typeof SHAPE_TYPES)[number]

const store = useAnnotationStore()
const { shapesColor, shapesType } = storeToRefs(store)
</script>

<template>
  <section class="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 backdrop-blur">
    <!-- Color -->
    <div>
      <div class="mb-2 flex items-center justify-between">
        <p class="text-sm font-medium text-zinc-100">Shape Color</p>
        <Shapes class="size-4 text-orange-300" />
      </div>
      <div class="flex items-center gap-3">
        <ColorSwatch
          :model-value="shapesColor"
          @update:model-value="(v) => void store.setShapesColor(v)"
        />
        <p class="text-xs font-mono uppercase tracking-wide text-zinc-300">{{ shapesColor }}</p>
      </div>
    </div>

    <!-- Shape type -->
    <div>
      <p class="mb-2 text-sm font-medium text-zinc-100">Shape Type</p>
      <div class="grid grid-cols-3 gap-2">
        <button
          v-for="shape in SHAPE_TYPES"
          :key="shape"
          type="button"
          class="rounded-lg border px-3 py-2 text-xs font-medium uppercase transition-all duration-150"
          :class="[
            shapesType === shape
              ? 'border-orange-400/60 bg-orange-400/15 text-orange-100 shadow-[0_0_12px_rgba(251,146,60,0.2)]'
              : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800',
          ]"
          @click="() => void store.setShapesType(shape as ShapeType)"
        >
          {{ shape }}
        </button>
      </div>
    </div>
  </section>
</template>
