<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-bg-base">
    <div class="text-center">
      <p class="text-6xl font-bold text-brand-cyan">404</p>
      <p class="text-text-primary text-xl mt-4">Página no encontrada</p>
      <button
        class="mt-6 px-4 py-2 bg-brand-cyan text-bg-base rounded-lg font-medium hover:opacity-90 transition-opacity"
        @click="router.push('/')"
      >
        Volver al inicio
      </button>
    </div>
  </div>
</template>
