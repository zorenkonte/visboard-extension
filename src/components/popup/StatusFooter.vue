<script setup lang="ts">
// Status footer: shows sync state and active/standby status.
import { storeToRefs } from 'pinia'
import { useAnnotationStore } from '../../stores/annotation'

const store = useAnnotationStore()
const { ready, enabled } = storeToRefs(store)
</script>

<template>
  <p class="text-center text-[11px] text-zinc-500">
    <span v-if="ready">Synced · {{ enabled ? 'Active' : 'Standby' }}</span>
    <span v-else>Loading settings…</span>
  </p>
</template>
