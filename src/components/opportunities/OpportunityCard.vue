<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ExternalLink, MoreVertical, Star, Bookmark, BookmarkCheck, FileText, ArrowRight, Plus, Trash2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { useAuthStore } from '@/stores/auth'
import { useOpportunitiesStore } from '@/stores/opportunities'
import { useFollowsStore } from '@/stores/follows'
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

const showMenu = ref(false)
const showNotes = ref(false)
const showDeleteConfirm = ref(false)
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
  red:          'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400',
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

                <!-- General list menu (canEdit only): edit + delete -->
                <template v-else>
                  <button
                    @click="handleEdit"
                    class="w-full text-left px-3 py-1.5 text-xs text-text-primary hover:bg-bg-surface-2 transition-colors"
                  >
                    Editar
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
      <p v-if="opportunity.description" class="text-xs text-text-muted line-clamp-2 mb-2">
        {{ opportunity.description }}
      </p>

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
</template>
