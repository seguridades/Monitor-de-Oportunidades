<script setup>
import { RouterLink } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { useOpportunitiesStore } from '@/stores/opportunities'
import { Menu, Sun, Moon } from 'lucide-vue-next'

const ui = useUIStore()
const auth = useAuthStore()
const opps = useOpportunitiesStore()
</script>

<template>
  <header class="flex items-center h-14 px-4 gap-3 border-b border-border-base bg-bg-surface shrink-0">
    <!-- Sidebar toggle -->
    <button
      @click="ui.toggleSidebar()"
      class="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-surface-2 transition-colors"
      aria-label="Toggle sidebar"
    >
      <Menu class="w-5 h-5" />
    </button>

    <!-- Spacer -->
    <div class="flex-1" />

    <!-- Pending count badge (member/admin) -->
    <RouterLink
      v-if="auth.isMember && opps.pending.length > 0"
      to="/pending"
      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber/20 text-amber text-xs font-medium border border-amber/30 hover:bg-amber/30 transition-colors"
    >
      <span class="w-1.5 h-1.5 rounded-full bg-amber"></span>
      {{ opps.pending.length }} pendiente{{ opps.pending.length !== 1 ? 's' : '' }}
    </RouterLink>

    <!-- Theme toggle -->
    <button
      @click="ui.toggleTheme()"
      class="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-surface-2 transition-colors"
      :aria-label="ui.theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
    >
      <Sun v-if="ui.theme === 'dark'" class="w-5 h-5" />
      <Moon v-else class="w-5 h-5" />
    </button>
  </header>
</template>
