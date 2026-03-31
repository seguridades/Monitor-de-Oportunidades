<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 minutos
const WARNING_BEFORE = 60 * 1000           // avisar 60 seg antes
let inactivityTimer = null
let warningTimer = null
let countdownInterval = null

const showInactivityWarning = ref(false)
const secondsLeft = ref(60)

function clearAllTimers() {
  clearTimeout(inactivityTimer)
  clearTimeout(warningTimer)
  clearInterval(countdownInterval)
}

function startCountdown() {
  secondsLeft.value = WARNING_BEFORE / 1000
  clearInterval(countdownInterval)
  countdownInterval = setInterval(() => {
    secondsLeft.value--
    if (secondsLeft.value <= 0) clearInterval(countdownInterval)
  }, 1000)
}

function resetInactivityTimer() {
  if (showInactivityWarning.value) return // si el aviso está visible, ignorar actividad
  clearAllTimers()
  warningTimer = setTimeout(() => {
    showInactivityWarning.value = true
    startCountdown()
    inactivityTimer = setTimeout(() => {
      showInactivityWarning.value = false
      auth.logout()
    }, WARNING_BEFORE)
  }, INACTIVITY_TIMEOUT - WARNING_BEFORE)
}

function stayConnected() {
  showInactivityWarning.value = false
  resetInactivityTimer()
}

const ACTIVITY_EVENTS = ['click', 'keydown', 'mousemove']
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
  if (!localStorage.getItem('monitor_oportunidades_onboarding')) {
    showWelcome.value = true
  }
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, resetInactivityTimer, { passive: true }))
  resetInactivityTimer()
})
onUnmounted(() => {
  opps.stopSubscription()
  follows.stopSubscription()
  notifs.stopSubscription()
  reportsStore.stopSubscription()
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
  ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, resetInactivityTimer))
  clearAllTimers()
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

    <!-- Inactivity warning modal -->
    <div
      v-if="showInactivityWarning"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div class="bg-bg-surface rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 text-center">
        <p class="text-text-primary font-semibold text-base mb-1">¿Seguís ahí?</p>
        <p class="text-text-secondary text-sm mb-5">
          Por seguridad, cerraremos tu sesión en
          <span class="font-semibold text-text-primary">{{ secondsLeft }}</span>
          segundo{{ secondsLeft !== 1 ? 's' : '' }} por inactividad.
        </p>
        <button
          class="w-full bg-accent text-white rounded-lg py-2 text-sm font-medium hover:opacity-90 transition-opacity"
          @click="stayConnected"
        >
          Seguir conectado
        </button>
      </div>
    </div>
  </div>
</template>
