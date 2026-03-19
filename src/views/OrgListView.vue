<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useOpportunitiesStore } from '@/stores/opportunities'
import { useOrgFollowsStore } from '@/stores/orgFollows'
import { useOrganizationsStore } from '@/stores/organizations'
import OpportunityCard from '@/components/opportunities/OpportunityCard.vue'

const auth = useAuthStore()
const opps = useOpportunitiesStore()
const orgFollows = useOrgFollowsStore()
const orgsStore = useOrganizationsStore()

const activeTab = ref('catalog') // 'catalog' | 'following'
const statusFilter = ref('')
const relevanciaFilter = ref('')

const orgName = computed(() =>
  orgsStore.organizations.find(o => o.id === auth.orgId)?.name ?? 'Mi organización'
)

// Org internal catalog (scope=org approved opps)
const orgCatalog = computed(() => {
  let list = opps.orgApproved
  if (statusFilter.value) list = list.filter(o => o.status === statusFilter.value)
  return list
})

// Global opps the org is following
const orgFollowing = computed(() => {
  const followedIds = new Set(orgFollows.follows.map(f => f.opportunityId))
  let list = opps.approved.filter(o => followedIds.has(o.id))
  if (relevanciaFilter.value) {
    list = list.filter(o => {
      const follow = orgFollows.getFollow(o.id)
      return follow?.relevancia === relevanciaFilter.value
    })
  }
  return list
})

const hasFilters = computed(() => !!statusFilter.value || !!relevanciaFilter.value)

function clearFilters() {
  statusFilter.value = ''
  relevanciaFilter.value = ''
}
</script>

<template>
  <div class="p-6 max-w-5xl">
    <div class="mb-6">
      <h1 class="text-xl font-semibold text-text-primary">{{ orgName }}</h1>
      <p class="text-text-muted text-sm mt-0.5">Catálogo interno y seguimiento de tu organización</p>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 mb-6 border-b border-border-base">
      <button
        @click="activeTab = 'catalog'; clearFilters()"
        class="px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px"
        :class="activeTab === 'catalog' ? 'border-accent text-text-primary' : 'border-transparent text-text-muted hover:text-text-primary'"
      >
        Catálogo de org
        <span class="ml-1 text-xs text-text-muted">{{ orgCatalog.length }}</span>
      </button>
      <button
        @click="activeTab = 'following'; clearFilters()"
        class="px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px"
        :class="activeTab === 'following' ? 'border-accent text-text-primary' : 'border-transparent text-text-muted hover:text-text-primary'"
      >
        Siguiendo (global)
        <span class="ml-1 text-xs text-text-muted">{{ orgFollowing.length }}</span>
      </button>
    </div>

    <!-- Filters -->
    <div class="flex items-center gap-2 flex-wrap mb-4">
      <select v-if="activeTab === 'catalog'"
        v-model="statusFilter"
        class="px-2 py-1.5 rounded-lg border border-border-base bg-bg-surface text-text-primary text-xs focus:outline-none focus:border-accent"
      >
        <option value="">Todos los estados</option>
        <option value="nueva">Nueva</option>
        <option value="en_revision">En revisión</option>
        <option value="aplicada">Aplicada</option>
        <option value="descartada">Descartada</option>
      </select>
      <select v-if="activeTab === 'following'"
        v-model="relevanciaFilter"
        class="px-2 py-1.5 rounded-lg border border-border-base bg-bg-surface text-text-primary text-xs focus:outline-none focus:border-accent"
      >
        <option value="">Toda relevancia</option>
        <option value="Alto">Alto</option>
        <option value="Bueno">Bueno</option>
        <option value="Selectivo">Selectivo</option>
      </select>
      <button v-if="hasFilters" @click="clearFilters" class="text-xs text-accent hover:underline">× Limpiar</button>
    </div>

    <!-- Catalog tab -->
    <template v-if="activeTab === 'catalog'">
      <div v-if="opps.loading" class="py-16 text-center">
        <p class="text-text-muted text-sm">Cargando...</p>
      </div>
      <div v-else-if="orgCatalog.length === 0" class="py-16 flex flex-col items-center gap-3 text-center">
        <p class="text-text-muted">No hay oportunidades en el catálogo de tu org aún.</p>
        <p class="text-text-muted text-sm">Propón una con visibilidad "Solo mi organización".</p>
        <router-link to="/" class="mt-2 px-4 py-2 rounded-lg bg-accent text-bg-base text-sm font-medium hover:opacity-90 transition-opacity">
          Ver catálogo global
        </router-link>
      </div>
      <div v-else class="grid gap-3 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        <OpportunityCard v-for="opp in orgCatalog" :key="opp.id" :opportunity="opp" :show-follow-panel="false" />
      </div>
    </template>

    <!-- Following tab -->
    <template v-if="activeTab === 'following'">
      <div v-if="orgFollows.loading || opps.loading" class="py-16 text-center">
        <p class="text-text-muted text-sm">Cargando...</p>
      </div>
      <div v-else-if="orgFollowing.length === 0" class="py-16 flex flex-col items-center gap-3 text-center">
        <template v-if="hasFilters">
          <p class="text-text-muted">Sin resultados para los filtros seleccionados.</p>
          <button @click="clearFilters" class="px-4 py-2 rounded-lg border border-border-base text-text-muted text-sm hover:text-accent hover:border-accent transition-colors">Limpiar filtros</button>
        </template>
        <template v-else>
          <p class="text-text-muted">Tu organización no sigue ninguna oportunidad global aún.</p>
          <p class="text-text-muted text-sm">Usa el botón "+ Org" en el catálogo global.</p>
          <router-link to="/" class="mt-2 px-4 py-2 rounded-lg bg-accent text-bg-base text-sm font-medium hover:opacity-90 transition-opacity">Ver catálogo global</router-link>
        </template>
      </div>
      <div v-else class="grid gap-3 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        <OpportunityCard v-for="opp in orgFollowing" :key="opp.id" :opportunity="opp" :show-follow-panel="true" />
      </div>
    </template>
  </div>
</template>
