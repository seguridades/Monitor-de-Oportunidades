<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { Compass, Search, Bookmark, PenLine, Lightbulb } from 'lucide-vue-next'

const STORAGE_KEY = 'monitor_oportunidades_onboarding'

const emit = defineEmits(['close'])
const auth = useAuthStore()

const step = ref(0)

const steps = computed(() => {
  const firstName = auth.userProfile?.displayName?.split(' ')[0] ?? 'aquí'

  return [
    {
      icon: Compass,
      title: `Bienvenido/a, ${firstName}`,
      body: 'Este es el Monitor de Oportunidades — un espacio centralizado para rastrear convocatorias, grants, capacitaciones, fuentes y redes relevantes para el trabajo de seguridad integral en América Latina.',
      sub: 'En unos pasos te mostramos cómo funciona.',
    },
    {
      icon: Search,
      title: 'Explora las oportunidades',
      body: 'En la vista principal encontrarás todas las oportunidades agrupadas por tipo: Fuentes, Convocatorias, Grants, Capacitaciones, Eventos / Actividades y Redes.',
      bullets: [
        'Usa los filtros del panel izquierdo para acotar por tipo o estado.',
        'Busca por nombre, descripción o etiqueta en el buscador.',
        'Haz clic en cualquier etiqueta de una tarjeta para filtrar por ella.',
      ],
    },
    {
      icon: Bookmark,
      title: 'Sigue lo que te interesa',
      body: 'Cada oportunidad tiene un botón "+ Seguir". Al hacerlo, la oportunidad entra en tu lista personal en "Mi Lista".',
      bullets: [
        'En Mi Lista puedes cambiar tu estado: Nueva, Siguiendo, Aplicando, Aplicada o Descartada.',
        'Puedes agregar notas privadas con fecha y hora sobre cada oportunidad.',
        'Nadie más ve tu estado ni tus notas desde la app.*',
        '* Los datos se guardan en texto plano en la base de datos. Quien tenga acceso directo a la DB podría leerlos.',
      ],
    },
    ...(auth.canEdit ? [{
      icon: PenLine,
      title: auth.isAdmin ? 'Administrás la plataforma' : 'Podés agregar y aprobar',
      body: auth.isAdmin
        ? 'Como admin puedes gestionar todo el contenido y los usuarios.'
        : 'Como moderador puedes agregar, editar y aprobar oportunidades.',
      bullets: auth.isAdmin ? [
        'Aprobá o rechazá oportunidades propuestas por invitados.',
        'Invitá nuevos usuarios y asignales su rol.',
        'Editá o eliminá oportunidades del catálogo.',
        'Importá oportunidades en lote desde JSON.',
      ] : [
        'Usá el botón "+ Agregar" para publicar directamente.',
        'Revisá y aprobá las propuestas desde la sección Pendientes.',
        'Podés editar cualquier oportunidad del catálogo.',
      ],
    }] : [{
      icon: Lightbulb,
      title: 'Podés proponer oportunidades',
      body: 'Si encuentras una oportunidad que no está en el monitor, puedes proponerla usando el botón "Proponer".',
      bullets: [
        'Tu propuesta queda en estado "Pendiente de aprobación".',
        'Un moderador o admin la revisa y la publica si es relevante.',
      ],
    }]),
  ]
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
          <div class="mb-5 w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
            <component :is="current.icon" class="w-5 h-5" />
          </div>
          <h2 class="text-lg font-semibold text-text-primary mb-3">{{ current.title }}</h2>
          <p class="text-sm text-text-muted mb-4 leading-relaxed">{{ current.body }}</p>
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
