<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'
import WelcomeModal from '@/components/onboarding/WelcomeModal.vue'
import { RouterView } from 'vue-router'
import { useOpportunitiesStore } from '@/stores/opportunities'
import { useFollowsStore } from '@/stores/follows'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import { useNotificationsStore } from '@/stores/notifications'
import { useReportsStore } from '@/stores/reports'

const auth = useAuthStore()
const opps = useOpportunitiesStore()
const follows = useFollowsStore()
const ui = useUIStore()
const notifs = useNotificationsStore()
const reportsStore = useReportsStore()

const showWelcome = ref(false)
const isOnline = ref(navigator.onLine)

function handleOnline() { isOnline.value = true }
function handleOffline() { isOnline.value = false }

onMounted(() => {
  opps.subscribe()
  follows.subscribe()
  notifs.subscribe()
  if (auth.canApprove) reportsStore.subscribe()
  if (!localStorage.getItem('onboarding_done')) {
    showWelcome.value = true
  }
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
})
onUnmounted(() => {
  opps.stopSubscription()
  follows.stopSubscription()
  notifs.stopSubscription()
  reportsStore.stopSubscription()
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
})
</script>

<template>
  <div class="flex h-screen bg-bg-base text-text-primary overflow-hidden">
    <!-- Offline banner -->
    <div
      v-if="!isOnline"
      class="fixed top-0 inset-x-0 z-50 bg-amber text-bg-base text-xs font-medium text-center py-1.5 px-4"
    >
      Sin conexión — los cambios no se guardarán hasta recuperar internet.
    </div>

    <!-- Mobile backdrop -->
    <div
      v-if="ui.sidebarOpen"
      class="fixed inset-0 z-30 bg-black/50 md:hidden"
      @click="ui.toggleSidebar()"
    />

    <!-- Sidebar: overlay on mobile, inline on md+ -->
    <div
      class="fixed inset-y-0 left-0 z-40 md:relative md:z-auto transition-transform duration-200"
      :class="ui.sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:overflow-hidden'"
    >
      <AppSidebar />
    </div>

    <div class="flex flex-col flex-1 min-w-0">
      <AppHeader />
      <main class="flex-1 overflow-y-auto">
        <RouterView />
      </main>
    </div>

    <WelcomeModal v-if="showWelcome" @close="showWelcome = false" />
  </div>
</template>
