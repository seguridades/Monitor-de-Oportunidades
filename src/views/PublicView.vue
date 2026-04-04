<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { Search, X, Sun, Moon, LogIn } from 'lucide-vue-next'
import { db } from '@/firebase/config'
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore'
import OpportunityCard from '@/components/opportunities/OpportunityCard.vue'
import SkeletonCard from '@/components/ui/SkeletonCard.vue'
import { useUIStore } from '@/stores/ui'

const route = useRoute()
const ui = useUIStore()

const opportunities = ref([])
const loading = ref(true)
const typeFilter = ref('todas')
const searchQuery = ref('')

const typeOptions = [
  { value: 'todas',        label: 'Todas' },
  { value: 'convocatoria', label: 'Convocatorias' },
  { value: 'grant',        label: 'Grants' },
  { value: 'beca',         label: 'Becas / Fellowships' },
  { value: 'capacitacion', label: 'Capacitaciones' },
  { value: 'evento',       label: 'Eventos / Actividades' },
  { value: 'red',          label: 'Redes' },
  { value: 'linea_ayuda',  label: 'Líneas de Ayuda' },
  { value: 'fuente',       label: 'Fuentes' },
]

const groupOrder = [
  { type: 'convocatoria', label: 'Convocatorias' },
  { type: 'grant',        label: 'Grants' },
  { type: 'fuente',       label: 'Fuentes' },
  { type: 'capacitacion', label: 'Capacitaciones' },
  { type: 'evento',       label: 'Eventos / Actividades' },
  { type: 'red',          label: 'Redes' },
  { type: 'linea_ayuda',  label: 'Líneas de Ayuda' },
  { type: 'beca',         label: 'Becas / Fellowships' },
]

onMounted(async () => {
  try {
    const snap = await getDocs(
      query(collection(db, 'opportunities'), where('status', '!=', 'pendiente_aprobacion'), orderBy('status'))
    )
    opportunities.value = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(o => !o.archivada)
  } catch (e) {
    console.error('Error cargando catálogo público:', e)
  } finally {
    loading.value = false
  }

  if (route.query.id) {
    await nextTick()
    scrollToCard(route.query.id)
  }
})

function scrollToCard(id) {
  const el = document.getElementById(`pub-${id}`)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

function countByType(type) {
  if (type === 'todas') return opportunities.value.length
  return opportunities.value.filter(o => o.type === type).length
}

const filtered = computed(() => {
  let list = opportunities.value

  if (typeFilter.value !== 'todas') {
    list = list.filter(o => o.type === typeFilter.value)
  }

  if (searchQuery.value.trim()) {
    const raw = searchQuery.value.trim().toLowerCase()
    const q = raw.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
    list = list.filter(o =>
      o.title?.toLowerCase().includes(q) ||
      o.description?.toLowerCase().includes(q) ||
      o.url?.toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '').includes(q) ||
      (Array.isArray(o.tags) && o.tags.some(t => t.toLowerCase().includes(q)))
    )
  }

  return [...list].sort((a, b) => {
    const dA = a.deadline?.toDate ? a.deadline.toDate() : a.deadline ? new Date(a.deadline) : null
    const dB = b.deadline?.toDate ? b.deadline.toDate() : b.deadline ? new Date(b.deadline) : null
    if (!dA && !dB) return 0
    if (!dA) return 1
    if (!dB) return -1
    return dA - dB
  })
})

const showGroups = computed(() => typeFilter.value === 'todas' && !searchQuery.value.trim())

const grouped = computed(() =>
  groupOrder.map(({ type, label }) => ({
    type, label,
    items: filtered.value.filter(o => o.type === type),
  }))
)
</script>

<template>
  <div class="min-h-screen bg-bg-base">

    <!-- Header -->
    <header class="sticky top-0 z-20 bg-bg-surface border-b border-border-base px-4 md:px-6 py-3 relative flex items-center">

      <!-- Left: logo -->
      <div class="flex items-center gap-2 shrink-0">
        <!-- Mobile: mascot favicon -->
        <img src="/favicon-96x96.png" alt="seguridades.org" class="h-8 w-8 sm:hidden rounded-lg" />
        <!-- Tablet+: full logo -->
        <img src="@/assets/logo.svg" alt="seguridades.org" class="h-7 hidden sm:block" />
        <span class="text-text-muted text-sm hidden md:block">Monitor de Oportunidades</span>
      </div>

      <!-- Center: search (absolute so it's truly centered) -->
      <div class="absolute left-1/2 -translate-x-1/2 w-full max-w-xs sm:max-w-sm px-12 sm:px-0 pointer-events-none">
        <div class="relative pointer-events-auto">
          <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar..."
            class="w-full pl-8 py-1.5 rounded-lg border border-border-base bg-bg-base text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
            :class="searchQuery ? 'pr-7' : 'pr-3'"
          />
          <button
            v-if="searchQuery"
            @click="searchQuery = ''"
            class="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <!-- Right: actions -->
      <div class="ml-auto flex items-center gap-1.5 shrink-0">
        <button
          @click="ui.toggleTheme()"
          class="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-surface-2 transition-colors"
          :aria-label="ui.theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
        >
          <Sun v-if="ui.theme === 'dark'" class="w-4 h-4" />
          <Moon v-else class="w-4 h-4" />
        </button>
        <RouterLink
          to="/login"
          class="p-1.5 rounded-lg bg-accent text-bg-base hover:opacity-90 transition-opacity"
          aria-label="Iniciar sesión"
        >
          <LogIn class="w-4 h-4" />
        </RouterLink>
      </div>

    </header>

    <!-- Mobile filter bar -->
    <div class="md:hidden sticky top-13.25 z-10 bg-bg-surface border-b border-border-base px-3 py-2 overflow-x-auto flex gap-1.5 scrollbar-none">
      <button
        v-for="opt in typeOptions"
        :key="opt.value"
        @click="typeFilter = opt.value"
        class="shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap"
        :class="typeFilter === opt.value
          ? 'bg-accent text-bg-base'
          : 'bg-bg-surface-2 text-text-muted hover:text-text-primary'"
      >
        {{ opt.label }}
        <span class="ml-1 opacity-60">{{ countByType(opt.value) }}</span>
      </button>
    </div>

    <div class="flex">

      <!-- Sidebar type filter -->
      <aside class="hidden md:block w-52 shrink-0 border-r border-border-base p-4 sticky top-13.25 h-[calc(100vh-53px)] overflow-y-auto">
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
      </aside>

      <!-- Main -->
      <main class="flex-1 min-w-0 overflow-y-auto">

        <!-- CTA banner -->
        <div class="mx-6 mt-5 mb-2 p-4 rounded-xl bg-accent/8 border border-accent/20 flex items-center gap-3 flex-wrap">
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-text-primary">Listado público</p>
            <p class="text-xs text-text-muted mt-0.5">
              <RouterLink to="/login" class="text-accent hover:underline">Iniciá sesión</RouterLink>
              o solicitá acceso a la beta cerrada en
              <a href="mailto:info@seguridades.org" class="text-accent hover:underline">info@seguridades.org</a>.
              Con las funciones avanzadas podrás gestionar listas de seguimiento, añadir notas y recordatorios, descargar selecciones en CSV y proponer nuevas oportunidades.
            </p>
          </div>
        </div>

        <div class="p-6 pt-4">

          <!-- Loading -->
          <div v-if="loading" class="grid gap-3 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            <SkeletonCard v-for="n in 6" :key="n" />
          </div>

          <!-- Empty -->
          <div v-else-if="filtered.length === 0" class="py-20 text-center">
            <p class="text-text-muted text-sm">No hay oportunidades para los filtros seleccionados.</p>
          </div>

          <!-- Grouped by type -->
          <template v-else-if="showGroups">
            <template v-for="group in grouped" :key="group.type">
              <div v-if="group.items.length > 0" class="mb-8">
                <div class="flex items-center gap-3 mb-3">
                  <h3 class="text-xs font-semibold text-text-muted uppercase tracking-wider shrink-0">{{ group.label }}</h3>
                  <div class="flex-1 h-px bg-border-base" />
                  <span class="text-xs text-text-muted shrink-0">{{ group.items.length }}</span>
                </div>
                <div class="grid gap-3 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                  <div
                    v-for="opp in group.items"
                    :key="opp.id"
                    :id="`pub-${opp.id}`"
                    :class="route.query.id === opp.id ? 'ring-2 ring-accent rounded-xl' : ''"
                  >
                    <OpportunityCard :opportunity="opp" :public-mode="true" />
                  </div>
                </div>
              </div>
            </template>
          </template>

          <!-- Flat list -->
          <div v-else class="grid gap-3 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            <div
              v-for="opp in filtered"
              :key="opp.id"
              :id="`pub-${opp.id}`"
              :class="route.query.id === opp.id ? 'ring-2 ring-accent rounded-xl' : ''"
            >
              <OpportunityCard :opportunity="opp" :public-mode="true" />
            </div>
          </div>

        </div>
      </main>
    </div>
  </div>
</template>
