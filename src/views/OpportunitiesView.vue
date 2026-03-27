<script setup>
import { ref, computed } from 'vue'
import { toast } from 'vue-sonner'
import { Plus, Search, X } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useOpportunitiesStore } from '@/stores/opportunities'
import { useFollowsStore } from '@/stores/follows'
import OpportunityCard from '@/components/opportunities/OpportunityCard.vue'
import OpportunityForm from '@/components/opportunities/OpportunityForm.vue'
import AppModal from '@/components/ui/AppModal.vue'
import SkeletonCard from '@/components/ui/SkeletonCard.vue'
import { RouterLink } from 'vue-router'

const auth = useAuthStore()
const opps = useOpportunitiesStore()
const follows = useFollowsStore()

// Filters
const typeFilter = ref('todas')
const statusFilters = ref([])
const searchQuery = ref('')
const tagFilter = ref('')
const hideFollowed = ref(false)
const showFilterPanel = ref(false)
const showArchived = ref(false)

// Modal state
const showModal = ref(false)
const editingOpportunity = ref(null)

const typeOptions = [
  { value: 'todas', label: 'Todas' },
  { value: 'fuente', label: 'Fuentes' },
  { value: 'convocatoria', label: 'Convocatorias' },
  { value: 'grant', label: 'Grants' },
  { value: 'capacitacion', label: 'Capacitaciones' },
  { value: 'evento', label: 'Eventos / Actividades' },
  { value: 'red', label: 'Redes' },
  { value: 'linea_ayuda', label: 'Líneas de Ayuda' },
  { value: 'beca', label: 'Becas / Fellowships' },
]

const statusOptions = [
  { value: 'nueva', label: 'Nueva' },
  { value: 'en_revision', label: 'En revisión' },
  { value: 'aplicada', label: 'Aplicada' },
  { value: 'descartada', label: 'Descartada' },
]

// Group config
const groupOrder = [
  { type: 'convocatoria', label: 'Convocatorias' },
  { type: 'grant', label: 'Grants' },
  { type: 'fuente', label: 'Fuentes' },
  { type: 'capacitacion', label: 'Capacitaciones' },
  { type: 'evento', label: 'Eventos / Actividades' },
  { type: 'red', label: 'Redes' },
  { type: 'linea_ayuda', label: 'Líneas de Ayuda' },
  { type: 'beca', label: 'Becas / Fellowships' },
]

// Count helpers
function countByType(type) {
  if (type === 'todas') return opps.approved.length
  return opps.approved.filter(o => o.type === type).length
}
function countByStatus(status) {
  return opps.approved.filter(o => o.status === status).length
}
const filteredOpportunities = computed(() => {
  let list = opps.approved

  // Type filter
  if (typeFilter.value !== 'todas') {
    list = list.filter(o => o.type === typeFilter.value)
  }

  // Status filter
  if (statusFilters.value.length > 0) {
    list = list.filter(o => statusFilters.value.includes(o.status))
  }

  // Tag filter
  if (tagFilter.value) {
    list = list.filter(o => Array.isArray(o.tags) && o.tags.includes(tagFilter.value))
  }

  // Hide followed
  if (hideFollowed.value) {
    list = list.filter(o => !follows.isFollowing(o.id))
  }

  // Search
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(o =>
      o.title?.toLowerCase().includes(q) ||
      o.description?.toLowerCase().includes(q) ||
      (Array.isArray(o.tags) && o.tags.some(t => t.toLowerCase().includes(q)))
    )
  }

  // Sort: deadline asc (null last)
  return [...list].sort((a, b) => {
    const dA = a.deadline?.toDate ? a.deadline.toDate() : a.deadline ? new Date(a.deadline) : null
    const dB = b.deadline?.toDate ? b.deadline.toDate() : b.deadline ? new Date(b.deadline) : null
    if (!dA && !dB) return 0
    if (!dA) return 1
    if (!dB) return -1
    return dA - dB
  })
})

function toggleStatusFilter(val) {
  const idx = statusFilters.value.indexOf(val)
  if (idx >= 0) statusFilters.value.splice(idx, 1)
  else statusFilters.value.push(val)
}

const hasActiveFilters = computed(() =>
  typeFilter.value !== 'todas' ||
  statusFilters.value.length > 0 ||
  searchQuery.value.trim() !== '' ||
  tagFilter.value !== '' ||
  hideFollowed.value
)

function clearFilters() {
  typeFilter.value = 'todas'
  statusFilters.value = []
  searchQuery.value = ''
  tagFilter.value = ''
  hideFollowed.value = false
}

function handleFilterTag(tag) {
  tagFilter.value = tag
}

const showGroups = computed(() => typeFilter.value === 'todas')

const groupedOpportunities = computed(() =>
  groupOrder.map(({ type, label }) => ({
    type,
    label,
    items: filteredOpportunities.value.filter(o => o.type === type),
  }))
)

function openCreate() {
  editingOpportunity.value = null
  showModal.value = true
}

function openEdit(opp) {
  editingOpportunity.value = opp
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingOpportunity.value = null
}

async function handleFormSubmit(data) {
  try {
    if (editingOpportunity.value) {
      await opps.updateOpportunity(editingOpportunity.value.id, data)
      toast.success('Oportunidad actualizada')
    } else {
      await opps.addOpportunity(data)
      toast.success(auth.canApprove ? 'Oportunidad agregada' : 'Enviada para aprobación')
    }
    closeModal()
  } catch (e) {
    toast.error('Error al guardar')
  }
}
</script>

<template>
  <div class="flex h-full">
    <!-- Filter panel -->
    <aside
      class="w-52 shrink-0 border-r border-border-base bg-bg-surface overflow-y-auto p-4 space-y-5"
      :class="showFilterPanel ? 'block' : 'hidden md:block'"
    >
      <!-- Header -->
      <div class="flex items-center justify-between">
        <p class="text-xs font-semibold text-text-muted uppercase tracking-wider">Filtros</p>
        <button
          v-if="hasActiveFilters"
          @click="clearFilters"
          class="text-xs text-accent hover:underline"
        >
          × Limpiar
        </button>
      </div>

      <!-- Vista / Type -->
      <div>
        <p class="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Vista</p>
        <div class="space-y-0.5">
          <button
            v-for="opt in typeOptions"
            :key="opt.value"
            @click="typeFilter = opt.value"
            class="w-full text-left flex items-center justify-between px-2 py-1.5 rounded-lg text-sm transition-colors"
            :class="typeFilter === opt.value
              ? 'bg-bg-surface-2 text-text-primary font-medium'
              : 'text-text-muted hover:text-text-primary hover:bg-bg-surface-2'"
          >
            <span>{{ opt.label }}</span>
            <span class="text-xs text-text-muted">{{ countByType(opt.value) }}</span>
          </button>
        </div>
      </div>

      <!-- Estado -->
      <div>
        <p class="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Estado</p>
        <div class="space-y-0.5">
          <label
            v-for="opt in statusOptions"
            :key="opt.value"
            class="flex items-center justify-between px-2 py-1.5 rounded-lg text-sm text-text-muted hover:text-text-primary hover:bg-bg-surface-2 cursor-pointer transition-colors"
          >
            <div class="flex items-center gap-2">
              <input
                type="checkbox"
                :checked="statusFilters.includes(opt.value)"
                @change="toggleStatusFilter(opt.value)"
                class="w-3.5 h-3.5 accent-accent"
              />
              {{ opt.label }}
            </div>
            <span class="text-xs">{{ countByStatus(opt.value) }}</span>
          </label>
        </div>
      </div>


      <!-- Mi lista -->
      <div class="border-t border-border-base pt-4">
        <label class="flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-bg-surface-2 transition-colors">
          <button
            role="switch"
            :aria-checked="hideFollowed"
            @click="hideFollowed = !hideFollowed"
            class="relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none"
            :class="hideFollowed ? 'bg-accent' : 'bg-border-base'"
          >
            <span
              class="pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform"
              :class="hideFollowed ? 'translate-x-4' : 'translate-x-0'"
            />
          </button>
          <span class="text-sm" :class="hideFollowed ? 'text-text-primary' : 'text-text-muted'">
            Ocultar las que sigo
          </span>
        </label>
      </div>

    </aside>

    <!-- Main content -->
    <div class="flex-1 min-w-0 overflow-y-auto">
      <!-- Content header -->
      <div class="sticky top-0 z-10 bg-bg-base border-b border-border-base px-4 md:px-6 py-3 flex items-center gap-3 flex-wrap">
        <!-- Title + counter -->
        <div class="shrink-0">
          <h2 class="text-base font-semibold text-text-primary leading-tight">Oportunidades</h2>
          <p class="text-xs text-text-muted leading-tight">Mostrando {{ filteredOpportunities.length }} de {{ opps.approved.length }}</p>
        </div>

        <!-- Mobile filter toggle -->
        <button
          @click="showFilterPanel = !showFilterPanel"
          class="md:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-base text-text-muted text-sm hover:text-text-primary transition-colors"
          :class="showFilterPanel ? 'bg-bg-surface-2' : ''"
        >
          Filtros{{ hasActiveFilters ? ' ·' : '' }}
        </button>

        <!-- Search -->
        <div class="flex-1 relative min-w-32 max-w-xs">
          <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar..."
            class="w-full pl-8 py-1.5 rounded-lg border border-border-base bg-bg-surface text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
            :class="searchQuery ? 'pr-7' : 'pr-3'"
          />
          <button
            v-if="searchQuery"
            @click="searchQuery = ''"
            class="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- Clear all filters (when active and search not the only thing) -->
        <button
          v-if="hasActiveFilters"
          @click="clearFilters"
          class="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border-base text-xs text-text-muted hover:text-danger hover:border-danger/40 transition-colors"
        >
          <X class="w-3 h-3" /> Limpiar
        </button>

        <!-- Active tag pill -->
        <div
          v-if="tagFilter"
          class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-accent/10 text-accent border border-accent/30"
        >
          # {{ tagFilter }}
          <button @click="tagFilter = ''" class="hover:text-danger leading-none">×</button>
        </div>

        <!-- Pending link (member) -->
        <RouterLink
          v-if="auth.canApprove && opps.pending.length > 0"
          to="/pending"
          class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber/10 text-amber text-xs font-medium border border-amber/30 hover:bg-amber/20 transition-colors"
        >
          {{ opps.pending.length }} pendiente{{ opps.pending.length !== 1 ? 's' : '' }}
        </RouterLink>

        <!-- Add button -->
        <button
          @click="openCreate"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-bg-base text-sm font-medium hover:opacity-90 transition-opacity shrink-0"
        >
          <Plus class="w-4 h-4" />
          {{ auth.isMember ? 'Agregar' : 'Proponer' }}
        </button>
      </div>

      <!-- Cards list -->
      <div class="p-6">
        <div v-if="opps.loading" class="grid gap-3 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          <SkeletonCard v-for="n in 6" :key="n" />
        </div>

        <div v-else-if="filteredOpportunities.length === 0" class="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <template v-if="hasActiveFilters">
            <p class="text-text-primary font-medium">Sin resultados para los filtros actuales</p>
            <p class="text-text-muted text-sm">Intenta con otros términos o quitá algún filtro.</p>
            <button
              @click="clearFilters"
              class="mt-1 px-4 py-2 rounded-lg border border-border-base text-text-muted text-sm hover:text-accent hover:border-accent transition-colors"
            >
              Limpiar filtros
            </button>
          </template>
          <template v-else>
            <p class="text-text-primary font-medium">No hay oportunidades aún</p>
            <p class="text-text-muted text-sm">Agrega la primera usando el botón "+ Agregar".</p>
          </template>
        </div>

        <!-- Grouped by type (when "Todas" selected) -->
        <template v-else-if="showGroups">
          <template v-for="group in groupedOpportunities" :key="group.type">
            <div v-if="group.items.length > 0" class="mb-8">
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
                  @edit="openEdit"
                  @filter-tag="handleFilterTag"
                />
              </div>
            </div>
          </template>
        </template>

        <!-- Flat list (when filtering by type or other filters) -->
        <div v-else class="grid gap-3 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          <OpportunityCard
            v-for="opp in filteredOpportunities"
            :key="opp.id"
            :opportunity="opp"
            @edit="openEdit"
            @filter-tag="handleFilterTag"
          />
        </div>
      </div>

      <!-- Archived section (canEdit only) -->
      <div v-if="auth.canEdit && opps.archived.length > 0" class="mt-8">
        <button
          @click="showArchived = !showArchived"
          class="flex items-center gap-2 text-xs text-text-muted hover:text-text-primary transition-colors mb-3"
        >
          <span class="flex-1 h-px bg-border-base" />
          <span>{{ showArchived ? '▾' : '▸' }} Archivadas ({{ opps.archived.length }})</span>
          <span class="flex-1 h-px bg-border-base" />
        </button>
        <div v-if="showArchived" class="grid gap-3 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 opacity-60">
          <OpportunityCard
            v-for="opp in opps.archived"
            :key="opp.id"
            :opportunity="opp"
            @edit="openEdit"
            @filter-tag="handleFilterTag"
          />
        </div>
      </div>
    </div>
  </div>

  <!-- Create/Edit modal -->
  <AppModal
    :open="showModal"
    :title="editingOpportunity ? 'Editar oportunidad' : 'Nueva oportunidad'"
    @close="closeModal"
  >
    <OpportunityForm
      :opportunity="editingOpportunity"
      @submit="handleFormSubmit"
      @cancel="closeModal"
    />
  </AppModal>
</template>
