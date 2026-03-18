<script setup>
import { useUIStore } from '@/stores/ui'
import { Moon, Sun } from 'lucide-vue-next'

const ui = useUIStore()
</script>

<template>
  <button
    class="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-surface-2 transition-colors"
    @click="ui.toggleTheme()"
    :aria-label="ui.theme === 'dark' ? 'Modo claro' : 'Modo oscuro'"
  >
    <Sun v-if="ui.theme === 'dark'" class="w-5 h-5" />
    <Moon v-else class="w-5 h-5" />
  </button>
</template>
