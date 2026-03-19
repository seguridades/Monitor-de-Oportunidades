<script setup>
import { ref, computed } from 'vue'
import { Search, Download } from 'lucide-vue-next'
import { useOpportunitiesStore } from '@/stores/opportunities'
import { useFollowsStore } from '@/stores/follows'
import OpportunityCard from '@/components/opportunities/OpportunityCard.vue'

const opps = useOpportunitiesStore()
const follows = useFollowsStore()

const statusFilter = ref('')
const typeFilter = ref('')
const searchQuery = ref('')
const onlyStarred = ref(false)

const statusOptions = [
  { value: 'nueva', label: 'Nueva' },
  { value: 'siguiendo', label: 'Siguiendo' },
  { value: 'aplicando', label: 'Aplicando' },
  { value: 'aplicada', label: 'Aplicada' },
  { value: 'descartada', label: 'Descartada' },
]

const typeOptions = [
  { value: 'convocatoria', label: 'Convocatorias' },
  { value: 'grant', label: 'Grants' },
  { value: 'fuente', label: 'Fuentes' },
  { value: 'capacitacion', label: 'Capacitaciones' },
  { value: 'red', label: 'Redes' },
]

const followedOpportunities = computed(() => {
  const followedIds = new Set(follows.follows.map(f => f.opportunityId))
  let list = opps.approved.filter(o => followedIds.has(o.id))

  if (statusFilter.value) {
    list = list.filter(o => follows.getFollow(o.id)?.personalStatus === statusFilter.value)
  }
  if (typeFilter.value) {
    list = list.filter(o => o.type === typeFilter.value)
  }
  if (onlyStarred.value) {
    list = list.filter(o => follows.getFollow(o.id)?.starred)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(o =>
      o.title?.toLowerCase().includes(q) ||
      o.description?.toLowerCase().includes(q) ||
      (Array.isArray(o.tags) && o.tags.some(t => t.toLowerCase().includes(q)))
    )
  }

  return list
})

const hasFilters = computed(() =>
  !!statusFilter.value || !!typeFilter.value || onlyStarred.value || !!searchQuery.value.trim()
)

function clearFilters() {
  statusFilter.value = ''
  typeFilter.value = ''
  searchQuery.value = ''
  onlyStarred.value = false
}

function countByStatus(val) {
  const followedIds = new Set(follows.follows.map(f => f.opportunityId))
  return opps.approved
    .filter(o => followedIds.has(o.id))
    .filter(o => follows.getFollow(o.id)?.personalStatus === val)
    .length
}

function countByType(val) {
  const followedIds = new Set(follows.follows.map(f => f.opportunityId))
  return opps.approved.filter(o => followedIds.has(o.id) && o.type === val).length
}

const groupOrder = [
  { type: 'convocatoria', label: 'Convocatorias' },
  { type: 'grant', label: 'Grants' },
  { type: 'fuente', label: 'Fuentes' },
  { type: 'capacitacion', label: 'Capacitaciones' },
  { type: 'red', label: 'Redes' },
]

const showGroups = computed(() => !typeFilter.value)

const groupedOpportunities = computed(() =>
  groupOrder.map(({ type, label }) => ({
    type,
    label,
    items: followedOpportunities.value.filter(o => o.type === type),
  })).filter(g => g.items.length > 0)
)

const typeLabel = {
  fuente: 'Fuente',
  convocatoria: 'Convocatoria',
  grant: 'Grant',
  capacitacion: 'Capacitación',
  red: 'Red',
}

function exportCSV() {
  const headers = ['Título', 'Tipo', 'Estado', 'Destacada', 'URL', 'Descripción', 'Tags', 'Fecha límite', 'Monto', 'Notas']

  const rows = followedOpportunities.value.map(opp => {
    const follow = follows.getFollow(opp.id)
    const rawDate = opp.deadline || opp.fecha
    const dateStr = rawDate
      ? (rawDate?.toDate ? rawDate.toDate() : new Date(rawDate)).toLocaleDateString('es-ES')
      : ''
    const notesStr = (follow?.notes ?? [])
      .map(n => `[${new Date(n.createdAt).toLocaleDateString('es-ES')}] ${n.text}`)
      .join(' | ')

    return [
      opp.title ?? '',
      typeLabel[opp.type] ?? opp.type,
      follow?.personalStatus ?? '',
      follow?.starred ? 'Sí' : 'No',
      opp.url ?? '',
      opp.description ?? '',
      (opp.tags ?? []).join(', '),
      dateStr,
      opp.monto ?? '',
      notesStr,
    ]
  })

  const escape = v => `"${String(v).replace(/"/g, '""')}"`
  const csv = [headers, ...rows].map(row => row.map(escape).join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `mi-lista-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <!-- Header + filters bar -->
    <div class="sticky top-0 z-10 bg-bg-base border-b border-border-base px-4 md:px-6 py-3 space-y-2.5">
      <!-- Row 1: title + search + limpiar -->
      <div class="flex items-center gap-3 flex-wrap">
        <div class="shrink-0">
          <h2 class="text-base font-semibold text-text-primary leading-tight">Mi Lista</h2>
          <p class="text-xs text-text-muted leading-tight">Mostrando {{ followedOpportunities.length }} de {{ follows.follows.length }}</p>
        </div>
        <div class="flex-1 relative min-w-32 max-w-xs">
          <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar..."
            class="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border-base bg-bg-surface text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
          />
        </div>
        <button v-if="hasFilters" @click="clearFilters" class="text-xs text-accent hover:underline shrink-0">× Limpiar</button>
        <button
          v-if="followedOpportunities.length > 0"
          @click="exportCSV"
          class="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border-base text-xs text-text-muted hover:text-accent hover:border-accent transition-colors"
          title="Exportar lista a CSV"
        >
          <Download class="w-3.5 h-3.5" />
          CSV
        </button>
      </div>

      <!-- Row 2: filters -->
      <div class="flex items-center gap-2 flex-wrap">
        <select
          v-model="typeFilter"
          class="px-2 py-1.5 rounded-lg border border-border-base bg-bg-surface text-xs focus:outline-none focus:border-accent transition-colors"
          :class="typeFilter ? 'text-text-primary font-medium' : 'text-text-muted'"
        >
          <option value="">Todos los tipos</option>
          <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }} ({{ countByType(opt.value) }})
          </option>
        </select>

        <select
          v-model="statusFilter"
          class="px-2 py-1.5 rounded-lg border border-border-base bg-bg-surface text-xs focus:outline-none focus:border-accent transition-colors"
          :class="statusFilter ? 'text-text-primary font-medium' : 'text-text-muted'"
        >
          <option value="">Todos los estados</option>
          <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }} ({{ countByStatus(opt.value) }})
          </option>
        </select>

        <button
          @click="onlyStarred = !onlyStarred"
          class="px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors"
          :class="onlyStarred ? 'bg-accent text-bg-base border-accent' : 'border-border-base text-text-muted hover:text-text-primary hover:border-accent'"
        >★ Destacadas</button>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-6">
      <div v-if="follows.loading || opps.loading" class="flex items-center justify-center py-16">
        <p class="text-text-muted text-sm">Cargando...</p>
      </div>

      <div v-else-if="followedOpportunities.length === 0" class="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <template v-if="hasFilters">
          <p class="text-text-muted">Sin resultados para los filtros seleccionados.</p>
          <button
            @click="clearFilters"
            class="px-4 py-2 rounded-lg border border-border-base text-text-muted text-sm hover:text-accent hover:border-accent transition-colors"
          >Limpiar filtros</button>
        </template>
        <template v-else>
          <p class="text-text-muted">No sigues ninguna oportunidad aún.</p>
          <p class="text-text-muted text-sm">Agrega desde el listado principal con "+ Seguir".</p>
          <router-link
            to="/"
            class="mt-2 px-4 py-2 rounded-lg bg-accent text-bg-base text-sm font-medium hover:opacity-90 transition-opacity"
          >Ver oportunidades</router-link>
        </template>
      </div>

      <!-- Grouped by type -->
      <template v-else-if="showGroups">
        <div v-for="group in groupedOpportunities" :key="group.type" class="mb-8">
          <div class="flex items-center gap-3 mb-3">
            <h3 class="text-xs font-semibold text-text-muted uppercase tracking-wider shrink-0">{{ group.label }}</h3>
            <div class="flex-1 h-px bg-border-base"></div>
            <span class="text-xs text-text-muted shrink-0">{{ group.items.length }}</span>
          </div>
          <div class="grid gap-3 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            <OpportunityCard
              v-for="opp in group.items"
              :key="opp.id"
              :opportunity="opp"
              :show-follow-panel="true"
            />
          </div>
        </div>
      </template>

      <!-- Flat list (when filtering by type) -->
      <div v-else class="grid gap-3 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        <OpportunityCard
          v-for="opp in followedOpportunities"
          :key="opp.id"
          :opportunity="opp"
          :show-follow-panel="true"
        />
      </div>
    </div>
  </div>
</template>
