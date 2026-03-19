---
name: Estado actual del proyecto
description: Resumen completo del estado del proyecto Monitor de Oportunidades, arquitectura, cambios recientes y pendientes
type: project
---

## Qué es el proyecto

**Monitor de Oportunidades** — plataforma multi-tenant Vue 3 + Firebase para rastrear convocatorias, grants, capacitaciones, fuentes y redes relevantes para seguridad digital en América Latina.

Antes era una herramienta interna de seguridades.org. Ahora es una plataforma abierta donde:
- Los **admins** curan el listado general (aprueban/rechazan propuestas, editan, destacan)
- Cualquier usuario puede **proponer** oportunidades (quedan pendientes hasta aprobación)
- Usuarios e **individuos u organizaciones** tienen su propia capa de seguimiento sobre el listado general

## Stack

- Vue 3 + Vite, Composition API `<script setup>`
- Tailwind CSS v4 con `@custom-variant dark` y CSS custom properties
- Firebase: Firestore + Auth (email/password)
- Pinia stores, Vue Router 4
- `lucide-vue-next` para iconos, `vue-sonner` para toasts

## Modelo de datos Firestore

### Colecciones principales

```
opportunities/{id}
  title, type, description, url, tags[], featured, status
  fit (relevancia global — solo admins la fijan)
  notesCount (int — sincronizado al agregar/borrar notas de org)
  type: fuente | convocatoria | grant | capacitacion | red
  status: nueva | en_revision | aplicada | descartada | pendiente_aprobacion
  deadline, monto, freq, fecha, modalidad, etc. (según tipo)

users/{uid}
  displayName, email, org (texto libre, legacy)
  orgId (FK a organizations — nuevo)
  role: admin | user | member (legacy) | guest (legacy)
  active: boolean

organizations/{id}
  name, description, active, createdAt

user_follows/{userId}_{opportunityId}
  userId, opportunityId, followedAt
  personalStatus: siguiendo | en_revision | aplicada | descartada
  personalNote, noteShared (noteShared guardado pero no consumido aún)
  relevancia: Alto | Bueno | Selectivo | null  ← NUEVO

org_follows/{orgId}_{opportunityId}
  orgId, opportunityId, followedBy, followedAt
  status: nueva | en_revision | aplicada | descartada
  relevancia: Alto | Bueno | Selectivo | null
  → subcol: notes/{noteId}
      content, authorId, authorName, orgId, createdAt

invitations/{id}
  email, role, orgId (opcional — nuevo), token, used, expiresAt, invitedBy
```

## Roles

| Rol | Descripción |
|-----|-------------|
| `admin` | Admin de plataforma — aprueba, edita, gestiona orgs/usuarios |
| `user` | Nuevo rol por defecto — puede proponer, seguir, tiene lista personal |
| `member` | Legacy — se comporta como admin para aprobaciones |
| `guest` | Legacy — se comporta como `user` |

**En `auth.js`:**
- `isAdmin` = `role === 'admin'`
- `isMember` = `role === 'admin' || role === 'member'` (backward compat)
- `isGuest` = `role === 'guest' || role === 'user'`
- `orgId` = `userProfile.orgId ?? null`

## Stores

| Store | Archivo | Descripción |
|-------|---------|-------------|
| auth | stores/auth.js | Usuario, perfil, roles, orgId |
| opportunities | stores/opportunities.js | Listado general, real-time |
| follows | stores/follows.js | Follows personales |
| orgFollows | stores/orgFollows.js | Follows de org, real-time por orgId |
| organizations | stores/organizations.js | CRUD organizaciones |
| ui | stores/ui.js | Sidebar open/close |

## Vistas y rutas

| Ruta | Vista | Descripción |
|------|-------|-------------|
| `/` | OpportunitiesView | Listado general, agrupado por tipo |
| `/my-list` | MyListView | Lista personal con filtros estado/relevancia |
| `/org-list` | OrgListView | Lista de org con filtros estado/relevancia |
| `/pending` | PendingView | Pendientes (admin/member) |
| `/admin` | AdminView | Tabs: Usuarios, Invitaciones, Organizaciones, Importar |
| `/guide` | GuideView | Guía de uso + tutorial |
| `/invite/:token` | AcceptInviteView | Registro por invitación |

## Funcionalidades implementadas

- Listado general agrupado por tipo (Convocatorias → Grants → Fuentes → Capacitaciones → Redes)
- Filtros: tipo, estado, relevancia, búsqueda, etiqueta clickeable
- Skeleton loading, empty states, contador de resultados
- Seguimiento personal (Mi Lista) con estado, relevancia personal, nota privada
- Seguimiento de org (Lista de org) con estado, relevancia de org
- Notas de equipo — org-scoped en `org_follows/{id}/notes` (solo usuarios con orgId)
- Botón "Notas" en tarjeta con contador; botón "+ Org" para org follow
- Gestión de organizaciones en Admin (crear, editar, activar/desactivar, eliminar)
- Invitaciones con orgId opcional — usuario queda asignado a la org al registrarse
- Asignación de org a usuario desde tabla de Admin
- Importación masiva JSON
- Onboarding (WelcomeModal) — role-aware, org-aware, 4-5 pasos
- Guía de uso actualizada con nuevo modelo individual/org/admin
- Favicons, tema claro/oscuro, sidebar responsive

## Pendientes conocidos

1. **`noteShared`** — el checkbox "Compartir nota con el equipo" se guarda pero no hay lógica que lo consuma. Decidir si se elimina o se implementa.
2. **Migración de roles** — usuarios existentes con `member`/`guest` funcionan pero idealmente se migran a `admin`/`user`. Agregar botón de migración en Admin o hacerlo manual en Firestore.
3. **`notesCount` para notas existentes** — campo no existe en documentos antiguos. Agregar botón "Sincronizar contadores" en Admin.
4. **Página de pendientes** — revisar si sigue funcionando bien con el nuevo modelo (debería, `isMember` cubre admin+member).
5. **Filtro de relevancia en listado general** — actualmente filtra por `fit` (global del admin). Considerar si también filtrar por relevancia personal del usuario cuando está en "Todas".
6. **Vista de org en Mi Lista** — actualmente Mi Lista y Lista de Org son separadas. Podría unificarse con tabs.
7. **Conteo de seguidores por oportunidad** — no implementado. Podría ser útil mostrar cuántos usuarios/orgs siguen una oportunidad.

## Archivos clave

- `src/main.js` — auth init ANTES de `app.use(router)` (crítico para no redirigir al login en refresh)
- `firestore.rules` — reglas completas incluyendo org_follows
- `src/components/layout/AppShell.vue` — suscripciones a todos los stores
- `src/components/opportunities/OpportunityCard.vue` — tarjeta principal con todos los paneles
- `src/components/opportunities/OpportunityNotes.vue` — notas org-scoped
