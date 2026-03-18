<script setup>
import { useOpportunitiesStore } from '@/stores/opportunities'
import { toast } from 'vue-sonner'

const opps = useOpportunitiesStore()

function formatDate(ts) {
  if (!ts) return '—'
  const d = ts?.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

async function approve(opp) {
  try {
    await opps.approveOpportunity(opp.id)
    toast.success(`"${opp.title}" aprobada`)
  } catch {
    toast.error('Error al aprobar')
  }
}

async function reject(opp) {
  if (!confirm(`¿Rechazar y eliminar "${opp.title}"?`)) return
  try {
    await opps.rejectOpportunity(opp.id)
    toast.success('Oportunidad rechazada')
  } catch {
    toast.error('Error al rechazar')
  }
}

const typeLabel = {
  fuente: 'Fuente',
  convocatoria: 'Convocatoria',
  grant: 'Grant',
  capacitacion: 'Capacitación',
  red: 'Red',
}
const typeBadgeClass = {
  fuente:      'bg-zinc-200 text-zinc-700 dark:bg-zinc-700/50 dark:text-zinc-300',
  convocatoria:'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-400',
  grant:       'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  capacitacion:'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400',
  red:         'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400',
}
</script>

<template>
  <div class="p-6 max-w-3xl">
    <div class="mb-6">
      <h1 class="text-xl font-semibold text-text-primary">
        Pendientes de aprobación
        <span class="text-text-muted font-normal text-sm ml-1">{{ opps.pending.length }}</span>
      </h1>
      <p class="text-text-muted text-sm mt-0.5">Propuestas de usuarios pendientes de revisión</p>
    </div>

    <div v-if="opps.loading" class="py-16 flex items-center justify-center">
      <p class="text-text-muted text-sm">Cargando...</p>
    </div>

    <div v-else-if="opps.pending.length === 0" class="py-16 flex flex-col items-center justify-center gap-2 text-center">
      <p class="text-text-muted">No hay convocatorias pendientes de aprobación</p>
      <p class="text-text-muted text-sm">¡Todo al día!</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="opp in opps.pending"
        :key="opp.id"
        class="bg-bg-surface border border-border-base rounded-xl p-4"
      >
        <!-- Header -->
        <div class="flex items-start gap-3 mb-2">
          <span
            class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium shrink-0"
            :class="typeBadgeClass[opp.type] ?? 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700/50 dark:text-zinc-300'"
          >
            {{ typeLabel[opp.type] ?? opp.type }}
          </span>
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-text-primary text-sm leading-snug">{{ opp.title }}</h3>
            <p v-if="opp.description" class="text-xs text-text-muted mt-0.5 line-clamp-2">{{ opp.description }}</p>
          </div>
        </div>

        <!-- Submitter info -->
        <div class="flex items-center gap-2 mb-3 text-xs text-text-muted">
          <span>Enviado por: <span class="text-text-primary">{{ opp.addedByOrg || opp.addedBy || 'Desconocido' }}</span></span>
          <span>·</span>
          <span>{{ formatDate(opp.createdAt) }}</span>
          <a
            v-if="opp.url"
            :href="opp.url"
            target="_blank"
            rel="noopener noreferrer"
            class="ml-auto text-accent hover:underline"
          >
            Ver enlace
          </a>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2">
          <button
            @click="approve(opp)"
            class="px-3 py-1.5 rounded-lg bg-accent text-bg-base text-xs font-medium hover:opacity-90 transition-opacity"
          >
            Aprobar
          </button>
          <button
            @click="reject(opp)"
            class="px-3 py-1.5 rounded-lg bg-danger/10 border border-danger/30 text-danger text-xs font-medium hover:bg-danger/20 transition-colors"
          >
            Rechazar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
