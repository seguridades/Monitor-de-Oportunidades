<script setup>
defineProps({
  variant: { type: String, default: 'default' },
})
</script>

<template>
  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium">
    <slot />
  </span>
</template>
