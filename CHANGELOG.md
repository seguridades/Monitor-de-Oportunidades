# Changelog

Formato: [Keep a Changelog](https://keepachangelog.com/es/1.0.0/)
Versionado: [Semantic Versioning](https://semver.org/lang/es/) — `Major.Minor.Patch`

---

## [0.5.0] — 2026-03-27

### Agregado
- **Tipos de oportunidad**: nuevo tipo "Beca / Fellowship" (`beca`) con campos propios: deadline, monto/estipendio, duración, quién puede aplicar
- **Reportar oportunidad**: botón en cada tarjeta para reportar link roto, info desactualizada, duplicado u otro motivo. Genera un reporte visible para moderadores y admins
- **Vista Reportes** (`/reports`): lista de reportes pendientes y resueltos, con acciones directas sobre la oportunidad (editar, archivar, eliminar)
- **Exportar a calendario**: botón en Mi Lista para agregar deadlines a iCal (descarga `.ics`) o Google Calendar, disponible en convocatorias, grants y becas
- **Tags con autocomplete**: el campo de etiquetas en el formulario ahora muestra chips con sugerencias de tags existentes en el catálogo. Previene duplicados por capitalización
- **Detección offline**: banner de aviso cuando el navegador pierde conexión a internet
- **Copiar enlace**: botón en cada tarjeta para copiar el URL externo de la oportunidad al portapapeles
- **Limpiar filtros**: botón × en el campo de búsqueda y botón "Limpiar" en el header cuando hay filtros activos
- **Snooze en Pendientes**: opción "Revisar después" en la vista de pendientes para posponer oportunidades sin rechazarlas
- **Notificaciones mejoradas**: eliminar notificación individual, limpiar leídas, contador real (sin límite de "9+"), estilo diferenciado entre leídas y no leídas
- **Contadores por categoría en login**: chips con el total de oportunidades aprobadas por tipo, visible antes de iniciar sesión
- **Schema de importación**: archivo `oportunidades-import-schema.md` con referencia completa del formato JSON para importación masiva
- **Skill `/extraer-oportunidad`**: skill de Claude Code para extraer datos de una URL y construir el JSON de importación

### Cambiado
- Las importaciones JSON masivas siempre van a `pendiente_aprobacion`, independientemente de si se completa la etiqueta de lote
- Dropdowns dentro de cards y modales usan `Teleport to="body"` para evitar clipping por `overflow-hidden`
- Guía de uso y tutorial inicial actualizados con todas las funciones nuevas y tipos de oportunidad

### Corregido
- Error de permisos al eliminar notificaciones (regla de Firestore faltante)
- Contadores de login fallaban silenciosamente por falta de `orderBy` en consulta con `!=`
- `setTimeout` no disponible directamente en expresiones de template de Vue (tags autocomplete)
- Sugerencias de tags solo aparecían para el primer tag; el campo no reactivaba `showSuggestions` tras agregar uno

---

## [0.4.0] — 2026-03-18

### Agregado
- Exportar Mi Lista a CSV
- Tutorial de bienvenida (WelcomeModal) con pasos por rol
- Mejoras de rendimiento en carga inicial

### Cambiado
- Reestructuración del modelo: acceso por invitación abierto a aliados externos, no solo equipo interno

---

## [0.3.0] — 2026-03-10

### Agregado
- Sistema de invitaciones por token
- Roles: `admin`, `moderador`, `invitado`
- Vista de administración: usuarios, invitaciones, importación JSON
- Vista de pendientes con flujo de aprobación/rechazo

---

## [0.2.0] — 2026-02-20

### Agregado
- Mi Lista: seguimiento personal con estados (Nueva, Siguiendo, Aplicando, Aplicada, Descartada)
- Notas privadas por oportunidad con timestamp
- Destacar oportunidades (estrella)
- Notificaciones in-app en tiempo real

---

## [0.1.0] — 2026-02-01

### Agregado
- Catálogo de oportunidades con tipos: Fuente, Convocatoria, Grant, Capacitación, Evento, Red, Línea de Ayuda
- Autenticación con Firebase Auth (email/password)
- Filtros por tipo, estado y búsqueda de texto
- Modo oscuro / claro
- Sidebar con navegación por sección
