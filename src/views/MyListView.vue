<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useOpportunitiesStore } from '@/stores/opportunities'
import { useFollowsStore } from '@/stores/follows'
import OpportunityCard from '@/components/opportunities/OpportunityCard.vue'

const auth = useAuthStore()
const opps = useOpportunitiesStore()
const follows = useFollowsStore()

const followedOpportunities = computed(() => {
  const followedIds = new Set(follows.follows.map(f => f.opportunityId))
  return opps.opportunities.filter(o => followedIds.has(o.id))
})
</script>

<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-xl font-semibold text-text-primary">
        Mi Lista
        <span class="text-text-muted font-normal text-sm ml-1">{{ followedOpportunities.length }}</span>
      </h1>
      <p class="text-text-muted text-sm mt-0.5">Oportunidades que estás siguiendo</p>
    </div>

    <div v-if="follows.loading || opps.loading" class="flex items-center justify-center py-16">
      <p class="text-text-muted text-sm">Cargando...</p>
    </div>

    <div
      v-else-if="followedOpportunities.length === 0"
      class="flex flex-col items-center justify-center py-16 gap-3 text-center"
    >
      <p class="text-text-muted">No sigues ninguna oportunidad aún.</p>
      <p class="text-text-muted text-sm">Agrega desde el listado principal.</p>
      <router-link
        to="/"
        class="mt-2 px-4 py-2 rounded-lg bg-accent text-bg-base text-sm font-medium hover:opacity-90 transition-opacity"
      >
        Ver oportunidades
      </router-link>
    </div>

    <div v-else class="grid gap-3 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
      <OpportunityCard
        v-for="opp in followedOpportunities"
        :key="opp.id"
        :opportunity="opp"
        :show-follow-panel="true"
      />
    </div>
  </div>
</template>
