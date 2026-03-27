<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ExternalLink, MoreVertical, Star, Bookmark, BookmarkCheck, FileText, ArrowRight, Plus, Trash2, Archive, ArchiveRestore, Flag, CalendarPlus, Link } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { useAuthStore } from '@/stores/auth'
import { useOpportunitiesStore } from '@/stores/opportunities'
import { useFollowsStore } from '@/stores/follows'
import { useReportsStore } from '@/stores/reports'
import { downloadIcs, googleCalendarUrl } from '@/utils/calendar'
import OpportunityStatusBadge from './OpportunityStatusBadge.vue'
import AppTag from '@/components/ui/AppTag.vue'
import AppConfirm from '@/components/ui/AppConfirm.vue'

const props = defineProps({
  opportunity: { type: Object, required: true },
  showFollowPanel: { type: Boolean, default: false },
})
const emit = defineEmits(['edit', 'filter-tag'])

const router = useRouter()
const auth = useAuthStore()
const opps = useOpportunitiesStore()
const follows = useFollowsStore()
const reportsStore = useReportsStore()

const showMenu = ref(false)
const showNotes = ref(false)
const showDeleteConfirm = ref(false)
const showDetail = ref(false)
const showReportModal = ref(false)
const showCalendarMenu = ref(false)
const calendarMenuPos = ref({ top: 0, left: 0 })
const calendarBtnRef = ref(null)
const reportReason = ref('link_roto')
const reportComment = ref('')
const submittingReport = ref(false)
const newNoteText = ref('')
const savingNote = ref(false)

async function submitNote() {
  if (!newNoteText.value.trim() || savingNote.value) return
  savingNote.value = true
  await follows.addNote(props.opportunity.id, newNoteText.value)
  newNoteText.value = ''
  savingNote.value = false
}

function formatNoteDate(iso) {
  const d = new Date(iso)
  return d.toLocaleString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
const menuPos = ref({ top: 0, right: 0 })
const menuBtnRef = ref(null)

function openMenu() {
  if (menuBtnRef.value) {
    const rect = menuBtnRef.value.getBoundingClientRect()
    menuPos.value = {
      top: rect.bottom + 4,
      right: window.innerWidth - rect.right,
    }
  }
  showMenu.value = true
}

const following = computed(() => follows.isFollowing(props.opportunity.id))
const followData = computed(() => follows.getFollow(props.opportunity.id))

// Type badge config
const typeBadgeClass = {
  fuente:       'bg-zinc-200 text-zinc-700 dark:bg-zinc-700/50 dark:text-zinc-300',
  convocatoria: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-400',
  grant:        'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  capacitacion: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400',
  evento:       'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
  red:          'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400',
  linea_ayuda:  'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400',
  beca:         'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400',
}
const typeLabel = {
  fuente: 'Fuente',
  convocatoria: 'Convocatoria',
  grant: 'Grant',
  capacitacion: 'Capacitación',
  evento: 'Evento / Actividad',
  red: 'Red',
  linea_ayuda: 'Línea de Ayuda',
  beca: 'Beca / Fellowship',
}
const externalLinkLabel = {
  fuente: 'Ver fuente',
  convocatoria: 'Ver convocatoria',
  grant: 'Ver grant',
  capacitacion: 'Registrarse',
  evento: 'Ver evento',
  red: 'Conectar',
  linea_ayuda: 'Solicitar ayuda',
  beca: 'Aplicar',
}


function deadlineInfo(dateVal) {
  if (!dateVal) return null
  const d = dateVal?.toDate ? dateVal.toDate() : new Date(dateVal)
  if (isNaN(d.getTime())) return null
  const now = new Date()
  const diffMs = d - now
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  const formatted = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
  let colorClass = 'text-text-muted'
  let urgency = ''
  if (diffDays < 0) {
    colorClass = 'text-text-muted line-through'
    urgency = 'vencida'
  } else if (diffDays <= 3) {
    colorClass = 'text-danger font-semibold'
    urgency = `¡${diffDays}d!`
  } else if (diffDays <= 14) {
    colorClass = 'text-amber font-medium'
    urgency = `${diffDays}d`
  } else {
    urgency = `${diffDays}d`
  }
  return { formatted, colorClass, urgency, diffDays }
}

const deadlineData = computed(() => {
  const opp = props.opportunity
  return deadlineInfo(opp.deadline || opp.fecha || null)
})

// Date used for calendar export (deadline or fecha depending on type)
const calendarDate = computed(() => {
  const opp = props.opportunity
  const types = ['convocatoria', 'grant', 'beca', 'capacitacion', 'evento']
  if (!types.includes(opp.type)) return null
  return opp.deadline || opp.fecha || null
})

function calendarPayload() {
  const opp = props.opportunity
  const isDeadline = ['convocatoria', 'grant', 'beca'].includes(opp.type)
  return {
    title: isDeadline ? `Cierre: ${opp.title}` : opp.title,
    date: calendarDate.value,
    description: opp.description || '',
    url: opp.url || '',
  }
}

function openCalendarMenu() {
  if (calendarBtnRef.value) {
    const rect = calendarBtnRef.value.getBoundingClientRect()
    calendarMenuPos.value = { top: rect.bottom + 4, left: rect.left }
  }
  showCalendarMenu.value = true
}

function openGoogleCalendar() {
  const url = googleCalendarUrl(calendarPayload())
  if (url) window.open(url, '_blank', 'noopener')
  showCalendarMenu.value = false
}

function downloadCalendar() {
  downloadIcs(calendarPayload())
  showCalendarMenu.value = false
}

async function handleFollow() {
  if (following.value) {
    // In general list: navigate to Mi Lista instead of unfollowing
    router.push('/my-list')
  } else {
    await follows.follow(props.opportunity.id)
    toast.success('Agregada a tu lista')
  }
}

async function handleToggleStar() {
  const current = followData.value?.starred ?? false
  await follows.updateFollow(props.opportunity.id, { starred: !current })
  toast.success(current ? 'Quitado de destacadas' : 'Marcado como destacada')
  showMenu.value = false
}

function handleDelete() {
  showDeleteConfirm.value = true
  showMenu.value = false
}

async function confirmDelete() {
  showDeleteConfirm.value = false
  await opps.deleteOpportunity(props.opportunity.id)
  toast.success('Oportunidad eliminada')
}

async function copyUrl() {
  if (!props.opportunity.url) return
  try {
    await navigator.clipboard.writeText(props.opportunity.url)
    toast.success('Enlace copiado')
  } catch {
    toast.error('No se pudo copiar el enlace')
  }
}

async function submitReport() {
  if (submittingReport.value) return
  submittingReport.value = true
  try {
    await reportsStore.createReport({
      opportunityId: props.opportunity.id,
      opportunityTitle: props.opportunity.title,
      reason: reportReason.value,
      comment: reportComment.value,
    })
    showReportModal.value = false
    reportReason.value = 'link_roto'
    reportComment.value = ''
    toast.success('Reporte enviado, gracias')
  } catch {
    toast.error('Error al enviar el reporte')
  } finally {
    submittingReport.value = false
  }
}

async function toggleArchive() {
  showMenu.value = false
  try {
    if (props.opportunity.archivada) {
      await opps.unarchiveOpportunity(props.opportunity.id)
      toast.success('Oportunidad desarchivada')
    } else {
      await opps.archiveOpportunity(props.opportunity.id)
      toast.success('Oportunidad archivada')
    }
  } catch {
    toast.error('Error al archivar')
  }
}

function handleEdit() {
  emit('edit', props.opportunity)
  showMenu.value = false
}

const personalStatusOptions = [
  { value: 'nueva', label: 'Nueva' },
  { value: 'siguiendo', label: 'Siguiendo' },
  { value: 'aplicando', label: 'Aplicando' },
  { value: 'aplicada', label: 'Aplicada' },
  { value: 'descartada', label: 'Descartada' },
]

async function handlePersonalStatusChange(value) {
  await follows.updateFollow(props.opportunity.id, { personalStatus: value })
  showMenu.value = false
}

</script>

<template>
  <div class="relative bg-bg-surface border border-border-base rounded-xl overflow-hidden transition-shadow hover:shadow-sm">
    <div class="p-4">
      <!-- Header row -->
      <div class="flex items-center gap-1.5 flex-wrap mb-2">
        <span
          class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
          :class="typeBadgeClass[opportunity.type] ?? 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700/50 dark:text-zinc-300'"
        >
          {{ typeLabel[opportunity.type] ?? opportunity.type }}
        </span>


        <div class="flex-1" />

        <!-- Status: personal (My List) or platform -->
        <OpportunityStatusBadge
          :status="showFollowPanel && followData?.personalStatus ? followData.personalStatus : opportunity.status"
        />

        <!-- Personal star badge (My List only) -->
        <span
          v-if="showFollowPanel && followData?.starred"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
        >
          ★ Destacada
        </span>

        <!-- Menu button: canEdit in general list; all users in My List -->
        <div v-if="showFollowPanel || auth.canEdit">
          <button
            ref="menuBtnRef"
            @click="openMenu"
            class="p-1 rounded text-text-muted hover:text-text-primary hover:bg-bg-surface-2 transition-colors"
          >
            <MoreVertical class="w-4 h-4" />
          </button>

          <Teleport to="body">
            <template v-if="showMenu">
              <div class="fixed inset-0 z-40" @click="showMenu = false" />
              <div
                class="fixed z-50 w-48 bg-bg-surface border border-border-base rounded-lg shadow-lg py-1"
                :style="{ top: menuPos.top + 'px', right: menuPos.right + 'px' }"
              >
                <!-- My List menu -->
                <template v-if="showFollowPanel">
                  <!-- Personal status -->
                  <div class="px-3 py-1.5 text-xs text-text-muted font-medium">Mi estado</div>
                  <button
                    v-for="opt in personalStatusOptions"
                    :key="opt.value"
                    @click="handlePersonalStatusChange(opt.value)"
                    class="w-full text-left px-3 py-1.5 text-xs hover:bg-bg-surface-2 transition-colors flex items-center justify-between"
                    :class="followData?.personalStatus === opt.value ? 'text-accent font-medium' : 'text-text-primary'"
                  >
                    {{ opt.label }}
                    <span v-if="followData?.personalStatus === opt.value" class="text-accent text-[10px]">✓</span>
                  </button>
                  <!-- Personal star -->
                  <div class="h-px bg-border-base my-1" />
                  <button
                    @click="handleToggleStar"
                    class="w-full text-left px-3 py-1.5 text-xs text-text-primary hover:bg-bg-surface-2 transition-colors flex items-center gap-2"
                  >
                    <Star class="w-3.5 h-3.5" :class="followData?.starred ? 'fill-amber-400 text-amber-400' : ''" />
                    {{ followData?.starred ? 'Quitar destacado' : 'Destacar' }}
                  </button>
                  <!-- Dejar de seguir -->
                  <div class="h-px bg-border-base my-1" />
                  <button
                    @click="follows.unfollow(opportunity.id); showMenu = false"
                    class="w-full text-left px-3 py-1.5 text-xs text-danger hover:bg-danger/10 transition-colors"
                  >
                    Dejar de seguir
                  </button>
                </template>

                <!-- General list menu (canEdit only): edit + archive + delete -->
                <template v-else>
                  <button
                    @click="handleEdit"
                    class="w-full text-left px-3 py-1.5 text-xs text-text-primary hover:bg-bg-surface-2 transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    @click="toggleArchive"
                    class="w-full text-left px-3 py-1.5 text-xs text-text-muted hover:bg-bg-surface-2 transition-colors flex items-center gap-1.5"
                  >
                    <ArchiveRestore v-if="opportunity.archivada" class="w-3.5 h-3.5" />
                    <Archive v-else class="w-3.5 h-3.5" />
                    {{ opportunity.archivada ? 'Desarchivar' : 'Archivar' }}
                  </button>
                  <button
                    @click="handleDelete"
                    class="w-full text-left px-3 py-1.5 text-xs text-danger hover:bg-danger/10 transition-colors"
                  >
                    Eliminar
                  </button>
                </template>
              </div>
            </template>
          </Teleport>
        </div>
      </div>

      <!-- Title -->
      <h3 class="font-semibold text-text-primary text-sm leading-snug line-clamp-2 mb-1">
        {{ opportunity.title }}
      </h3>

      <!-- Description -->
      <p v-if="opportunity.description" class="text-xs text-text-muted line-clamp-2 mb-1">
        {{ opportunity.description }}
      </p>
      <button
        v-if="opportunity.description"
        @click="showDetail = true"
        class="text-xs text-accent hover:underline mb-2 block"
      >
        Ver más
      </button>

      <!-- Type-specific info -->
      <div class="text-xs text-text-muted mb-2 space-y-0.5">
        <div v-if="opportunity.type === 'fuente' && opportunity.freq">
          Revisar cada <span class="text-text-primary">{{ opportunity.freq === 'semanal' ? 'semana' : 'mes' }}</span>
        </div>
        <template v-if="opportunity.type === 'convocatoria'">
          <div v-if="opportunity.monto" class="text-text-primary font-medium">{{ opportunity.monto }}</div>
          <div v-if="deadlineData" :class="deadlineData.colorClass">
            Cierra: {{ deadlineData.formatted }}
            <span class="ml-1">({{ deadlineData.urgency }})</span>
          </div>
          <div v-else class="text-text-muted">Sin fecha límite</div>
        </template>
        <template v-if="opportunity.type === 'grant'">
          <div v-if="opportunity.monto" class="text-text-primary font-semibold">{{ opportunity.monto }}</div>
          <div v-if="opportunity.quien_puede_aplicar" class="text-text-muted">{{ opportunity.quien_puede_aplicar }}</div>
          <div v-if="deadlineData" :class="deadlineData.colorClass">
            Cierre: {{ deadlineData.formatted }}
          </div>
          <div v-else class="text-accent text-xs">Fondo abierto</div>
        </template>
        <template v-if="opportunity.type === 'capacitacion'">
          <div v-if="deadlineData">
            Fecha: <span :class="deadlineData.colorClass">{{ deadlineData.formatted }}</span>
          </div>
          <div v-if="opportunity.modalidad" class="capitalize">{{ opportunity.modalidad }}</div>
          <div v-if="opportunity.dirigido_a">Para: {{ opportunity.dirigido_a }}</div>
        </template>
        <template v-if="opportunity.type === 'evento'">
          <div v-if="deadlineData">
            Fecha: <span :class="deadlineData.colorClass">{{ deadlineData.formatted }}</span>
          </div>
          <div v-if="opportunity.modalidad" class="capitalize">{{ opportunity.modalidad }}</div>
          <div v-if="opportunity.lugar">📍 {{ opportunity.lugar }}</div>
          <div v-if="opportunity.dirigido_a">Para: {{ opportunity.dirigido_a }}</div>
        </template>
        <div v-if="opportunity.type === 'red' && opportunity.como_unirse">
          {{ opportunity.como_unirse }}
        </div>
        <template v-if="opportunity.type === 'beca'">
          <div v-if="opportunity.monto" class="text-text-primary font-semibold">{{ opportunity.monto }}</div>
          <div v-if="opportunity.duracion">Duración: {{ opportunity.duracion }}</div>
          <div v-if="opportunity.quien_puede_aplicar" class="text-text-muted">{{ opportunity.quien_puede_aplicar }}</div>
          <div v-if="deadlineData" :class="deadlineData.colorClass">
            Cierre: {{ deadlineData.formatted }}
          </div>
          <div v-else class="text-accent text-xs">Convocatoria abierta</div>
        </template>
        <template v-if="opportunity.type === 'linea_ayuda'">
          <div v-if="opportunity.respuesta_rapida" class="text-rose-600 dark:text-rose-400 font-medium">⚡ Respuesta rápida</div>
          <div v-if="opportunity.como_acceder">Acceso: {{ opportunity.como_acceder }}</div>
          <div v-if="opportunity.disponibilidad">Disponibilidad: {{ opportunity.disponibilidad }}</div>
          <div v-if="opportunity.para_quien">Para: {{ opportunity.para_quien }}</div>
        </template>
      </div>

      <!-- Tags -->
      <div v-if="opportunity.tags?.length" class="flex flex-wrap gap-1 mb-3">
        <AppTag v-for="tag in opportunity.tags" :key="tag" :label="tag" clickable @click="emit('filter-tag', tag)" />
      </div>

      <!-- Footer: actions -->
      <div class="flex items-center gap-2 flex-wrap">
        <a
          v-if="opportunity.url"
          :href="opportunity.url"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1 text-xs text-accent hover:underline"
        >
          <ExternalLink class="w-3.5 h-3.5" />
          {{ externalLinkLabel[opportunity.type] ?? 'Ver' }}
        </a>

        <div class="flex-1" />

        <!-- Notes button (My List only) -->
        <button
          v-if="showFollowPanel"
          @click="showNotes = !showNotes"
          class="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg border transition-colors"
          :class="followData?.notes?.length
            ? 'border-accent/40 text-accent bg-accent/5 hover:bg-accent/10'
            : 'border-border-base text-text-muted hover:text-text-primary hover:border-accent'"
        >
          <FileText class="w-3.5 h-3.5" />
          Notas{{ followData?.notes?.length ? ` (${followData.notes.length})` : '' }}
        </button>


        <!-- Calendar button (Mi Lista only) -->
        <div v-if="calendarDate && showFollowPanel">
          <button
            ref="calendarBtnRef"
            @click="openCalendarMenu"
            class="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg text-text-muted hover:text-accent hover:bg-accent/10 transition-colors border border-transparent hover:border-accent/20"
            title="Agregar al calendario"
          >
            <CalendarPlus class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- Copy URL -->
        <button
          v-if="opportunity.url"
          @click="copyUrl"
          class="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg text-text-muted hover:text-accent hover:bg-accent/10 transition-colors border border-transparent hover:border-accent/20"
          title="Copiar enlace"
        >
          <Link class="w-3.5 h-3.5" />
        </button>

        <!-- Report button -->
        <button
          @click="showReportModal = true"
          class="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors border border-transparent hover:border-danger/20"
          title="Reportar oportunidad"
        >
          <Flag class="w-3.5 h-3.5" />
        </button>

        <!-- Personal Follow -->
        <button
          v-if="!showFollowPanel"
          @click="handleFollow"
          class="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-colors"
          :class="following
            ? 'border-accent/40 text-accent bg-accent/8 hover:bg-accent/15'
            : 'border-border-base text-text-muted hover:text-accent hover:border-accent'"
        >
          <BookmarkCheck v-if="following" class="w-3.5 h-3.5" />
          <Bookmark v-else class="w-3.5 h-3.5" />
          {{ following ? 'En mi lista' : '+ Seguir' }}
          <ArrowRight v-if="following" class="w-3 h-3 ml-0.5" />
        </button>
      </div>
    </div>

    <AppConfirm
      :open="showDeleteConfirm"
      title="Eliminar oportunidad"
      :message="`¿Eliminar &quot;${opportunity.title}&quot;? Esta acción no se puede deshacer.`"
      confirm-label="Eliminar"
      @confirm="confirmDelete"
      @cancel="showDeleteConfirm = false"
    />

    <!-- Notes panel (My List only) -->
    <div v-if="showNotes && showFollowPanel" class="border-t border-border-base px-4 py-3 space-y-2">
      <p class="text-xs font-medium text-text-muted">Notas <span class="font-normal">(solo visibles para ti)</span></p>

      <!-- Existing notes -->
      <div v-if="followData?.notes?.length" class="space-y-2 max-h-48 overflow-y-auto">
        <div
          v-for="note in [...(followData.notes)].reverse()"
          :key="note.id"
          class="group flex gap-2 bg-bg-base rounded-lg px-2.5 py-2"
        >
          <div class="flex-1 min-w-0">
            <p class="text-xs text-text-primary whitespace-pre-wrap">{{ note.text }}</p>
            <p class="text-[10px] text-text-muted mt-1">{{ formatNoteDate(note.createdAt) }}</p>
          </div>
          <button
            @click="follows.removeNote(opportunity.id, note.id)"
            class="shrink-0 opacity-0 group-hover:opacity-100 text-text-muted hover:text-danger transition-all"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <p v-else class="text-xs text-text-muted italic">Sin notas aún.</p>

      <!-- Add note -->
      <div class="flex gap-2 pt-1">
        <textarea
          v-model="newNoteText"
          rows="2"
          placeholder="Agregar nota..."
          class="flex-1 px-2.5 py-2 rounded-lg border border-border-base bg-bg-base text-text-primary text-xs placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors resize-none"
          @keydown.ctrl.enter="submitNote"
          @keydown.meta.enter="submitNote"
        />
        <button
          @click="submitNote"
          :disabled="!newNoteText.trim() || savingNote"
          class="shrink-0 self-end px-2.5 py-2 rounded-lg bg-accent text-bg-base text-xs font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          <Plus class="w-3.5 h-3.5" />
        </button>
      </div>
      <p class="text-[10px] text-text-muted">Ctrl+Enter para guardar</p>
    </div>


  </div>

  <!-- Calendar dropdown -->
  <Teleport to="body">
    <template v-if="showCalendarMenu">
      <div class="fixed inset-0 z-40" @click="showCalendarMenu = false" />
      <div
        class="fixed z-50 w-44 bg-bg-surface border border-border-base rounded-lg shadow-lg py-1"
        :style="{ top: calendarMenuPos.top + 'px', left: calendarMenuPos.left + 'px' }"
      >
        <button
          @click="openGoogleCalendar"
          class="w-full text-left px-3 py-1.5 text-xs text-text-primary hover:bg-bg-surface-2 transition-colors"
        >
          Google Calendar
        </button>
        <button
          @click="downloadCalendar"
          class="w-full text-left px-3 py-1.5 text-xs text-text-primary hover:bg-bg-surface-2 transition-colors"
        >
          Descargar .ics
        </button>
      </div>
    </template>
  </Teleport>

  <!-- Report modal -->
  <Teleport to="body">
    <div v-if="showReportModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="showReportModal = false" />
      <div class="relative bg-bg-surface border border-border-base rounded-2xl shadow-2xl w-full max-w-sm">
        <div class="p-6 space-y-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h3 class="text-sm font-semibold text-text-primary">Reportar oportunidad</h3>
              <p class="text-xs text-text-muted mt-0.5 line-clamp-1">{{ opportunity.title }}</p>
            </div>
            <button @click="showReportModal = false" class="shrink-0 text-text-muted hover:text-text-primary p-1 rounded transition-colors">✕</button>
          </div>

          <div>
            <label class="block text-xs font-medium text-text-muted mb-1">Motivo</label>
            <select
              v-model="reportReason"
              class="w-full px-3 py-2 rounded-lg border border-border-base bg-bg-base text-text-primary text-sm focus:outline-none focus:border-accent transition-colors"
            >
              <option value="link_roto">Link roto o inaccesible</option>
              <option value="desactualizada">Información desactualizada</option>
              <option value="duplicado">Es un duplicado</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-text-muted mb-1">Comentario <span class="font-normal">(opcional)</span></label>
            <textarea
              v-model="reportComment"
              rows="3"
              placeholder="Agrega contexto si lo necesitás..."
              class="w-full px-3 py-2 rounded-lg border border-border-base bg-bg-base text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors resize-none"
            />
          </div>

          <div class="flex gap-2 justify-end pt-1">
            <button
              @click="showReportModal = false"
              class="px-4 py-2 rounded-lg text-sm text-text-muted hover:text-text-primary hover:bg-bg-surface-2 transition-colors"
            >
              Cancelar
            </button>
            <button
              @click="submitReport"
              :disabled="submittingReport"
              class="px-4 py-2 rounded-lg bg-danger text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {{ submittingReport ? 'Enviando...' : 'Enviar reporte' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Detail modal -->
  <Teleport to="body">
    <div v-if="showDetail" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="showDetail = false" />
      <div class="relative bg-bg-surface border border-border-base rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div class="p-6 space-y-4">
          <!-- Header -->
          <div class="flex items-start gap-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap mb-2">
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                  :class="typeBadgeClass[opportunity.type] ?? 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700/50 dark:text-zinc-300'"
                >
                  {{ typeLabel[opportunity.type] ?? opportunity.type }}
                </span>
                <OpportunityStatusBadge :status="opportunity.status" />
              </div>
              <h2 class="text-base font-semibold text-text-primary leading-snug">{{ opportunity.title }}</h2>
            </div>
            <button @click="showDetail = false" class="shrink-0 text-text-muted hover:text-text-primary p-1 rounded transition-colors">
              ✕
            </button>
          </div>

          <!-- Description -->
          <p v-if="opportunity.description" class="text-sm text-text-muted leading-relaxed">
            {{ opportunity.description }}
          </p>

          <!-- Type-specific fields -->
          <div class="text-sm text-text-muted space-y-1.5">
            <div v-if="opportunity.type === 'fuente' && opportunity.freq">
              Frecuencia: <span class="text-text-primary capitalize">{{ opportunity.freq }}</span>
            </div>
            <template v-if="opportunity.type === 'convocatoria' || opportunity.type === 'grant'">
              <div v-if="opportunity.monto">Monto: <span class="text-text-primary font-medium">{{ opportunity.monto }}</span></div>
              <div v-if="opportunity.quien_puede_aplicar">Aplica: <span class="text-text-primary">{{ opportunity.quien_puede_aplicar }}</span></div>
              <div v-if="deadlineData">Cierre: <span :class="deadlineData.colorClass">{{ deadlineData.formatted }} ({{ deadlineData.urgency }})</span></div>
              <div v-else-if="opportunity.type === 'grant'" class="text-accent">Fondo abierto</div>
            </template>
            <template v-if="opportunity.type === 'capacitacion' || opportunity.type === 'evento'">
              <div v-if="deadlineData">Fecha: <span :class="deadlineData.colorClass">{{ deadlineData.formatted }}</span></div>
              <div v-if="opportunity.modalidad">Modalidad: <span class="text-text-primary capitalize">{{ opportunity.modalidad }}</span></div>
              <div v-if="opportunity.lugar">Lugar: <span class="text-text-primary">{{ opportunity.lugar }}</span></div>
              <div v-if="opportunity.dirigido_a">Para: <span class="text-text-primary">{{ opportunity.dirigido_a }}</span></div>
            </template>
            <div v-if="opportunity.type === 'red' && opportunity.como_unirse">
              Cómo unirse: <span class="text-text-primary">{{ opportunity.como_unirse }}</span>
            </div>
            <template v-if="opportunity.type === 'beca'">
              <div v-if="opportunity.monto">Estipendio: <span class="text-text-primary font-medium">{{ opportunity.monto }}</span></div>
              <div v-if="opportunity.duracion">Duración: <span class="text-text-primary">{{ opportunity.duracion }}</span></div>
              <div v-if="opportunity.quien_puede_aplicar">Aplica: <span class="text-text-primary">{{ opportunity.quien_puede_aplicar }}</span></div>
              <div v-if="deadlineData">Cierre: <span :class="deadlineData.colorClass">{{ deadlineData.formatted }} ({{ deadlineData.urgency }})</span></div>
              <div v-else class="text-accent">Convocatoria abierta</div>
            </template>
            <template v-if="opportunity.type === 'linea_ayuda'">
              <div v-if="opportunity.respuesta_rapida" class="text-rose-600 dark:text-rose-400 font-medium">⚡ Respuesta rápida</div>
              <div v-if="opportunity.como_acceder">Acceso: <span class="text-text-primary">{{ opportunity.como_acceder }}</span></div>
              <div v-if="opportunity.disponibilidad">Disponibilidad: <span class="text-text-primary">{{ opportunity.disponibilidad }}</span></div>
              <div v-if="opportunity.para_quien">Para: <span class="text-text-primary">{{ opportunity.para_quien }}</span></div>
            </template>
          </div>

          <!-- Tags -->
          <div v-if="opportunity.tags?.length" class="flex flex-wrap gap-1.5">
            <AppTag v-for="tag in opportunity.tags" :key="tag" :label="tag" />
          </div>

          <!-- URL -->
          <a
            v-if="opportunity.url"
            :href="opportunity.url"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
          >
            <ExternalLink class="w-4 h-4" />
            {{ externalLinkLabel[opportunity.type] ?? 'Ver enlace' }}
          </a>
        </div>
      </div>
    </div>
  </Teleport>
</template>
