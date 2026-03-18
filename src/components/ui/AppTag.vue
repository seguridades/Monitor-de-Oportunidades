<script setup>
defineProps({ label: String })
</script>

<template>
  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-bg-surface-2 text-text-muted border border-border-base">
    {{ label }}
  </span>
</template>
