<script setup>
import { ref, watch, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  opportunity: { type: Object, default: null },
})
const emit = defineEmits(['submit', 'cancel'])

const auth = useAuthStore()

function toDateInputValue(val) {
  if (!val) return ''
  const d = val?.toDate ? val.toDate() : new Date(val)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().split('T')[0]
}

// Form state
const form = ref({
  title: '',
  type: 'fuente',
  description: '',
  url: '',
  fit: 'Bueno',
  tags: '',
  featured: false,
  // fuente
  freq: 'semanal',
  // convocatoria
  deadline: '',
  reminderDays: 7,
  monto: '',
  // grant
  quien_puede_aplicar: '',
  // capacitacion
  fecha: '',
  modalidad: 'virtual',
  dirigido_a: '',
  // red
  como_unirse: '',
})

// Populate if editing
watch(
  () => props.opportunity,
  (opp) => {
    if (!opp) return
    form.value = {
      title: opp.title || '',
      type: opp.type || 'fuente',
      description: opp.description || '',
      url: opp.url || '',
      fit: opp.fit || 'Bueno',
      tags: Array.isArray(opp.tags) ? opp.tags.join(', ') : (opp.tags || ''),
      featured: !!opp.featured,
      freq: opp.freq || 'semanal',
      deadline: toDateInputValue(opp.deadline),
      reminderDays: opp.reminderDays ?? 7,
      monto: opp.monto || '',
      quien_puede_aplicar: opp.quien_puede_aplicar || '',
      fecha: toDateInputValue(opp.fecha),
      modalidad: opp.modalidad || 'virtual',
      dirigido_a: opp.dirigido_a || '',
      como_unirse: opp.como_unirse || '',
    }
  },
  { immediate: true }
)

function handleSubmit() {
  const tags = form.value.tags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)

  const data = {
    title: form.value.title.trim(),
    type: form.value.type,
    description: form.value.description.trim(),
    url: form.value.url.trim(),
    fit: form.value.fit,
    tags,
    featured: form.value.featured,
  }

  if (form.value.type === 'fuente') {
    data.freq = form.value.freq
  }
  if (form.value.type === 'convocatoria') {
    data.deadline = form.value.deadline ? new Date(form.value.deadline + 'T00:00:00') : null
    data.reminderDays = Number(form.value.reminderDays) || 7
    if (form.value.monto) data.monto = form.value.monto.trim()
  }
  if (form.value.type === 'grant') {
    data.deadline = form.value.deadline ? new Date(form.value.deadline + 'T00:00:00') : null
    if (form.value.monto) data.monto = form.value.monto.trim()
    if (form.value.quien_puede_aplicar) data.quien_puede_aplicar = form.value.quien_puede_aplicar.trim()
  }
  if (form.value.type === 'capacitacion') {
    data.fecha = form.value.fecha ? new Date(form.value.fecha + 'T00:00:00') : null
    data.modalidad = form.value.modalidad
    if (form.value.dirigido_a) data.dirigido_a = form.value.dirigido_a.trim()
  }
  if (form.value.type === 'red') {
    if (form.value.como_unirse) data.como_unirse = form.value.como_unirse.trim()
  }

  emit('submit', data)
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="px-6 py-5 space-y-4">
    <!-- Title -->
    <div>
      <label class="block text-xs font-medium text-text-muted mb-1">Título *</label>
      <input
        v-model="form.title"
        type="text"
        required
        class="w-full px-3 py-2 rounded-lg border border-border-base bg-bg-base text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
        placeholder="Nombre de la oportunidad"
      />
    </div>

    <!-- Type + Fit row -->
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-xs font-medium text-text-muted mb-1">Tipo *</label>
        <select
          v-model="form.type"
          class="w-full px-3 py-2 rounded-lg border border-border-base bg-bg-base text-text-primary text-sm focus:outline-none focus:border-accent transition-colors"
        >
          <option value="fuente">Fuente</option>
          <option value="convocatoria">Convocatoria</option>
          <option value="grant">Grant</option>
          <option value="capacitacion">Capacitación</option>
          <option value="red">Red</option>
        </select>
      </div>
      <div>
        <label class="block text-xs font-medium text-text-muted mb-1">Relevancia *</label>
        <select
          v-model="form.fit"
          class="w-full px-3 py-2 rounded-lg border border-border-base bg-bg-base text-text-primary text-sm focus:outline-none focus:border-accent transition-colors"
        >
          <option value="Alto">Alto</option>
          <option value="Bueno">Bueno</option>
          <option value="Selectivo">Selectivo</option>
        </select>
      </div>
    </div>

    <!-- Description -->
    <div>
      <label class="block text-xs font-medium text-text-muted mb-1">Descripción</label>
      <textarea
        v-model="form.description"
        rows="3"
        class="w-full px-3 py-2 rounded-lg border border-border-base bg-bg-base text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors resize-none"
        placeholder="Descripción breve..."
      />
    </div>

    <!-- URL -->
    <div>
      <label class="block text-xs font-medium text-text-muted mb-1">URL</label>
      <input
        v-model="form.url"
        type="url"
        class="w-full px-3 py-2 rounded-lg border border-border-base bg-bg-base text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
        placeholder="https://..."
      />
    </div>

    <!-- Tags -->
    <div>
      <label class="block text-xs font-medium text-text-muted mb-1">Etiquetas (separadas por coma)</label>
      <input
        v-model="form.tags"
        type="text"
        class="w-full px-3 py-2 rounded-lg border border-border-base bg-bg-base text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
        placeholder="periodismo, digital, AL"
      />
    </div>

    <!-- Featured (member/admin only) -->
    <div v-if="auth.isMember" class="flex items-center gap-2">
      <input
        id="featured-check"
        v-model="form.featured"
        type="checkbox"
        class="w-4 h-4 rounded border-border-base accent-accent"
      />
      <label for="featured-check" class="text-sm text-text-primary cursor-pointer">Destacada</label>
    </div>

    <!-- Type-specific fields -->

    <!-- fuente -->
    <div v-if="form.type === 'fuente'">
      <label class="block text-xs font-medium text-text-muted mb-1">Frecuencia de revisión</label>
      <select
        v-model="form.freq"
        class="w-full px-3 py-2 rounded-lg border border-border-base bg-bg-base text-text-primary text-sm focus:outline-none focus:border-accent transition-colors"
      >
        <option value="semanal">Semanal</option>
        <option value="mensual">Mensual</option>
      </select>
    </div>

    <!-- convocatoria -->
    <template v-if="form.type === 'convocatoria'">
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-medium text-text-muted mb-1">Fecha límite</label>
          <input
            v-model="form.deadline"
            type="date"
            class="w-full px-3 py-2 rounded-lg border border-border-base bg-bg-base text-text-primary text-sm focus:outline-none focus:border-accent transition-colors"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-text-muted mb-1">Recordatorio (días antes)</label>
          <input
            v-model.number="form.reminderDays"
            type="number"
            min="1"
            class="w-full px-3 py-2 rounded-lg border border-border-base bg-bg-base text-text-primary text-sm focus:outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>
      <div>
        <label class="block text-xs font-medium text-text-muted mb-1">Monto</label>
        <input
          v-model="form.monto"
          type="text"
          class="w-full px-3 py-2 rounded-lg border border-border-base bg-bg-base text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
          placeholder="Ej: USD 50,000"
        />
      </div>
    </template>

    <!-- grant -->
    <template v-if="form.type === 'grant'">
      <div>
        <label class="block text-xs font-medium text-text-muted mb-1">Fecha límite (opcional)</label>
        <input
          v-model="form.deadline"
          type="date"
          class="w-full px-3 py-2 rounded-lg border border-border-base bg-bg-base text-text-primary text-sm focus:outline-none focus:border-accent transition-colors"
        />
      </div>
      <div>
        <label class="block text-xs font-medium text-text-muted mb-1">Monto</label>
        <input
          v-model="form.monto"
          type="text"
          class="w-full px-3 py-2 rounded-lg border border-border-base bg-bg-base text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
          placeholder="Ej: USD 50k–150k/año"
        />
      </div>
      <div>
        <label class="block text-xs font-medium text-text-muted mb-1">¿Quién puede aplicar?</label>
        <input
          v-model="form.quien_puede_aplicar"
          type="text"
          class="w-full px-3 py-2 rounded-lg border border-border-base bg-bg-base text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
          placeholder="ONGs, consultores, etc."
        />
      </div>
    </template>

    <!-- capacitacion -->
    <template v-if="form.type === 'capacitacion'">
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-medium text-text-muted mb-1">Fecha</label>
          <input
            v-model="form.fecha"
            type="date"
            class="w-full px-3 py-2 rounded-lg border border-border-base bg-bg-base text-text-primary text-sm focus:outline-none focus:border-accent transition-colors"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-text-muted mb-1">Modalidad</label>
          <select
            v-model="form.modalidad"
            class="w-full px-3 py-2 rounded-lg border border-border-base bg-bg-base text-text-primary text-sm focus:outline-none focus:border-accent transition-colors"
          >
            <option value="virtual">Virtual</option>
            <option value="presencial">Presencial</option>
            <option value="hibrida">Híbrida</option>
          </select>
        </div>
      </div>
      <div>
        <label class="block text-xs font-medium text-text-muted mb-1">Dirigido a</label>
        <input
          v-model="form.dirigido_a"
          type="text"
          class="w-full px-3 py-2 rounded-lg border border-border-base bg-bg-base text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
          placeholder="Periodistas, activistas, etc."
        />
      </div>
    </template>

    <!-- red -->
    <div v-if="form.type === 'red'">
      <label class="block text-xs font-medium text-text-muted mb-1">¿Cómo unirse?</label>
      <input
        v-model="form.como_unirse"
        type="text"
        class="w-full px-3 py-2 rounded-lg border border-border-base bg-bg-base text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
        placeholder="Instrucciones para unirse..."
      />
    </div>

    <!-- Actions -->
    <div class="flex items-center justify-end gap-3 pt-2">
      <button
        type="button"
        @click="emit('cancel')"
        class="px-4 py-2 rounded-lg text-sm text-text-muted hover:text-text-primary hover:bg-bg-surface-2 transition-colors"
      >
        Cancelar
      </button>
      <button
        type="submit"
        class="px-4 py-2 rounded-lg bg-accent text-bg-base text-sm font-medium hover:opacity-90 transition-opacity"
      >
        {{ opportunity ? 'Guardar cambios' : 'Agregar oportunidad' }}
      </button>
    </div>
  </form>
</template>
