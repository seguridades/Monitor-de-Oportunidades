<script setup>
// Static informational view — no reactive state needed
</script>

<template>
  <div class="p-6 max-w-3xl space-y-10">

    <div>
      <h1 class="text-xl font-semibold text-text-primary">Acerca del proyecto</h1>
      <p class="text-text-muted text-sm mt-1">Información sobre la plataforma, tecnología, privacidad y planes a futuro.</p>
    </div>

    <!-- Aviso de privacidad -->
    <section class="space-y-3">
      <h2 class="text-sm font-semibold text-text-primary uppercase tracking-wide">Aviso de privacidad</h2>
      <div class="bg-bg-surface border border-border-base rounded-xl p-4">
        <p class="text-sm text-text-muted leading-relaxed">
          Esta plataforma almacena únicamente la información que cada usuario ingresa voluntariamente: nombre o pseudónimo, organización, y los datos de seguimiento personal (estado, notas y destacados en Mi Lista). Dicha información se guarda en texto plano en la base de datos y es accesible para quien tenga acceso directo a ella. No se comparte con terceros ni se utiliza con fines comerciales. El acceso a la plataforma es por invitación y está restringido a personas de confianza del equipo de seguridades.org y organizaciones aliadas.
        </p>
      </div>
    </section>

    <!-- Tecnología -->
    <section class="space-y-3">
      <h2 class="text-sm font-semibold text-text-primary uppercase tracking-wide">Tecnología</h2>
      <div class="bg-bg-surface border border-border-base rounded-xl p-4 space-y-3">
        <div class="grid gap-2 text-sm">
          <div class="flex items-start gap-3">
            <span class="shrink-0 text-xs font-medium text-text-muted w-28">Frontend</span>
            <span class="text-text-primary">Vue.js 3 + Vite + Tailwind CSS</span>
          </div>
          <div class="flex items-start gap-3">
            <span class="shrink-0 text-xs font-medium text-text-muted w-28">Base de datos</span>
            <span class="text-text-primary">Firebase Firestore (Google)</span>
          </div>
          <div class="flex items-start gap-3">
            <span class="shrink-0 text-xs font-medium text-text-muted w-28">Autenticación</span>
            <span class="text-text-primary">Firebase Auth</span>
          </div>
          <div class="flex items-start gap-3">
            <span class="shrink-0 text-xs font-medium text-text-muted w-28">Hosting</span>
            <span class="text-text-primary">Firebase Hosting</span>
          </div>
        </div>
        <div class="border-t border-border-base pt-3">
          <p class="text-xs text-text-muted leading-relaxed">
            <span class="text-text-primary font-medium">¿Por qué Firebase?</span>
            Somos fans de las tecnologías descentralizadas y de infraestructura soberana, pero este no es un proyecto con financiamiento dedicado. Firebase nos permite mantener la plataforma operativa con costo mínimo y sin carga de mantenimiento de servidores. Es una decisión pragmática, no una preferencia filosófica.
          </p>
        </div>
      </div>
    </section>

    <!-- Código abierto -->
    <section class="space-y-3">
      <h2 class="text-sm font-semibold text-text-primary uppercase tracking-wide">Código abierto</h2>
      <div class="bg-bg-surface border border-border-base rounded-xl p-4">
        <p class="text-sm text-text-muted leading-relaxed">
          El código fuente de esta plataforma es abierto. Puedes revisarlo, adaptarlo o contribuir desde nuestro repositorio:
        </p>
        <a
          href="https://github.com/seguridades/Monitor-de-Oportunidades"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1.5 mt-3 text-sm text-accent hover:underline"
        >
          github.com/seguridades/Monitor-de-Oportunidades
        </a>
      </div>
    </section>

    <!-- Acceso -->
    <section class="space-y-3">
      <h2 class="text-sm font-semibold text-text-primary uppercase tracking-wide">Acceso a la plataforma</h2>
      <div class="bg-bg-surface border border-border-base rounded-xl p-4">
        <p class="text-sm text-text-muted leading-relaxed">
          Por ahora el Monitor de Oportunidades es un proyecto cerrado, accesible solo mediante invitación. Queremos que en el futuro pueda ser más abierto y servir a toda la comunidad de seguridad digital en América Latina — ya sea como plataforma pública o como herramienta que otras organizaciones puedan instalar y operar de forma independiente.
        </p>
      </div>
    </section>

    <!-- A futuro -->
    <section class="space-y-3">
      <h2 class="text-sm font-semibold text-text-primary uppercase tracking-wide">A futuro</h2>
      <div class="grid gap-2">
        <div class="bg-bg-surface border border-border-base rounded-xl p-4 flex items-start gap-3">
          <span class="text-accent shrink-0 mt-0.5">→</span>
          <div>
            <p class="text-sm font-medium text-text-primary">Recordatorios de deadline</p>
            <p class="text-xs text-text-muted mt-0.5">Notificaciones automáticas N días antes del cierre de una convocatoria o grant.</p>
          </div>
        </div>
        <div class="bg-bg-surface border border-border-base rounded-xl p-4 flex items-start gap-3">
          <span class="text-accent shrink-0 mt-0.5">→</span>
          <div>
            <p class="text-sm font-medium text-text-primary">Exportar a calendario</p>
            <p class="text-xs text-text-muted mt-0.5">Agregar deadlines directamente a Google Calendar o iCal desde la tarjeta de la oportunidad.</p>
          </div>
        </div>
        <div class="bg-bg-surface border border-border-base rounded-xl p-4 flex items-start gap-3">
          <span class="text-accent shrink-0 mt-0.5">→</span>
          <div>
            <p class="text-sm font-medium text-text-primary">Vista kanban en Mi Lista</p>
            <p class="text-xs text-text-muted mt-0.5">Gestionar el seguimiento personal con una vista tipo tablero, agrupada por estados.</p>
          </div>
        </div>
        <div class="bg-bg-surface border border-border-base rounded-xl p-4 flex items-start gap-3">
          <span class="text-accent shrink-0 mt-0.5">→</span>
          <div>
            <p class="text-sm font-medium text-text-primary">Plataforma más abierta</p>
            <p class="text-xs text-text-muted mt-0.5">Avanzar hacia un acceso más amplio para toda la comunidad, o habilitar instancias independientes para otras organizaciones.</p>
          </div>
        </div>
        <div class="bg-bg-surface border border-border-base rounded-xl p-4 flex items-start gap-3">
          <span class="text-accent shrink-0 mt-0.5">→</span>
          <div>
            <p class="text-sm font-medium text-text-primary">Infraestructura soberana</p>
            <p class="text-xs text-text-muted mt-0.5">Si el proyecto consigue financiamiento, migrar a infraestructura más alineada con nuestros valores: autoalojada, descentralizada o con proveedores de la comunidad.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Contacto -->
    <section class="space-y-3">
      <h2 class="text-sm font-semibold text-text-primary uppercase tracking-wide">Contacto</h2>
      <div class="bg-bg-surface border border-border-base rounded-xl p-4">
        <p class="text-sm text-text-muted leading-relaxed">
          Para solicitudes, comentarios, feedback o reportar un problema, escríbenos a:
        </p>
        <a
          href="mailto:info@seguridades.org"
          class="inline-block mt-2 text-sm text-accent hover:underline font-medium"
        >
          info@seguridades.org
        </a>
      </div>
    </section>

  </div>
</template>
