<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { useOpportunitiesStore } from '@/stores/opportunities'
import { useNotificationsStore } from '@/stores/notifications'
import { Menu, Sun, Moon, Bell, X } from 'lucide-vue-next'

const ui = useUIStore()
const auth = useAuthStore()
const opps = useOpportunitiesStore()
const notifs = useNotificationsStore()

const showPanel = ref(false)

function togglePanel() {
  showPanel.value = !showPanel.value
  if (showPanel.value && notifs.unreadCount > 0) {
    notifs.markAllRead()
  }
}

function formatDate(ts) {
  if (!ts) return ''
  const d = ts?.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}
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

    <div class="flex-1" />

    <!-- Pending badge -->
    <RouterLink
      v-if="auth.isMember && opps.pending.length > 0"
      to="/pending"
      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber/20 text-amber text-xs font-medium border border-amber/30 hover:bg-amber/30 transition-colors"
    >
      <span class="w-1.5 h-1.5 rounded-full bg-amber"></span>
      {{ opps.pending.length }} pendiente{{ opps.pending.length !== 1 ? 's' : '' }}
    </RouterLink>

    <!-- Notification bell -->
    <div class="relative">
      <button
        @click="togglePanel"
        class="relative p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-surface-2 transition-colors"
        aria-label="Notificaciones"
      >
        <Bell class="w-5 h-5" />
        <span
          v-if="notifs.unreadCount > 0"
          class="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-accent text-bg-base text-[10px] font-bold flex items-center justify-center leading-none"
        >
          {{ notifs.unreadCount }}
        </span>
      </button>

      <!-- Backdrop -->
      <div v-if="showPanel" class="fixed inset-0 z-40" @click="showPanel = false" />

      <!-- Panel -->
      <div
        v-if="showPanel"
        class="fixed z-50 right-4 mt-2 w-80 bg-bg-surface border border-border-base rounded-xl shadow-lg overflow-hidden"
        style="top: 56px"
      >
        <div class="px-4 py-3 border-b border-border-base flex items-center justify-between">
          <p class="text-sm font-semibold text-text-primary">Notificaciones</p>
          <div class="flex items-center gap-3">
            <button
              v-if="notifs.unreadCount > 0"
              @click="notifs.markAllRead()"
              class="text-xs text-accent hover:underline"
            >
              Marcar leídas
            </button>
            <button
              v-if="notifs.notifications.some(n => n.read)"
              @click="notifs.deleteAllRead()"
              class="text-xs text-text-muted hover:text-danger hover:underline"
            >
              Limpiar leídas
            </button>
          </div>
        </div>

        <div class="max-h-80 overflow-y-auto">
          <div v-if="notifs.loading" class="px-4 py-6 text-center text-text-muted text-sm">
            Cargando...
          </div>
          <div v-else-if="notifs.notifications.length === 0" class="px-4 py-8 text-center text-text-muted text-sm">
            Sin notificaciones aún
          </div>
          <div v-else>
            <div
              v-for="n in notifs.notifications"
              :key="n.id"
              class="group px-4 py-3 border-b border-border-base last:border-0 flex items-start gap-3 transition-colors"
              :class="n.read
                ? 'bg-bg-surface'
                : 'bg-accent/8 border-l-2 border-l-accent'"
            >
              <span
                class="mt-0.5 shrink-0 w-2 h-2 rounded-full"
                :class="[
                  n.type === 'approved' ? 'bg-green-500' : n.type === 'pending' ? 'bg-amber-400' : 'bg-danger',
                  n.read ? 'opacity-40' : ''
                ]"
              />
              <div class="flex-1 min-w-0">
                <p class="text-xs leading-snug" :class="n.read ? 'text-text-muted' : 'text-text-primary'">
                  <span v-if="n.type === 'approved'">Tu propuesta <strong>{{ n.opportunityTitle }}</strong> fue aprobada y está en el catálogo.</span>
                  <span v-else-if="n.type === 'pending'">Tu propuesta <strong>{{ n.opportunityTitle }}</strong> fue recibida y está pendiente de revisión.</span>
                  <span v-else>Tu propuesta <strong>{{ n.opportunityTitle }}</strong> fue rechazada.</span>
                </p>
                <p class="text-xs text-text-muted mt-0.5">{{ formatDate(n.createdAt) }}</p>
              </div>
              <button
                @click="notifs.deleteNotification(n.id)"
                class="shrink-0 mt-0.5 p-0.5 rounded text-text-muted hover:text-danger transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Eliminar notificación"
              >
                <X class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

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
