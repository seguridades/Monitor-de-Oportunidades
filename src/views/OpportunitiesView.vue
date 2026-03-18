<script setup>
import { ref, computed } from 'vue'
import { toast } from 'vue-sonner'
import { Plus, Search } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useOpportunitiesStore } from '@/stores/opportunities'
import { useFollowsStore } from '@/stores/follows'
import OpportunityCard from '@/components/opportunities/OpportunityCard.vue'
import OpportunityForm from '@/components/opportunities/OpportunityForm.vue'
import AppModal from '@/components/ui/AppModal.vue'
import { RouterLink } from 'vue-router'

const auth = useAuthStore()
const opps = useOpportunitiesStore()
const follows = useFollowsStore()

// Filters
const typeFilter = ref('todas')
const statusFilters = ref([])
const fitFilters = ref([])
const searchQuery = ref('')

// Modal state
const showModal = ref(false)
const editingOpportunity = ref(null)

const typeOptions = [
  { value: 'todas', label: 'Todas' },
  { value: 'fuente', label: 'Fuentes' },
  { value: 'convocatoria', label: 'Convocatorias' },
  { value: 'grant', label: 'Grants' },
  { value: 'capacitacion', label: 'Capacitaciones' },
  { value: 'red', label: 'Redes' },
  { value: 'featured', label: 'Destacadas' },
]

const statusOptions = [
  { value: 'nueva', label: 'Nueva' },
  { value: 'en_revision', label: 'En revisión' },
  { value: 'aplicada', label: 'Aplicada' },
  { value: 'descartada', label: 'Descartada' },
]

const fitOptions = [
  { value: 'Alto', label: 'Alto' },
  { value: 'Bueno', label: 'Bueno' },
  { value: 'Selectivo', label: 'Selectivo' },
]

// Count helpers
function countByType(type) {
  if (type === 'todas') return opps.approved.length
  if (type === 'featured') return opps.approved.filter(o => o.featured).length
  return opps.approved.filter(o => o.type === type).length
}
function countByStatus(status) {
  return opps.approved.filter(o => o.status === status).length
}
function countByFit(fit) {
  return opps.approved.filter(o => o.fit === fit).length
}

// Filtered list
const fitOrder = { Alto: 0, Bueno: 1, Selectivo: 2 }

const filteredOpportunities = computed(() => {
  let list = opps.approved

  // Type filter
  if (typeFilter.value === 'featured') {
    list = list.filter(o => o.featured)
  } else if (typeFilter.value !== 'todas') {
    list = list.filter(o => o.type === typeFilter.value)
  }

  // Status filter
  if (statusFilters.value.length > 0) {
    list = list.filter(o => statusFilters.value.includes(o.status))
  }

  // Fit filter
  if (fitFilters.value.length > 0) {
    list = list.filter(o => fitFilters.value.includes(o.fit))
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

  // Sort: featured first, then fit order, then deadline asc (null last)
  return [...list].sort((a, b) => {
    if (a.featured && !b.featured) return -1
    if (!a.featured && b.featured) return 1
    const fitA = fitOrder[a.fit] ?? 99
    const fitB = fitOrder[b.fit] ?? 99
    if (fitA !== fitB) return fitA - fitB
    // deadline sort
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

function toggleFitFilter(val) {
  const idx = fitFilters.value.indexOf(val)
  if (idx >= 0) fitFilters.value.splice(idx, 1)
  else fitFilters.value.push(val)
}

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
      toast.success(auth.isMember ? 'Oportunidad agregada' : 'Enviada para aprobación')
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
    <aside class="w-52 shrink-0 border-r border-border-base bg-bg-surface overflow-y-auto p-4 space-y-5">
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

      <!-- Relevancia -->
      <div>
        <p class="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Relevancia</p>
        <div class="space-y-0.5">
          <label
            v-for="opt in fitOptions"
            :key="opt.value"
            class="flex items-center justify-between px-2 py-1.5 rounded-lg text-sm text-text-muted hover:text-text-primary hover:bg-bg-surface-2 cursor-pointer transition-colors"
          >
            <div class="flex items-center gap-2">
              <input
                type="checkbox"
                :checked="fitFilters.includes(opt.value)"
                @change="toggleFitFilter(opt.value)"
                class="w-3.5 h-3.5 accent-accent"
              />
              {{ opt.label }}
            </div>
            <span class="text-xs">{{ countByFit(opt.value) }}</span>
          </label>
        </div>
      </div>
    </aside>

    <!-- Main content -->
    <div class="flex-1 min-w-0 overflow-y-auto">
      <!-- Content header -->
      <div class="sticky top-0 z-10 bg-bg-base border-b border-border-base px-6 py-3 flex items-center gap-3">
        <h2 class="text-base font-semibold text-text-primary shrink-0">
          Oportunidades
          <span class="text-text-muted font-normal text-sm ml-1">{{ filteredOpportunities.length }}</span>
        </h2>

        <!-- Search -->
        <div class="flex-1 relative max-w-xs">
          <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar..."
            class="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border-base bg-bg-surface text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        <!-- Pending link (member) -->
        <RouterLink
          v-if="auth.isMember && opps.pending.length > 0"
          to="/pending"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber/10 text-amber text-xs font-medium border border-amber/30 hover:bg-amber/20 transition-colors"
        >
          {{ opps.pending.length }} pendiente{{ opps.pending.length !== 1 ? 's' : '' }} de aprobación
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
        <div v-if="opps.loading" class="flex items-center justify-center py-16">
          <p class="text-text-muted text-sm">Cargando...</p>
        </div>

        <div v-else-if="filteredOpportunities.length === 0" class="flex flex-col items-center justify-center py-16 gap-3">
          <p class="text-text-muted">No se encontraron oportunidades</p>
          <p class="text-text-muted text-sm">Prueba cambiando los filtros o la búsqueda</p>
        </div>

        <div v-else class="grid gap-3 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          <OpportunityCard
            v-for="opp in filteredOpportunities"
            :key="opp.id"
            :opportunity="opp"
            @edit="openEdit"
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
