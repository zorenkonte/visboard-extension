<script setup lang="ts">
// Stickers tool settings: emoji picker grid.
import { storeToRefs } from 'pinia'
import { Sticker } from 'lucide-vue-next'
import { useAnnotationStore } from '../../stores/annotation'

const store = useAnnotationStore()
const { currentSticker, stickers } = storeToRefs(store)
</script>

<template>
  <section class="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 backdrop-blur">
    <div class="mb-2 flex items-center justify-between">
      <p class="text-sm font-medium text-zinc-100">Select Sticker</p>
      <Sticker class="size-4 text-purple-300" />
    </div>

    <div class="grid grid-cols-6 gap-2">
      <button
        v-for="sticker in stickers"
        :key="sticker"
        type="button"
        class="flex aspect-square items-center justify-center rounded-lg border transition-all duration-150"
        :class="[
          currentSticker === sticker
            ? 'border-purple-400/60 bg-purple-400/15 shadow-[0_0_12px_rgba(168,85,247,0.3)] scale-110'
            : 'border-zinc-700 bg-zinc-900 hover:border-zinc-600 hover:bg-zinc-800 hover:scale-105',
        ]"
        @click="() => void store.setCurrentSticker(sticker)"
      >
        <span class="text-xl leading-none select-none">{{ sticker }}</span>
      </button>
    </div>
  </section>
</template>
