<script setup>
defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '¿Confirmar acción?' },
  message: { type: String, default: '' },
  confirmLabel: { type: String, default: 'Confirmar' },
})
defineEmits(['confirm', 'cancel'])
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="$emit('cancel')" />
      <div class="relative bg-bg-surface border border-border-base rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h2 class="text-base font-semibold text-text-primary mb-2">{{ title }}</h2>
        <p v-if="message" class="text-sm text-text-muted mb-5">{{ message }}</p>
        <div class="flex justify-end gap-2">
          <button
            @click="$emit('cancel')"
            class="px-4 py-2 rounded-lg border border-border-base text-text-muted text-sm hover:text-text-primary hover:border-accent transition-colors"
          >
            Cancelar
          </button>
          <button
            @click="$emit('confirm')"
            class="px-4 py-2 rounded-lg bg-danger text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {{ confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
