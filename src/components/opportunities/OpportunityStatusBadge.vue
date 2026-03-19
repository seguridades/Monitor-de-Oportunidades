<script setup>
defineProps({ status: String })

const statusMap = {
  // Platform statuses
  nueva:                { label: 'Nueva',       class: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' },
  en_revision:          { label: 'En revisión', class: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' },
  aplicada:             { label: 'Aplicada',    class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' },
  descartada:           { label: 'Descartada',  class: 'bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400' },
  pendiente_aprobacion: { label: 'Pendiente',   class: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' },
  // Personal statuses
  siguiendo:  { label: 'Siguiendo',  class: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' },
  aplicando:  { label: 'Aplicando',  class: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' },
}
</script>

<template>
  <span
    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
    :class="statusMap[status]?.class ?? 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'"
  >
    {{ statusMap[status]?.label ?? status }}
  </span>
</template>
