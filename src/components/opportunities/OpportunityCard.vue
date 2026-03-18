<script setup>
import { ref, computed } from 'vue'
import { ExternalLink, MoreVertical, Star, Bookmark, BookmarkCheck, FileText } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { useAuthStore } from '@/stores/auth'
import { useOpportunitiesStore } from '@/stores/opportunities'
import { useFollowsStore } from '@/stores/follows'
import OpportunityStatusBadge from './OpportunityStatusBadge.vue'
import OpportunityNotes from './OpportunityNotes.vue'
import AppTag from '@/components/ui/AppTag.vue'
import AppConfirm from '@/components/ui/AppConfirm.vue'

const props = defineProps({
  opportunity: { type: Object, required: true },
  showFollowPanel: { type: Boolean, default: false },
})
const emit = defineEmits(['edit', 'filter-tag'])

const auth = useAuthStore()
const opps = useOpportunitiesStore()
const follows = useFollowsStore()

const showMenu = ref(false)
const showNotes = ref(false)
const showStatusPicker = ref(false)
const showDeleteConfirm = ref(false)
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
  fuente:      'bg-zinc-200 text-zinc-700 dark:bg-zinc-700/50 dark:text-zinc-300',
  convocatoria:'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-400',
  grant:       'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  capacitacion:'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400',
  red:         'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400',
}
const typeLabel = {
  fuente: 'Fuente',
  convocatoria: 'Convocatoria',
  grant: 'Grant',
  capacitacion: 'Capacitación',
  red: 'Red',
}
const externalLinkLabel = {
  fuente: 'Ver fuente',
  convocatoria: 'Ver convocatoria',
  grant: 'Ver grant',
  capacitacion: 'Registrarse',
  red: 'Conectar',
}

// Fit badge
const fitBadgeClass = {
  Alto:      'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  Bueno:     'bg-sky-100 text-sky-700 dark:bg-blue-900/40 dark:text-blue-400',
  Selectivo: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
}

// Deadline countdown
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
  const dateVal = opp.deadline || opp.fecha || null
  return deadlineInfo(dateVal)
})

// Actions
async function handleFollow() {
  if (following.value) {
    await follows.unfollow(props.opportunity.id)
    toast.success('Dejaste de seguir')
  } else {
    await follows.follow(props.opportunity.id)
    toast.success('Siguiendo')
  }
}

async function handleToggleFeatured() {
  await opps.toggleFeatured(props.opportunity.id, props.opportunity.featured)
  toast.success(props.opportunity.featured ? 'Quitado de destacadas' : 'Marcado como destacada')
  showMenu.value = false
}

async function handleChangeStatus(status) {
  await opps.changeStatus(props.opportunity.id, status)
  toast.success('Estado actualizado')
  showStatusPicker.value = false
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

function handleEdit() {
  emit('edit', props.opportunity)
  showMenu.value = false
}

// Follow panel personal status
const personalStatusOptions = [
  { value: 'siguiendo', label: 'Siguiendo' },
  { value: 'aplicando', label: 'Aplicando' },
  { value: 'aplicada', label: 'Aplicada' },
  { value: 'descartada', label: 'Descartada' },
]

async function handlePersonalStatusChange(e) {
  await follows.updateFollow(props.opportunity.id, { personalStatus: e.target.value })
}

async function handleNoteUpdate(e) {
  await follows.updateFollow(props.opportunity.id, { personalNote: e.target.value })
}

async function handleNoteSharedToggle(e) {
  await follows.updateFollow(props.opportunity.id, { noteShared: e.target.checked })
}

const statusOptions = [
  { value: 'nueva', label: 'Nueva' },
  { value: 'en_revision', label: 'En revisión' },
  { value: 'aplicada', label: 'Aplicada' },
  { value: 'descartada', label: 'Descartada' },
]
</script>

<template>
  <div
    class="relative bg-bg-surface border border-border-base rounded-xl overflow-hidden transition-shadow hover:shadow-sm"
    :class="opportunity.featured ? 'border-l-4 border-l-brand-magenta bg-bg-surface-2' : ''"
  >
    <div class="p-4">
      <!-- Header row: type/fit badges + spacer + status + menu -->
      <div class="flex items-center gap-1.5 flex-wrap mb-2">
        <!-- Type badge -->
        <span
          class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
          :class="typeBadgeClass[opportunity.type] ?? 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700/50 dark:text-zinc-300'"
        >
          {{ typeLabel[opportunity.type] ?? opportunity.type }}
        </span>

        <!-- Fit badge -->
        <span
          v-if="opportunity.fit"
          class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
          :class="fitBadgeClass[opportunity.fit] ?? 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700/50 dark:text-zinc-300'"
        >
          {{ opportunity.fit }}
        </span>

        <!-- Featured badge -->
        <span
          v-if="opportunity.featured"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-brand-magenta/20 text-brand-magenta border border-brand-magenta/30"
        >
          ★ Destacada
        </span>

        <div class="flex-1" />

        <!-- Status -->
        <OpportunityStatusBadge :status="opportunity.status" />

        <!-- Menu button (member/admin) -->
        <div v-if="auth.isMember">
          <button
            ref="menuBtnRef"
            @click="openMenu"
            class="p-1 rounded text-text-muted hover:text-text-primary hover:bg-bg-surface-2 transition-colors"
          >
            <MoreVertical class="w-4 h-4" />
          </button>

          <Teleport to="body">
            <template v-if="showMenu">
              <!-- Overlay to close -->
              <div class="fixed inset-0 z-40" @click="showMenu = false" />

              <!-- Dropdown -->
              <div
                class="fixed z-50 w-44 bg-bg-surface border border-border-base rounded-lg shadow-lg py-1"
                :style="{ top: menuPos.top + 'px', right: menuPos.right + 'px' }"
              >
                <div class="px-3 py-1.5 text-xs text-text-muted font-medium">Cambiar estado</div>
                <button
                  v-for="opt in statusOptions"
                  :key="opt.value"
                  @click="handleChangeStatus(opt.value)"
                  class="w-full text-left px-3 py-1.5 text-xs text-text-primary hover:bg-bg-surface-2 transition-colors"
                >
                  {{ opt.label }}
                </button>
                <div class="h-px bg-border-base my-1" />
                <button
                  @click="handleToggleFeatured"
                  class="w-full text-left px-3 py-1.5 text-xs text-text-primary hover:bg-bg-surface-2 transition-colors flex items-center gap-2"
                >
                  <Star class="w-3.5 h-3.5" />
                  {{ opportunity.featured ? 'Quitar destacado' : 'Destacar' }}
                </button>
                <button
                  @click="handleEdit"
                  class="w-full text-left px-3 py-1.5 text-xs text-text-primary hover:bg-bg-surface-2 transition-colors"
                >
                  Editar
                </button>
                <button
                  v-if="auth.isAdmin"
                  @click="handleDelete"
                  class="w-full text-left px-3 py-1.5 text-xs text-danger hover:bg-danger/10 transition-colors"
                >
                  Eliminar
                </button>
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
      <p v-if="opportunity.description" class="text-xs text-text-muted line-clamp-2 mb-2">
        {{ opportunity.description }}
      </p>

      <!-- Type-specific info -->
      <div class="text-xs text-text-muted mb-2 space-y-0.5">
        <!-- fuente -->
        <div v-if="opportunity.type === 'fuente' && opportunity.freq">
          Revisar cada <span class="text-text-primary">{{ opportunity.freq === 'semanal' ? 'semana' : 'mes' }}</span>
        </div>

        <!-- convocatoria -->
        <template v-if="opportunity.type === 'convocatoria'">
          <div v-if="opportunity.monto" class="text-text-primary font-medium">{{ opportunity.monto }}</div>
          <div v-if="deadlineData" :class="deadlineData.colorClass">
            Cierra: {{ deadlineData.formatted }}
            <span class="ml-1">({{ deadlineData.urgency }})</span>
          </div>
          <div v-else class="text-text-muted">Sin fecha límite</div>
        </template>

        <!-- grant -->
        <template v-if="opportunity.type === 'grant'">
          <div v-if="opportunity.monto" class="text-text-primary font-semibold">{{ opportunity.monto }}</div>
          <div v-if="opportunity.quien_puede_aplicar" class="text-text-muted">{{ opportunity.quien_puede_aplicar }}</div>
          <div v-if="deadlineData" :class="deadlineData.colorClass">
            Cierre: {{ deadlineData.formatted }}
          </div>
          <div v-else class="text-accent text-xs">Fondo abierto</div>
        </template>

        <!-- capacitacion -->
        <template v-if="opportunity.type === 'capacitacion'">
          <div v-if="deadlineData">
            Fecha: <span :class="deadlineData.colorClass">{{ deadlineData.formatted }}</span>
          </div>
          <div v-if="opportunity.modalidad" class="capitalize">{{ opportunity.modalidad }}</div>
          <div v-if="opportunity.dirigido_a">Para: {{ opportunity.dirigido_a }}</div>
        </template>

        <!-- red -->
        <div v-if="opportunity.type === 'red' && opportunity.como_unirse">
          {{ opportunity.como_unirse }}
        </div>
      </div>

      <!-- Tags -->
      <div v-if="opportunity.tags?.length" class="flex flex-wrap gap-1 mb-3">
        <AppTag v-for="tag in opportunity.tags" :key="tag" :label="tag" clickable @click="emit('filter-tag', tag)" />
      </div>

      <!-- Footer: actions -->
      <div class="flex items-center gap-2 flex-wrap">
        <!-- External link -->
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

        <!-- Notes button (member/admin) -->
        <button
          v-if="auth.isMember"
          @click="showNotes = !showNotes"
          class="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg border transition-colors"
          :class="opportunity.notesCount > 0
            ? 'border-accent/40 text-accent bg-accent/5 hover:bg-accent/10'
            : 'border-border-base text-text-muted hover:text-text-primary hover:border-accent'"
        >
          <FileText class="w-3.5 h-3.5" />
          Notas
          <span
            v-if="opportunity.notesCount > 0"
            class="inline-flex items-center justify-center w-4 h-4 rounded-full bg-accent text-bg-base text-[10px] font-medium leading-none"
          >{{ opportunity.notesCount }}</span>
        </button>

        <!-- Follow/Unfollow -->
        <button
          @click="handleFollow"
          class="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-colors"
          :class="following
            ? 'border-accent text-accent bg-accent/10 hover:bg-danger/10 hover:text-danger hover:border-danger'
            : 'border-border-base text-text-muted hover:text-accent hover:border-accent'"
        >
          <BookmarkCheck v-if="following" class="w-3.5 h-3.5" />
          <Bookmark v-else class="w-3.5 h-3.5" />
          {{ following ? 'Siguiendo' : '+ Seguir' }}
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

    <!-- Notes section (collapsible) -->
    <div v-if="showNotes && auth.isMember" class="border-t border-border-base">
      <OpportunityNotes :opportunity-id="opportunity.id" />
    </div>

    <!-- Personal follow panel (My List view) -->
    <div
      v-if="showFollowPanel && following && followData"
      class="border-t border-border-base px-4 py-3 bg-bg-base space-y-2"
    >
      <div class="flex items-center gap-3">
        <div class="flex-1">
          <label class="block text-xs text-text-muted mb-1">Mi estado</label>
          <select
            :value="followData.personalStatus"
            @change="handlePersonalStatusChange"
            class="w-full px-2 py-1.5 rounded border border-border-base bg-bg-surface text-text-primary text-xs focus:outline-none focus:border-accent"
          >
            <option v-for="opt in personalStatusOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
        <button
          @click="follows.unfollow(opportunity.id)"
          class="text-xs text-danger hover:underline mt-4"
        >
          Dejar de seguir
        </button>
      </div>
      <div>
        <label class="block text-xs mb-1"
          :class="followData.personalNote ? 'text-accent' : 'text-text-muted'"
        >Nota personal{{ followData.personalNote ? ' ·' : '' }}</label>
        <textarea
          :value="followData.personalNote || ''"
          @blur="handleNoteUpdate"
          rows="2"
          class="w-full px-2 py-1.5 rounded border border-border-base bg-bg-surface text-text-primary text-xs resize-none focus:outline-none focus:border-accent"
          placeholder="Tu nota privada..."
        />
      </div>
      <label class="flex items-center gap-2 text-xs text-text-muted cursor-pointer">
        <input
          type="checkbox"
          :checked="followData.noteShared"
          @change="handleNoteSharedToggle"
          class="w-3.5 h-3.5 accent-accent"
        />
        Compartir nota con el equipo
      </label>
    </div>
  </div>
</template>
