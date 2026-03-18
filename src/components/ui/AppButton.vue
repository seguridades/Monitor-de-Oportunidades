<script setup>
defineProps({
  variant: { type: String, default: 'primary' },
  size: { type: String, default: 'md' },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
})
</script>

<template>
  <button
    class="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    :class="[
      // Variants
      variant === 'primary' && 'bg-accent text-bg-base hover:opacity-90',
      variant === 'secondary' && 'bg-bg-surface-2 border border-border-base text-text-primary hover:border-accent',
      variant === 'danger' && 'bg-danger/10 border border-danger/30 text-danger hover:bg-danger/20',
      variant === 'ghost' && 'text-text-muted hover:text-text-primary hover:bg-bg-surface-2',
      // Sizes
      size === 'sm' && 'text-xs px-2.5 py-1.5',
      size === 'md' && 'text-sm px-3.5 py-2',
      size === 'lg' && 'text-base px-5 py-2.5',
    ]"
    :disabled="disabled || loading"
  >
    <svg v-if="loading" class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
    <slot />
  </button>
</template>
