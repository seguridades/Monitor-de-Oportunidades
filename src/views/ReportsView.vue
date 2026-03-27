<script setup>
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { useReportsStore } from '@/stores/reports'
import { useOpportunitiesStore } from '@/stores/opportunities'
import OpportunityForm from '@/components/opportunities/OpportunityForm.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppConfirm from '@/components/ui/AppConfirm.vue'

const reports = useReportsStore()
const opps = useOpportunitiesStore()
const showResolved = ref(false)
const editingOpp = ref(null)
const deleteTarget = ref(null)

const reasonLabel = {
  link_roto: 'Link roto',
  desactualizada: 'Info desactualizada',
  duplicado: 'Duplicado',
  otro: 'Otro',
}

function formatDate(ts) {
  if (!ts) return ''
  const d = ts?.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

async function resolve(id) {
  try {
    await reports.resolveReport(id)
    toast.success('Reporte marcado como resuelto')
  } catch {
    toast.error('Error al actualizar')
  }
}

async function reopen(id) {
  try {
    await reports.reopenReport(id)
    toast.success('Reporte reabierto')
  } catch {
    toast.error('Error al actualizar')
  }
}

function getOpp(report) {
  return opps.allOpportunities.find(o => o.id === report.opportunityId) ?? null
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

async function handleArchive(report) {
  const opp = getOpp(report)
  if (!opp) return
  try {
    if (opp.archivada) {
      await opps.unarchiveOpportunity(opp.id)
      toast.success('Oportunidad desarchivada')
    } else {
      await opps.archiveOpportunity(opp.id)
      toast.success('Oportunidad archivada')
    }
  } catch {
    toast.error('Error al archivar')
  }
}

async function confirmDelete() {
  const id = deleteTarget.value
  deleteTarget.value = null
  try {
    await opps.deleteOpportunity(id)
    toast.success('Oportunidad eliminada')
  } catch {
    toast.error('Error al eliminar')
  }
}
</script>

<template>
  <div class="p-6 max-w-2xl">
    <div class="mb-6">
      <h1 class="text-xl font-semibold text-text-primary">
        Reportes
        <span v-if="reports.pending.length > 0" class="text-danger font-normal text-sm ml-1">{{ reports.pending.length }} pendiente{{ reports.pending.length !== 1 ? 's' : '' }}</span>
      </h1>
      <p class="text-text-muted text-sm mt-0.5">Oportunidades reportadas por usuarios para revisión</p>
    </div>

    <div v-if="reports.loading" class="py-16 text-center text-text-muted text-sm">Cargando...</div>

    <div v-else-if="reports.reports.length === 0" class="py-16 text-center">
      <p class="text-text-muted">Sin reportes aún</p>
    </div>

    <div v-else class="space-y-3">
      <!-- Pending reports -->
      <div v-if="reports.pending.length === 0" class="py-8 text-center text-text-muted text-sm">
        No hay reportes pendientes — todo al día.
      </div>

      <div
        v-for="r in reports.pending"
        :key="r.id"
        class="bg-bg-surface border border-border-base rounded-xl p-4 space-y-3"
      >
        <div class="flex items-start gap-3">
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-text-primary leading-snug">{{ r.opportunityTitle }}</p>
            <div class="flex items-center gap-2 mt-1 flex-wrap">
              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-danger/10 text-danger border border-danger/20">
                {{ reasonLabel[r.reason] ?? r.reason }}
              </span>
              <span class="text-xs text-text-muted">
                Por {{ r.reportedByName || 'Anónimo' }} · {{ formatDate(r.createdAt) }}
              </span>
            </div>
          </div>
          <button
            @click="resolve(r.id)"
            class="shrink-0 px-3 py-1.5 rounded-lg bg-accent text-bg-base text-xs font-medium hover:opacity-90 transition-opacity"
          >
            Resuelto
          </button>
        </div>
        <p v-if="r.comment" class="text-xs text-text-muted bg-bg-base rounded-lg px-3 py-2 leading-relaxed">
          "{{ r.comment }}"
        </p>

        <!-- Opp actions -->
        <div v-if="getOpp(r)" class="flex items-center gap-2 pt-1 border-t border-border-base flex-wrap">
          <span class="text-xs text-text-muted">Oportunidad:</span>
          <button
            @click="editingOpp = getOpp(r)"
            class="text-xs px-2.5 py-1 rounded-lg border border-border-base text-text-muted hover:text-text-primary hover:border-accent transition-colors"
          >
            Editar
          </button>
          <button
            @click="handleArchive(r)"
            class="text-xs px-2.5 py-1 rounded-lg border border-border-base text-text-muted hover:text-text-primary transition-colors"
          >
            {{ getOpp(r)?.archivada ? 'Desarchivar' : 'Archivar' }}
          </button>
          <button
            @click="deleteTarget = r.opportunityId"
            class="text-xs px-2.5 py-1 rounded-lg border border-danger/30 text-danger hover:bg-danger/10 transition-colors"
          >
            Eliminar
          </button>
        </div>
        <p v-else class="text-xs text-text-muted italic">La oportunidad ya no existe.</p>
      </div>

      <!-- Resolved section -->
      <div v-if="reports.resolved.length > 0" class="mt-6">
        <button
          @click="showResolved = !showResolved"
          class="flex items-center gap-2 text-xs text-text-muted hover:text-text-primary transition-colors w-full mb-3"
        >
          <span class="flex-1 h-px bg-border-base" />
          <span>{{ showResolved ? '▾' : '▸' }} Resueltos ({{ reports.resolved.length }})</span>
          <span class="flex-1 h-px bg-border-base" />
        </button>
        <div v-if="showResolved" class="space-y-2 opacity-60">
          <div
            v-for="r in reports.resolved"
            :key="r.id"
            class="bg-bg-surface border border-border-base rounded-xl px-4 py-3 flex items-center gap-3"
          >
            <div class="flex-1 min-w-0">
              <p class="text-sm text-text-primary truncate">{{ r.opportunityTitle }}</p>
              <span class="text-xs text-text-muted">{{ reasonLabel[r.reason] ?? r.reason }} · {{ formatDate(r.createdAt) }}</span>
            </div>
            <button
              @click="reopen(r.id)"
              class="shrink-0 text-xs text-text-muted hover:text-text-primary hover:underline transition-colors"
            >
              Reabrir
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <!-- Edit modal -->
  <AppModal :open="!!editingOpp" title="Editar oportunidad" @close="editingOpp = null">
    <OpportunityForm :opportunity="editingOpp" @submit="handleEditSubmit" @cancel="editingOpp = null" />
  </AppModal>

  <!-- Delete confirm -->
  <AppConfirm
    :open="!!deleteTarget"
    title="Eliminar oportunidad"
    message="¿Eliminar esta oportunidad? Esta acción no se puede deshacer."
    confirm-label="Eliminar"
    @confirm="confirmDelete"
    @cancel="deleteTarget = null"
  />
</template>
