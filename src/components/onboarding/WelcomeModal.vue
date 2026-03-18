<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { Compass, Search, Bookmark, PenLine, Lightbulb } from 'lucide-vue-next'

const STORAGE_KEY = 'onboarding_done'

const emit = defineEmits(['close'])
const auth = useAuthStore()

const step = ref(0)

const steps = computed(() => {
  const base = [
    {
      icon: Compass,
      title: `Bienvenido/a, ${auth.userProfile?.displayName?.split(' ')[0] ?? 'aquí'}`,
      body: 'Este es el Monitor de Oportunidades de seguridades.org - un espacio centralizado para rastrear convocatorias, grants, capacitaciones, fuentes y redes relevantes para el trabajo de seguridad digital en América Latina.',
      sub: 'En unos pasos te mostramos cómo funciona.',
    },
    {
      icon: Search,
      title: 'Explora las oportunidades',
      body: 'En la vista principal encontrarás todas las oportunidades organizadas por tipo: Fuentes, Convocatorias, Grants, Capacitaciones y Redes.',
      bullets: [
        'Usa los filtros del panel izquierdo para acotar por tipo, estado o relevancia.',
        'Busca por nombre, descripción o etiqueta en el buscador.',
        'Haz clic en cualquier etiqueta de una tarjeta para filtrar por ella.',
        'Las tarjetas con borde magenta son oportunidades destacadas por el equipo.',
      ],
    },
    {
      icon: Bookmark,
      title: 'Sigue lo que te interesa',
      body: 'Cada oportunidad tiene un botón "+ Seguir". Al hacerlo, la oportunidad se agrega a tu lista personal en "Mi Lista".',
      bullets: [
        'En Mi Lista puedes cambiar tu estado: Nueva - En revisión - Aplicada - Descartada.',
        'Puedes agregar notas personales privadas sobre cada oportunidad.',
        'Nadie más ve tu estado ni tus notas privadas.',
      ],
    },
    ...(auth.isMember ? [{
      icon: PenLine,
      title: 'Agrega y gestiona oportunidades',
      body: 'Como miembro del equipo, puedes agregar nuevas oportunidades directamente - aparecen publicadas al instante.',
      bullets: [
        'Usa el botón "+ Agregar" en la vista principal.',
        'Puedes editar, cambiar el estado global y marcar oportunidades como destacadas.',
        auth.isAdmin ? 'Como admin también gestionas usuarios e invitaciones desde el panel de Administración.' : 'Las propuestas de usuarios invitados aparecen en "Pendientes" para que las revises.',
      ],
    }] : [{
      icon: Lightbulb,
      title: 'Puedes proponer oportunidades',
      body: 'Si encuentras una oportunidad que no está en el monitor, puedes proponerla usando el botón "Proponer".',
      bullets: [
        'Tu propuesta queda en estado "Pendiente de aprobación".',
        'Un miembro del equipo la revisa y la publica si es relevante.',
        'Mientras tanto puedes editarla o descartarla desde la vista de pendientes.',
      ],
    }]),
  ]
  return base
})

const current = computed(() => steps.value[step.value])
const isLast = computed(() => step.value === steps.value.length - 1)

function next() {
  if (isLast.value) finish()
  else step.value++
}

function finish() {
  localStorage.setItem(STORAGE_KEY, '1')
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="finish" />

      <div class="relative bg-bg-surface border border-border-base rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <!-- Progress bar -->
        <div class="h-1 bg-bg-surface-2">
          <div
            class="h-1 bg-accent transition-all duration-300"
            :style="{ width: `${((step + 1) / steps.length) * 100}%` }"
          />
        </div>

        <!-- Content -->
        <div class="p-8">
          <!-- Icon -->
          <div class="mb-5 w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
            <component :is="current.icon" class="w-5 h-5" />
          </div>

          <!-- Title -->
          <h2 class="text-lg font-semibold text-text-primary mb-3">{{ current.title }}</h2>

          <!-- Body -->
          <p class="text-sm text-text-muted mb-4 leading-relaxed">{{ current.body }}</p>

          <!-- Bullets -->
          <ul v-if="current.bullets" class="space-y-2 mb-4">
            <li
              v-for="bullet in current.bullets"
              :key="bullet"
              class="flex items-start gap-2 text-sm text-text-muted"
            >
              <span class="text-accent mt-0.5 shrink-0">→</span>
              <span>{{ bullet }}</span>
            </li>
          </ul>
        </div>

        <!-- Footer -->
        <div class="px-8 pb-6 flex items-center justify-between">
          <!-- Step dots -->
          <div class="flex items-center gap-1.5">
            <button
              v-for="(_, i) in steps"
              :key="i"
              @click="step = i"
              class="rounded-full transition-all duration-200"
              :class="i === step
                ? 'w-4 h-2 bg-accent'
                : 'w-2 h-2 bg-border-base hover:bg-text-muted'"
            />
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-3">
            <button
              v-if="step > 0"
              @click="step--"
              class="text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              Atrás
            </button>
            <button
              @click="next"
              class="px-5 py-2 rounded-lg bg-accent text-bg-base text-sm font-medium hover:opacity-90 transition-opacity"
            >
              {{ isLast ? 'Comenzar' : 'Siguiente' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
