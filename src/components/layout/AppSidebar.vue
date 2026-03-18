<script setup>
import { RouterLink, useRouter } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()

const ui = useUIStore()
const auth = useAuthStore()

const roleLabelMap = {
  admin: 'Admin',
  member: 'Miembro',
  guest: 'Invitado',
}
</script>

<template>
  <aside
    class="flex flex-col shrink-0 border-r border-border-base bg-bg-surface h-full transition-all duration-200"
    :class="ui.sidebarOpen ? 'w-56' : 'w-0 overflow-hidden'"
  >
    <!-- Logo -->
    <div class="flex items-center h-14 px-4 border-b border-border-base shrink-0">
      <RouterLink to="/">
        <img src="@/assets/logo.svg" alt="seguridades.org" class="h-6" />
      </RouterLink>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
      <RouterLink
        to="/"
        class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
        :class="$route.name === 'Opportunities'
          ? 'bg-bg-surface-2 text-text-primary font-medium'
          : 'text-text-muted hover:text-text-primary hover:bg-bg-surface-2'"
      >
        Todas las oportunidades
      </RouterLink>
      <RouterLink
        to="/my-list"
        class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
        :class="$route.name === 'MyList'
          ? 'bg-bg-surface-2 text-text-primary font-medium'
          : 'text-text-muted hover:text-text-primary hover:bg-bg-surface-2'"
      >
        Mi Lista
      </RouterLink>
      <RouterLink
        v-if="auth.isMember"
        to="/pending"
        class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
        :class="$route.name === 'Pending'
          ? 'bg-bg-surface-2 text-text-primary font-medium'
          : 'text-text-muted hover:text-text-primary hover:bg-bg-surface-2'"
      >
        Pendientes
      </RouterLink>
      <RouterLink
        v-if="auth.isAdmin"
        to="/admin"
        class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
        :class="$route.name === 'Admin'
          ? 'bg-bg-surface-2 text-text-primary font-medium'
          : 'text-text-muted hover:text-text-primary hover:bg-bg-surface-2'"
      >
        Administración
      </RouterLink>

      <div class="mt-3 border-t border-border-base pt-3">
        <RouterLink
          to="/guide"
          class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
          :class="$route.name === 'Guide'
            ? 'bg-bg-surface-2 text-text-primary font-medium'
            : 'text-text-muted hover:text-text-primary hover:bg-bg-surface-2'"
        >
          Guía de uso
        </RouterLink>
      </div>
    </nav>

    <!-- User section -->
    <div class="px-3 py-3 border-t border-border-base shrink-0">
      <div class="px-2 py-1.5 mb-2">
        <p class="text-xs font-medium text-text-primary truncate">{{ auth.userProfile?.displayName }}</p>
        <p class="text-xs text-text-muted truncate">{{ auth.userProfile?.org }}</p>
        <span class="inline-flex items-center mt-1 px-1.5 py-0.5 rounded text-xs bg-bg-surface-2 text-text-muted border border-border-base">
          {{ roleLabelMap[auth.role] ?? auth.role }}
        </span>
      </div>
      <button
        @click="auth.logout().then(() => router.push('/login'))"
        class="w-full text-left px-2 py-1.5 rounded-lg text-xs text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
      >
        Cerrar sesión
      </button>
    </div>
  </aside>
</template>
