<script setup lang="ts">
// App.vue — top-level orchestrator only.
// Responsibilities: mount store, layout shell, compose sections + tool panels.
// No business logic or inline UI lives here.
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAnnotationStore } from '../../stores/annotation'

// Layout
import PopupHeader from '../../components/layout/PopupHeader.vue'

// Popup sections
import AnnotationToggle from '../../components/popup/AnnotationToggle.vue'
import ToolSelector from '../../components/popup/ToolSelector.vue'
import StatusFooter from '../../components/popup/StatusFooter.vue'

// Tool-specific settings panels (one per tool)
import LaserSettings from '../../modules/laser/LaserSettings.vue'
import PenSettings from '../../modules/pen/PenSettings.vue'
import ShapesSettings from '../../modules/shapes/ShapesSettings.vue'
import StickersSettings from '../../modules/stickers/StickersSettings.vue'

const store = useAnnotationStore()
const { currentTool } = storeToRefs(store)

onMounted(() => {
  void store.load()
})
</script>

<template>
  <main
    class="relative overflow-hidden rounded-2xl border border-cyan-400/20 bg-zinc-950 p-4 shadow-[0_0_0_1px_rgba(6,182,212,0.15),0_22px_54px_rgba(8,145,178,0.25)]"
  >
    <!-- Atmospheric background gradients -->
    <div
      class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(34,211,238,0.12),transparent_40%),radial-gradient(circle_at_85%_15%,rgba(217,70,239,0.16),transparent_38%),radial-gradient(circle_at_50%_100%,rgba(56,189,248,0.08),transparent_40%)]"
    />

    <section class="relative z-10 max-w-md space-y-4">
      <PopupHeader />
      <AnnotationToggle />
      <ToolSelector />

      <!-- Active tool settings panel — animated swap on tool change -->
      <Transition name="tool-panel" mode="out-in">
        <LaserSettings    v-if="currentTool === 'laser'"    key="laser"    />
        <PenSettings      v-else-if="currentTool === 'pen'"      key="pen"      />
        <ShapesSettings   v-else-if="currentTool === 'shapes'"   key="shapes"   />
        <StickersSettings v-else-if="currentTool === 'stickers'" key="stickers" />
      </Transition>

      <StatusFooter />
    </section>
  </main>
</template>

<style scoped>
.tool-panel-enter-active,
.tool-panel-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}
.tool-panel-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.tool-panel-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>

<!-- ─────────────────────────────────────────────────────────────────────────
     ARCHITECTURE NOTES
  ───────────────────────────────────────────────────────────────────────────
  Communication flow:
    Popup → store action  →  browser.runtime.sendMessage  →  background.ts
    content.ts  ←  browser.tabs.sendMessage  ←  background.ts

  Adding a new tool (e.g. "highlighter"):
    1. Add 'highlighter' to ToolName union in shared/messages.ts
    2. Add storage item in shared/storage.ts
    3. Add state/actions to stores/annotation.ts
    4. Create src/modules/highlighter/HighlighterSettings.vue
    5. Add the <HighlighterSettings> branch in the <Transition> block above
    6. Register the tool icon/label in components/popup/ToolSelector.vue
  ──────────────────────────────────────────────────────────────────────── -->

<!-- LEFT IN THIS FILE (intentional): -->
<!--   - <Transition> wrapper that owns the swap animation -->
<!--   - Background gradient div (global decoration for the popup shell) -->
<!--   - store.load() call on mount (single source of truth for hydration) -->