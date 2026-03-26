<script setup lang="ts">
import { onMounted } from 'vue';
import { Bot, Crosshair, PenSquare, Shapes, Sparkles, Sticker, Minus, Plus } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { useAnnotationStore } from '../../stores/annotation';
import type { ToolName } from '../../shared/messages';

const store = useAnnotationStore();
const {
  ready,
  enabled,
  currentTool,
  laserColor,
  penColor,
  penWidth,
  shapesColor,
  shapesType,
  currentSticker,
  toolOptions,
  stickers,
} = storeToRefs(store);

const toolMeta: Record<ToolName, { label: string; icon: typeof Crosshair }> = {
  laser: { label: 'Laser', icon: Crosshair },
  pen: { label: 'Pen', icon: PenSquare },
  shapes: { label: 'Shapes', icon: Shapes },
  stickers: { label: 'Stickers', icon: Sticker },
};

function onToolChange(tool: ToolName): void {
  void store.setTool(tool);
}

function onColorInput(event: Event, tool: 'laser' | 'pen' | 'shapes'): void {
  const target = event.target as HTMLInputElement;
  if (tool === 'laser') {
    void store.setLaserColor(target.value);
  } else if (tool === 'pen') {
    void store.setPenColor(target.value);
  } else if (tool === 'shapes') {
    void store.setShapesColor(target.value);
  }
}

function onEnabledToggle(event: Event): void {
  const target = event.target as HTMLInputElement;
  void store.setEnabled(target.checked);
}

function onPenWidthChange(delta: number): void {
  const newWidth = Math.max(1, Math.min(20, penWidth.value + delta));
  void store.setPenWidth(newWidth);
}

function onShapesTypeChange(type: 'rect' | 'circle' | 'line'): void {
  void store.setShapesType(type);
}

function onStickerSelect(sticker: string): void {
  void store.setCurrentSticker(sticker);
}

onMounted(() => {
  void store.load();
});
</script>

<template>
  <main class="relative overflow-hidden rounded-2xl border border-cyan-400/20 bg-zinc-950 p-4 shadow-[0_0_0_1px_rgba(6,182,212,0.15),0_22px_54px_rgba(8,145,178,0.25)]">
    <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(34,211,238,0.12),transparent_40%),radial-gradient(circle_at_85%_15%,rgba(217,70,239,0.16),transparent_38%),radial-gradient(circle_at_50%_100%,rgba(56,189,248,0.08),transparent_40%)]"></div>

    <section class="relative z-10 space-y-4 max-w-md">
      <!-- Header -->
      <header class="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/70 px-3 py-2 backdrop-blur-sm">
        <div class="flex items-center gap-3">
          <div class="grid size-9 place-items-center rounded-lg border border-cyan-400/50 bg-cyan-500/10 shadow-[0_0_20px_rgba(34,211,238,0.35)]">
            <Bot class="size-4 text-cyan-300" />
          </div>
          <div>
            <h1 class="text-base font-semibold tracking-wide text-zinc-100">Visboard</h1>
            <p class="text-xs text-zinc-400">Neon annotation control panel</p>
          </div>
        </div>
        <span class="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-emerald-300">vNext</span>
      </header>

      <!-- Annotation Mode Toggle -->
      <section class="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 backdrop-blur">
        <div class="mb-2 flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-zinc-100">Annotation Mode</p>
            <p class="text-xs text-zinc-400">Blocks page interactions while active</p>
          </div>
          <label class="relative inline-flex cursor-pointer items-center">
            <input :checked="enabled" type="checkbox" class="peer sr-only" @change="onEnabledToggle" />
            <span class="h-6 w-11 rounded-full bg-zinc-700 transition peer-checked:bg-cyan-500"></span>
            <span class="absolute left-0.5 top-0.5 size-5 rounded-full bg-white transition peer-checked:translate-x-5"></span>
          </label>
        </div>
        <div class="rounded-lg border border-cyan-400/25 bg-cyan-400/5 px-2 py-1 text-[11px] text-cyan-200">
          Shortcut: <span class="font-semibold">Ctrl/Cmd + Shift + L</span>
        </div>
      </section>

      <!-- Tools -->
      <section class="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 backdrop-blur">
        <p class="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-400">Tools</p>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="tool in toolOptions"
            :key="tool"
            type="button"
            class="group relative flex items-center gap-2 rounded-lg border px-2.5 py-2 text-sm transition"
            :class="[
              currentTool === tool
                ? 'border-cyan-400/60 bg-cyan-400/15 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.2)]'
                : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800',
            ]"
            @click="onToolChange(tool)"
          >
            <component :is="toolMeta[tool].icon" class="size-4" />
            <span>{{ toolMeta[tool].label }}</span>
          </button>
        </div>
      </section>

      <!-- Tool-Specific Settings -->
      <!-- Laser Settings -->
      <section v-if="currentTool === 'laser'" class="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 backdrop-blur">
        <div class="mb-2 flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-zinc-100">Laser Color</p>
            <p class="text-xs text-zinc-400">Real-time synced across devices</p>
          </div>
          <Sparkles class="size-4 text-fuchsia-300" />
        </div>

        <div class="flex items-center gap-3">
          <label class="relative block size-12 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950">
            <input
              :value="laserColor"
              type="color"
              class="absolute inset-0 size-full cursor-pointer opacity-0"
              @input="(e) => onColorInput(e, 'laser')"
            />
            <span class="absolute inset-1 rounded-lg" :style="{ backgroundColor: laserColor }"></span>
          </label>

          <div class="flex-1">
            <div class="h-2 rounded-full bg-zinc-800">
              <div
                class="h-full rounded-full shadow-[0_0_12px_currentColor]"
                :style="{ width: '100%', backgroundColor: laserColor, color: laserColor }"
              ></div>
            </div>
            <p class="mt-1 text-xs font-mono uppercase tracking-wide text-zinc-300">{{ laserColor }}</p>
          </div>
        </div>
      </section>

      <!-- Pen Settings -->
      <section v-if="currentTool === 'pen'" class="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 backdrop-blur">
        <div>
          <div class="mb-2 flex items-center justify-between">
            <p class="text-sm font-medium text-zinc-100">Pen Color</p>
            <PenSquare class="size-4 text-blue-300" />
          </div>
          <div class="flex items-center gap-3">
            <label class="relative block size-12 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950">
              <input
                :value="penColor"
                type="color"
                class="absolute inset-0 size-full cursor-pointer opacity-0"
                @input="(e) => onColorInput(e, 'pen')"
              />
              <span class="absolute inset-1 rounded-lg" :style="{ backgroundColor: penColor }"></span>
            </label>
            <p class="text-xs font-mono uppercase tracking-wide text-zinc-300">{{ penColor }}</p>
          </div>
        </div>

        <div>
          <div class="mb-2 flex items-center justify-between">
            <p class="text-sm font-medium text-zinc-100">Pen Width</p>
            <span class="text-xs text-zinc-400">{{ penWidth }}px</span>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="rounded-lg border border-zinc-700 bg-zinc-900 p-1 hover:border-zinc-600 hover:bg-zinc-800"
              @click="onPenWidthChange(-1)"
            >
              <Minus class="size-4 text-zinc-300" />
            </button>
            <div class="flex-1 h-2 rounded-full bg-zinc-800">
              <div
                class="h-full rounded-full bg-blue-400 transition-all"
                :style="{ width: `${(penWidth / 20) * 100}%` }"
              ></div>
            </div>
            <button
              type="button"
              class="rounded-lg border border-zinc-700 bg-zinc-900 p-1 hover:border-zinc-600 hover:bg-zinc-800"
              @click="onPenWidthChange(1)"
            >
              <Plus class="size-4 text-zinc-300" />
            </button>
          </div>
        </div>
      </section>

      <!-- Shapes Settings -->
      <section v-if="currentTool === 'shapes'" class="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 backdrop-blur">
        <div>
          <div class="mb-2 flex items-center justify-between">
            <p class="text-sm font-medium text-zinc-100">Shape Color</p>
            <Shapes class="size-4 text-orange-300" />
          </div>
          <div class="flex items-center gap-3">
            <label class="relative block size-12 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950">
              <input
                :value="shapesColor"
                type="color"
                class="absolute inset-0 size-full cursor-pointer opacity-0"
                @input="(e) => onColorInput(e, 'shapes')"
              />
              <span class="absolute inset-1 rounded-lg" :style="{ backgroundColor: shapesColor }"></span>
            </label>
            <p class="text-xs font-mono uppercase tracking-wide text-zinc-300">{{ shapesColor }}</p>
          </div>
        </div>

        <div>
          <p class="mb-2 text-sm font-medium text-zinc-100">Shape Type</p>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="shape in ['rect', 'circle', 'line']"
              :key="shape"
              type="button"
              class="rounded-lg border px-3 py-2 text-xs font-medium uppercase transition"
              :class="[
                shapesType === shape
                  ? 'border-orange-400/60 bg-orange-400/15 text-orange-100'
                  : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800',
              ]"
              @click="onShapesTypeChange(shape as 'rect' | 'circle' | 'line')"
            >
              {{ shape }}
            </button>
          </div>
        </div>
      </section>

      <!-- Stickers Settings -->
      <section v-if="currentTool === 'stickers'" class="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 backdrop-blur">
        <div class="mb-2 flex items-center justify-between">
          <p class="text-sm font-medium text-zinc-100">Select Sticker</p>
          <Sticker class="size-4 text-purple-300" />
        </div>
        <div class="grid grid-cols-6 gap-2">
          <button
            v-for="sticker in stickers"
            :key="sticker"
            type="button"
            class="aspect-square rounded-lg border transition"
            :class="[
              currentSticker === sticker
                ? 'border-purple-400/60 bg-purple-400/15 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                : 'border-zinc-700 bg-zinc-900 hover:border-zinc-600 hover:bg-zinc-800',
            ]"
            @click="onStickerSelect(sticker)"
          >
            <span class="text-xl">{{ sticker }}</span>
          </button>
        </div>
      </section>

      <!-- Status Footer -->
      <p class="text-center text-[11px] text-zinc-500">
        <span v-if="ready">Synced · {{ enabled ? 'Active' : 'Standby' }}</span>
        <span v-else>Loading settings…</span>
      </p>
    </section>
  </main>
</template>