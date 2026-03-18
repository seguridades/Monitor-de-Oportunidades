<script setup>
const props = defineProps({ label: String, clickable: Boolean })
const emit = defineEmits(['click'])
</script>

<template>
  <span
    @click="props.clickable ? emit('click', props.label) : null"
    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-bg-surface-2 text-text-muted border border-border-base transition-colors"
    :class="props.clickable ? 'cursor-pointer hover:bg-accent/10 hover:text-accent hover:border-accent' : ''"
  >
    {{ label }}
  </span>
</template>
