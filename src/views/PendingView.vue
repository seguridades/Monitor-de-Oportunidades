<script setup>
import { ref, computed } from 'vue'
import { ExternalLink } from 'lucide-vue-next'
import { useOpportunitiesStore } from '@/stores/opportunities'
import { toast } from 'vue-sonner'
import OpportunityForm from '@/components/opportunities/OpportunityForm.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppConfirm from '@/components/ui/AppConfirm.vue'
import AppTag from '@/components/ui/AppTag.vue'

const opps = useOpportunitiesStore()

const editingOpp = ref(null)
const rejectTarget = ref(null)
const batchFilter = ref('')
const typeFilter = ref('')
const selectedIds = ref(new Set())
const approvingBatch = ref(false)
const showDeleteAllConfirm = ref(false)
const showDeleteSelectedConfirm = ref(false)
const deletingAll = ref(false)

const typeLabel = {
  fuente: 'Fuente', convocatoria: 'Convocatoria', grant: 'Grant',
  capacitacion: 'Capacitación', evento: 'Evento / Actividad', red: 'Red',
  linea_ayuda: 'Línea de Ayuda',
}

const groupOrder = ['fuente', 'convocatoria', 'grant', 'capacitacion', 'evento', 'red', 'linea_ayuda']
const typeBadgeClass = {
  fuente:       'bg-zinc-200 text-zinc-700 dark:bg-zinc-700/50 dark:text-zinc-300',
  convocatoria: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-400',
  grant:        'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  capacitacion: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400',
  evento:       'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
  red:          'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400',
  linea_ayuda:  'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400',
}

// Unique import batches present in pending list
const availableBatches = computed(() => {
  const batches = opps.pending
    .map(o => o.importBatch)
    .filter(Boolean)
  return [...new Set(batches)].sort()
})

const filteredPending = computed(() => {
  return opps.pending.filter(o => {
    if (batchFilter.value && o.importBatch !== batchFilter.value) return false
    if (typeFilter.value && o.type !== typeFilter.value) return false
    return true
  })
})

const availableTypes = computed(() => {
  const batchFiltered = batchFilter.value
    ? opps.pending.filter(o => o.importBatch === batchFilter.value)
    : opps.pending
  const present = new Set(batchFiltered.map(o => o.type))
  return groupOrder.filter(t => present.has(t))
})

const groupedPending = computed(() => {
  const map = {}
  filteredPending.value.forEach(o => {
    if (!map[o.type]) map[o.type] = []
    map[o.type].push(o)
  })
  return groupOrder
    .filter(t => map[t]?.length)
    .map(t => ({ type: t, label: typeLabel[t] ?? t, items: map[t] }))
})

function toggleSelect(id) {
  const s = new Set(selectedIds.value)
  s.has(id) ? s.delete(id) : s.add(id)
  selectedIds.value = s
}

function toggleSelectAll() {
  const visibleIds = filteredPending.value.map(o => o.id)
  const allSelected = visibleIds.every(id => selectedIds.value.has(id))
  const s = new Set(selectedIds.value)
  if (allSelected) {
    visibleIds.forEach(id => s.delete(id))
  } else {
    visibleIds.forEach(id => s.add(id))
  }
  selectedIds.value = s
}

const allVisibleSelected = computed(() => {
  const visible = filteredPending.value
  return visible.length > 0 && visible.every(o => selectedIds.value.has(o.id))
})

async function approveSelected() {
  const ids = [...selectedIds.value]
  if (!ids.length) return
  approvingBatch.value = true
  try {
    await opps.approveBatch(ids)
    selectedIds.value = new Set()
    toast.success(`${ids.length} oportunidades aprobadas`)
  } catch {
    toast.error('Error al aprobar')
  } finally {
    approvingBatch.value = false
  }
}

function formatDate(ts) {
  if (!ts) return null
  const d = ts?.toDate ? ts.toDate() : new Date(ts)
  if (isNaN(d.getTime())) return null
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

function deadlineDays(ts) {
  if (!ts) return null
  const d = ts?.toDate ? ts.toDate() : new Date(ts)
  if (isNaN(d.getTime())) return null
  const diff = Math.ceil((d - new Date()) / (1000 * 60 * 60 * 24))
  return diff
}

async function approve(opp) {
  try {
    await opps.approveOpportunity(opp.id)
    toast.success(`"${opp.title}" aprobada`)
  } catch {
    toast.error('Error al aprobar')
  }
}

async function confirmReject() {
  const opp = rejectTarget.value
  rejectTarget.value = null
  try {
    await opps.rejectOpportunity(opp.id)
    toast.success('Oportunidad rechazada')
  } catch {
    toast.error('Error al rechazar')
  }
}

async function deleteSelected() {
  showDeleteSelectedConfirm.value = false
  const ids = [...selectedIds.value]
  if (!ids.length) return
  try {
    await opps.deleteBatch(ids)
    selectedIds.value = new Set()
    toast.success(`${ids.length} oportunidades eliminadas`)
  } catch {
    toast.error('Error al eliminar')
  }
}

async function deleteAllFiltered() {
  showDeleteAllConfirm.value = false
  deletingAll.value = true
  const ids = filteredPending.value.map(o => o.id)
  try {
    await opps.deleteBatch(ids)
    selectedIds.value = new Set()
    toast.success(`${ids.length} oportunidades eliminadas`)
  } catch {
    toast.error('Error al eliminar')
  } finally {
    deletingAll.value = false
  }
}

async function handleEditSubmit(data) {
  try {
    await opps.updateOpportunity(editingOpp.value.id, data)
    toast.success('Oportunidad actualizada')
    editingOpp.value = null
  } catch {
    toast.error('Error al guardar')
  }
}
</script>

<template>
  <div class="p-6 max-w-3xl">
    <div class="mb-6">
      <h1 class="text-xl font-semibold text-text-primary">
        Pendientes de aprobación
        <span class="text-text-muted font-normal text-sm ml-1">{{ opps.pending.length }}</span>
      </h1>
      <p class="text-text-muted text-sm mt-0.5">Revisa, edita si es necesario, y luego aprueba o rechaza</p>
    </div>

    <div v-if="opps.loading" class="py-16 flex items-center justify-center">
      <p class="text-text-muted text-sm">Cargando...</p>
    </div>

    <div v-else-if="opps.pending.length === 0" class="py-16 flex flex-col items-center justify-center gap-2 text-center">
      <p class="text-text-muted">No hay propuestas pendientes</p>
      <p class="text-text-muted text-sm">¡Todo al día!</p>
    </div>

    <div v-else class="space-y-5">
      <!-- Filter bar -->
      <div class="flex flex-wrap items-center gap-2">
        <select
          v-if="availableBatches.length > 0"
          v-model="batchFilter"
          class="text-xs border border-border-base rounded-lg px-3 py-1.5 bg-bg-surface text-text-primary focus:outline-none focus:border-accent"
        >
          <option value="">Todos los lotes ({{ opps.pending.length }})</option>
          <option v-for="b in availableBatches" :key="b" :value="b">{{ b }} ({{ opps.pending.filter(o => o.importBatch === b).length }})</option>
        </select>
        <select
          v-if="availableTypes.length > 1"
          v-model="typeFilter"
          class="text-xs border border-border-base rounded-lg px-3 py-1.5 bg-bg-surface text-text-primary focus:outline-none focus:border-accent"
        >
          <option value="">Todos los tipos</option>
          <option v-for="t in availableTypes" :key="t" :value="t">{{ typeLabel[t] }}</option>
        </select>
        <div class="flex items-center gap-2 ml-auto">
          <label class="flex items-center gap-1.5 text-xs text-text-muted cursor-pointer select-none">
            <input
              type="checkbox"
              :checked="allVisibleSelected"
              @change="toggleSelectAll"
              class="rounded accent-accent"
            />
            Seleccionar todo
          </label>
          <button
            v-if="selectedIds.size > 0"
            @click="approveSelected"
            :disabled="approvingBatch"
            class="px-3 py-1.5 rounded-lg bg-accent text-bg-base text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {{ approvingBatch ? 'Aprobando…' : `Aprobar seleccionadas (${selectedIds.size})` }}
          </button>
          <button
            v-if="selectedIds.size > 0"
            @click="showDeleteSelectedConfirm = true"
            class="px-3 py-1.5 rounded-lg bg-danger/10 border border-danger/30 text-danger text-xs font-medium hover:bg-danger/20 transition-colors"
          >
            Eliminar seleccionadas ({{ selectedIds.size }})
          </button>
          <button
            @click="showDeleteAllConfirm = true"
            :disabled="deletingAll || filteredPending.length === 0"
            class="px-3 py-1.5 rounded-lg bg-danger/10 border border-danger/30 text-danger text-xs font-medium hover:bg-danger/20 transition-colors disabled:opacity-40"
          >
            {{ deletingAll ? 'Eliminando…' : `Eliminar todos (${filteredPending.length})` }}
          </button>
        </div>
      </div>

      <!-- Grouped by type -->
      <template v-for="group in groupedPending" :key="group.type">
        <div class="space-y-3">
          <!-- Section header -->
          <div class="flex items-center gap-2">
            <span
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
              :class="typeBadgeClass[group.type] ?? 'bg-zinc-200 text-zinc-700'"
            >
              {{ group.label }}
            </span>
            <span class="text-xs text-text-muted">{{ group.items.length }}</span>
            <div class="flex-1 h-px bg-border-base" />
          </div>

          <!-- Cards -->
          <div
            v-for="opp in group.items"
            :key="opp.id"
            class="bg-bg-surface border border-border-base rounded-xl overflow-hidden"
            :class="{ 'ring-2 ring-accent/40': selectedIds.has(opp.id) }"
          >
        <!-- Header -->
        <div class="px-4 pt-4 pb-3">
          <div class="flex items-center gap-2 mb-2 flex-wrap">
            <input
              type="checkbox"
              :checked="selectedIds.has(opp.id)"
              @change="toggleSelect(opp.id)"
              class="rounded accent-accent shrink-0"
            />
            <span
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium shrink-0"
              :class="typeBadgeClass[opp.type] ?? 'bg-zinc-200 text-zinc-700'"
            >
              {{ typeLabel[opp.type] ?? opp.type }}
            </span>
            <span
              v-if="opp.importBatch"
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 shrink-0"
            >
              {{ opp.importBatch }}
            </span>
            <span class="text-xs text-text-muted">
              Por <span class="text-text-primary">{{ opp.addedByName || opp.addedBy || 'Desconocido' }}</span>
              · {{ formatDate(opp.createdAt) }}
            </span>
          </div>

          <h3 class="font-semibold text-text-primary text-sm leading-snug mb-1">{{ opp.title }}</h3>
          <p v-if="opp.description" class="text-xs text-text-muted leading-relaxed mb-3">{{ opp.description }}</p>

          <!-- Type-specific fields -->
          <div class="text-xs text-text-muted space-y-1 mb-3">
            <!-- fuente -->
            <div v-if="opp.type === 'fuente' && opp.freq">
              Frecuencia: <span class="text-text-primary capitalize">{{ opp.freq }}</span>
            </div>
            <!-- convocatoria / grant -->
            <template v-if="opp.type === 'convocatoria' || opp.type === 'grant'">
              <div v-if="opp.monto">
                Monto: <span class="text-text-primary font-medium">{{ opp.monto }}</span>
              </div>
              <div v-if="opp.quien_puede_aplicar">
                Aplica: <span class="text-text-primary">{{ opp.quien_puede_aplicar }}</span>
              </div>
              <div v-if="opp.deadline">
                Cierre:
                <span
                  class="text-text-primary"
                  :class="{
                    'text-danger font-semibold': deadlineDays(opp.deadline) !== null && deadlineDays(opp.deadline) <= 3,
                    'text-amber font-medium': deadlineDays(opp.deadline) !== null && deadlineDays(opp.deadline) > 3 && deadlineDays(opp.deadline) <= 14,
                  }"
                >
                  {{ formatDate(opp.deadline) }}
                  <span v-if="deadlineDays(opp.deadline) !== null">({{ deadlineDays(opp.deadline) }}d)</span>
                </span>
              </div>
            </template>
            <!-- capacitacion -->
            <template v-if="opp.type === 'capacitacion'">
              <div v-if="opp.fecha">Fecha: <span class="text-text-primary">{{ formatDate(opp.fecha) }}</span></div>
              <div v-if="opp.modalidad">Modalidad: <span class="text-text-primary capitalize">{{ opp.modalidad }}</span></div>
              <div v-if="opp.dirigido_a">Para: <span class="text-text-primary">{{ opp.dirigido_a }}</span></div>
            </template>
            <!-- evento -->
            <template v-if="opp.type === 'evento'">
              <div v-if="opp.fecha">Fecha: <span class="text-text-primary">{{ formatDate(opp.fecha) }}</span></div>
              <div v-if="opp.modalidad">Modalidad: <span class="text-text-primary capitalize">{{ opp.modalidad }}</span></div>
              <div v-if="opp.lugar">Lugar: <span class="text-text-primary">{{ opp.lugar }}</span></div>
              <div v-if="opp.dirigido_a">Para: <span class="text-text-primary">{{ opp.dirigido_a }}</span></div>
            </template>
            <!-- linea_ayuda -->
            <template v-if="opp.type === 'linea_ayuda'">
              <div v-if="opp.respuesta_rapida" class="text-rose-600 dark:text-rose-400 font-medium">⚡ Respuesta rápida</div>
              <div v-if="opp.como_acceder">Acceso: <span class="text-text-primary">{{ opp.como_acceder }}</span></div>
              <div v-if="opp.disponibilidad">Disponibilidad: <span class="text-text-primary">{{ opp.disponibilidad }}</span></div>
              <div v-if="opp.para_quien">Para: <span class="text-text-primary">{{ opp.para_quien }}</span></div>
            </template>
            <!-- red -->
            <div v-if="opp.type === 'red' && opp.como_unirse">
              Cómo unirse: <span class="text-text-primary">{{ opp.como_unirse }}</span>
            </div>
          </div>

          <!-- Tags -->
          <div v-if="opp.tags?.length" class="flex flex-wrap gap-1 mb-3">
            <AppTag v-for="tag in opp.tags" :key="tag" :label="tag" />
          </div>

          <!-- URL -->
          <a
            v-if="opp.url"
            :href="opp.url"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 text-xs text-accent hover:underline"
          >
            <ExternalLink class="w-3.5 h-3.5" />
            Ver enlace
          </a>
        </div>

        <!-- Actions -->
        <div class="px-4 py-3 bg-bg-surface-2 border-t border-border-base flex items-center gap-2">
          <button
            @click="approve(opp)"
            class="px-3 py-1.5 rounded-lg bg-accent text-bg-base text-xs font-medium hover:opacity-90 transition-opacity"
          >
            Aprobar
          </button>
          <button
            @click="rejectTarget = opp"
            class="px-3 py-1.5 rounded-lg bg-danger/10 border border-danger/30 text-danger text-xs font-medium hover:bg-danger/20 transition-colors"
          >
            Rechazar
          </button>
          <div class="flex-1" />
          <button
            @click="editingOpp = opp"
            class="px-3 py-1.5 rounded-lg border border-border-base text-text-muted text-xs hover:text-text-primary hover:border-accent transition-colors"
          >
            Editar antes de aprobar
          </button>
        </div>
          </div><!-- end card -->
        </div><!-- end group cards -->
      </template><!-- end group -->
    </div>
  </div>

  <!-- Edit modal -->
  <AppModal
    :open="!!editingOpp"
    title="Editar propuesta"
    @close="editingOpp = null"
  >
    <OpportunityForm
      :opportunity="editingOpp"
      @submit="handleEditSubmit"
      @cancel="editingOpp = null"
    />
  </AppModal>

  <!-- Delete selected confirm -->
  <AppConfirm
    :open="showDeleteSelectedConfirm"
    title="Eliminar seleccionadas"
    :message="`¿Eliminar las ${selectedIds.size} oportunidades seleccionadas? Esta acción no se puede deshacer.`"
    confirm-label="Eliminar"
    @confirm="deleteSelected"
    @cancel="showDeleteSelectedConfirm = false"
  />

  <!-- Delete all confirm -->
  <AppConfirm
    :open="showDeleteAllConfirm"
    title="Eliminar pendientes"
    :message="`¿Eliminar las ${filteredPending.length} oportunidades pendientes${batchFilter ? ` del lote &quot;${batchFilter}&quot;` : ''}? Esta acción no se puede deshacer.`"
    confirm-label="Eliminar todas"
    @confirm="deleteAllFiltered"
    @cancel="showDeleteAllConfirm = false"
  />

  <!-- Reject confirm -->
  <AppConfirm
    :open="!!rejectTarget"
    title="Rechazar propuesta"
    :message="rejectTarget ? `¿Rechazar y eliminar &quot;${rejectTarget.title}&quot;? Esta acción no se puede deshacer.` : ''"
    confirm-label="Rechazar"
    @confirm="confirmReject"
    @cancel="rejectTarget = null"
  />
</template>
