<script setup>
defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' },
})
defineEmits(['close'])
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/60 backdrop-blur-sm"
        @click="$emit('close')"
      />

      <!-- Modal panel -->
      <div class="relative bg-bg-surface border border-border-base rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-border-base sticky top-0 bg-bg-surface z-10">
          <h2 class="text-base font-semibold text-text-primary">{{ title }}</h2>
          <button
            @click="$emit('close')"
            class="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-surface-2 transition-colors"
            aria-label="Cerrar"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div>
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>
