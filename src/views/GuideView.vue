<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import WelcomeModal from '@/components/onboarding/WelcomeModal.vue'

const auth = useAuthStore()
const showWelcome = ref(false)

function restartTutorial() {
  localStorage.removeItem('monitor_oportunidades_onboarding')
  showWelcome.value = true
}

const permMatrix = [
  { action: 'Ver listado global',                invitado: '✓',               moderador: '✓',                    admin: '✓' },
  { action: 'Sugerir oportunidades',             invitado: 'Queda pendiente', moderador: 'Aprobada directamente', admin: 'Aprobada directamente' },
  { action: 'Mi Lista (notas, estado, destacar)',invitado: '✓',               moderador: '✓',                    admin: '✓' },
  { action: 'Aprobar / rechazar sugerencias',    invitado: '-',               moderador: '✓',                    admin: '✓' },
  { action: 'Agregar / editar oportunidades',    invitado: '-',               moderador: '✓',                    admin: '✓' },
  { action: 'Eliminar oportunidades',            invitado: '-',               moderador: '✓',                    admin: '✓' },
  { action: 'Gestionar usuarios e invitaciones', invitado: '-',               moderador: '-',                    admin: '✓' },
  { action: 'Importar en lote',                  invitado: '-',               moderador: '-',                    admin: '✓' },
]
</script>

<template>
  <div class="p-6 max-w-3xl space-y-10">

    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-xl font-semibold text-text-primary">Guía de uso</h1>
        <p class="text-text-muted text-sm mt-1">
          Monitor de Oportunidades centraliza convocatorias, grants, fuentes de financiamiento,
          capacitaciones y redes relevantes para el trabajo de seguridad digital en América Latina.
        </p>
      </div>
      <button
        @click="restartTutorial"
        class="shrink-0 px-4 py-2 rounded-lg border border-border-base text-sm text-text-muted hover:text-accent hover:border-accent transition-colors"
      >
        Ver tutorial
      </button>
    </div>

    <WelcomeModal v-if="showWelcome" @close="showWelcome = false" />

    <!-- Secciones -->
    <section class="space-y-3">
      <h2 class="text-sm font-semibold text-text-primary uppercase tracking-wide">Secciones</h2>
      <div class="grid gap-3">
        <div class="bg-bg-surface border border-border-base rounded-xl p-4">
          <p class="text-sm font-medium text-text-primary mb-1">Todas las oportunidades</p>
          <p class="text-sm text-text-muted">
            Vista principal. Muestra todas las oportunidades aprobadas agrupadas por tipo.
            Filtra por tipo o estado, busca por texto o etiqueta.
          </p>
        </div>
        <div class="bg-bg-surface border border-border-base rounded-xl p-4">
          <p class="text-sm font-medium text-text-primary mb-1">Mi Lista</p>
          <p class="text-sm text-text-muted">
            Oportunidades que marcaste con <strong>+ Seguir</strong>. Desde aquí puedes gestionar tu estado personal, agregar notas privadas y marcar como destacada cada oportunidad. Nadie más lo ve desde la app — aunque los datos se guardan en texto plano en la base de datos, por lo que quien tenga acceso directo a ella podría leerlos.
          </p>
        </div>
        <div v-if="auth.canApprove" class="bg-bg-surface border border-border-base rounded-xl p-4">
          <p class="text-sm font-medium text-text-primary mb-1">Pendientes</p>
          <p class="text-sm text-text-muted">
            Propuestas enviadas por invitados esperando revisión. Podés aprobarlas (se publican en el catálogo) o rechazarlas.
          </p>
        </div>
        <div v-if="auth.isAdmin" class="bg-bg-surface border border-border-base rounded-xl p-4">
          <p class="text-sm font-medium text-text-primary mb-1">Administración</p>
          <p class="text-sm text-text-muted">
            Gestión de usuarios (roles, activación), invitaciones por link e importación masiva en formato JSON.
          </p>
        </div>
      </div>
    </section>

    <!-- Tipos de oportunidades -->
    <section class="space-y-3">
      <h2 class="text-sm font-semibold text-text-primary uppercase tracking-wide">Tipos de oportunidades</h2>
      <div class="overflow-x-auto">
        <table class="w-full text-sm border border-border-base rounded-xl overflow-hidden">
          <thead class="bg-bg-surface-2">
            <tr class="text-left">
              <th class="px-4 py-2.5 text-xs font-medium text-text-muted">Tipo</th>
              <th class="px-4 py-2.5 text-xs font-medium text-text-muted">¿Qué es?</th>
              <th class="px-4 py-2.5 text-xs font-medium text-text-muted">Campos propios</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-base bg-bg-surface">
            <tr>
              <td class="px-4 py-3"><span class="px-2 py-0.5 rounded text-xs font-medium bg-zinc-200 text-zinc-700 dark:bg-zinc-700/50 dark:text-zinc-300">Fuente</span></td>
              <td class="px-4 py-3 text-text-muted">Sitio o directorio a revisar periódicamente en busca de convocatorias</td>
              <td class="px-4 py-3 text-text-muted text-xs">Frecuencia (semanal / mensual)</td>
            </tr>
            <tr>
              <td class="px-4 py-3"><span class="px-2 py-0.5 rounded text-xs font-medium bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-400">Convocatoria</span></td>
              <td class="px-4 py-3 text-text-muted">Llamado abierto con fecha límite de aplicación</td>
              <td class="px-4 py-3 text-text-muted text-xs">Fecha límite, monto, recordatorio (días)</td>
            </tr>
            <tr>
              <td class="px-4 py-3"><span class="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">Grant</span></td>
              <td class="px-4 py-3 text-text-muted">Fondo de financiamiento con convocatorias recurrentes o fondo abierto</td>
              <td class="px-4 py-3 text-text-muted text-xs">Monto, quién puede aplicar, fecha límite</td>
            </tr>
            <tr>
              <td class="px-4 py-3"><span class="px-2 py-0.5 rounded text-xs font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400">Capacitación</span></td>
              <td class="px-4 py-3 text-text-muted">Curso, taller o programa de formación</td>
              <td class="px-4 py-3 text-text-muted text-xs">Fecha, modalidad, dirigido a</td>
            </tr>
            <tr>
              <td class="px-4 py-3"><span class="px-2 py-0.5 rounded text-xs font-medium bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400">Red</span></td>
              <td class="px-4 py-3 text-text-muted">Comunidad, coalición o espacio colaborativo</td>
              <td class="px-4 py-3 text-text-muted text-xs">Cómo unirse</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Flujo personal -->
    <section class="space-y-3">
      <h2 class="text-sm font-semibold text-text-primary uppercase tracking-wide">Flujo de seguimiento personal</h2>
      <p class="text-sm text-text-muted">Al hacer clic en <strong>+ Seguir</strong> la oportunidad entra en tu lista personal con estado <strong>Nueva</strong>. Desde Mi Lista puedes cambiar su estado:</p>
      <div class="flex flex-wrap gap-2">
        <div class="flex items-center gap-2 bg-bg-surface border border-border-base rounded-lg px-3 py-2">
          <span class="w-2 h-2 rounded-full bg-zinc-300 shrink-0"></span>
          <span class="text-xs text-text-primary font-medium">Nueva</span>
          <span class="text-xs text-text-muted">- recién agregada</span>
        </div>
        <div class="flex items-center gap-2 bg-bg-surface border border-border-base rounded-lg px-3 py-2">
          <span class="w-2 h-2 rounded-full bg-green-500 shrink-0"></span>
          <span class="text-xs text-text-primary font-medium">Siguiendo</span>
          <span class="text-xs text-text-muted">- en seguimiento activo</span>
        </div>
        <div class="flex items-center gap-2 bg-bg-surface border border-border-base rounded-lg px-3 py-2">
          <span class="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
          <span class="text-xs text-text-primary font-medium">Aplicando</span>
          <span class="text-xs text-text-muted">- en proceso</span>
        </div>
        <div class="flex items-center gap-2 bg-bg-surface border border-border-base rounded-lg px-3 py-2">
          <span class="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
          <span class="text-xs text-text-primary font-medium">Aplicada</span>
          <span class="text-xs text-text-muted">- enviada</span>
        </div>
        <div class="flex items-center gap-2 bg-bg-surface border border-border-base rounded-lg px-3 py-2">
          <span class="w-2 h-2 rounded-full bg-zinc-400 shrink-0"></span>
          <span class="text-xs text-text-primary font-medium">Descartada</span>
          <span class="text-xs text-text-muted">- no aplica</span>
        </div>
      </div>
    </section>

    <!-- Roles -->
    <section class="space-y-3">
      <h2 class="text-sm font-semibold text-text-primary uppercase tracking-wide">Roles y permisos</h2>
      <div class="overflow-x-auto">
        <table class="w-full text-sm border border-border-base rounded-xl overflow-hidden">
          <thead class="bg-bg-surface-2">
            <tr class="text-left">
              <th class="px-4 py-2.5 text-xs font-medium text-text-muted">Acción</th>
              <th class="px-4 py-2.5 text-xs font-medium text-text-muted text-center">Invitado</th>
              <th class="px-4 py-2.5 text-xs font-medium text-text-muted text-center">Moderador</th>
              <th class="px-4 py-2.5 text-xs font-medium text-text-muted text-center">Admin</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-base bg-bg-surface text-xs">
            <tr v-for="row in permMatrix" :key="row.action">
              <td class="px-4 py-2.5 text-text-muted">{{ row.action }}</td>
              <td class="px-4 py-2.5 text-center">{{ row.invitado }}</td>
              <td class="px-4 py-2.5 text-center">{{ row.moderador }}</td>
              <td class="px-4 py-2.5 text-center">{{ row.admin }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

  </div>
</template>
