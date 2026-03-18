<script setup>
import { onMounted, onUnmounted } from 'vue'
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'
import { RouterView } from 'vue-router'
import { useOpportunitiesStore } from '@/stores/opportunities'
import { useFollowsStore } from '@/stores/follows'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const opps = useOpportunitiesStore()
const follows = useFollowsStore()

onMounted(() => {
  opps.subscribe()
  follows.subscribe()
})
onUnmounted(() => {
  opps.stopSubscription()
  follows.stopSubscription()
})
</script>

<template>
  <div class="flex h-screen bg-bg-base text-text-primary overflow-hidden">
    <AppSidebar />
    <div class="flex flex-col flex-1 min-w-0">
      <AppHeader />
      <main class="flex-1 overflow-y-auto">
        <RouterView />
      </main>
    </div>
  </div>
</template>
