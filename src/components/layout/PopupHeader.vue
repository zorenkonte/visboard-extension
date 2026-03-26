<script setup lang="ts">
// Popup header: Visboard logo, tagline, and version badge.
// Pure presentational — no store access needed.
import { Bot } from 'lucide-vue-next'
</script>

<template>
  <header
    class="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/70 px-3 py-2 backdrop-blur-sm"
  >
    <div class="flex items-center gap-3">
      <!-- Logo mark -->
      <div
        class="grid size-9 place-items-center rounded-lg border border-cyan-400/50 bg-cyan-500/10 shadow-[0_0_20px_rgba(34,211,238,0.35)]"
      >
        <Bot class="size-4 text-cyan-300" />
      </div>

      <div>
        <h1 class="text-base font-semibold tracking-wide text-zinc-100">Visboard</h1>
        <p class="text-xs text-zinc-400">Neon annotation control panel</p>
      </div>
    </div>

    <span
      class="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-emerald-300"
    >
      vNext
    </span>
  </header>
</template>
