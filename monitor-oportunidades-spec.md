# Monitor de Oportunidades — seguridades.org
## Especificación técnica del proyecto

> **Estado**: v0.5.2 — piloto activo (marzo 2026). Este spec refleja lo implementado.

---

## Visión general

Web app privada para el equipo de seguridades.org y organizaciones aliadas invitadas. Centraliza convocatorias de financiamiento, grants, fuentes, capacitaciones, eventos, redes y líneas de ayuda relevantes para organizaciones de la sociedad civil en América Latina — no limitada a seguridad digital, sino abierta a distintos ámbitos de seguridad (ambiental, comunitaria, jurídica, etc.). Acceso por invitación, con roles diferenciados.

---

## Stack técnico

- **Frontend**: Vue.js 3 (Composition API + `<script setup>`) + Vite
- **Estilos**: Tailwind CSS v4
- **Backend / Auth / DB**: Firebase (Firestore + Firebase Auth) — plan Spark
- **Hosting**: Firebase Hosting
- **Estado global**: Pinia
- **Router**: Vue Router 4
- **Toasts**: vue-sonner
- **Íconos**: lucide-vue-next
- **Tema**: Modo oscuro y claro (toggle manual + preferencia del sistema)

---

## Roles y permisos

### Roles definidos

| Rol | Descripción |
|-----|-------------|
| `admin` | Control total: contenido + usuarios + importación. |
| `moderador` | Gestión de contenido: aprobar, agregar, editar, eliminar. Sin acceso a usuarios ni importación. |
| `invitado` | Proponer oportunidades + ver catálogo + Mi Lista personal. |

### Matriz de permisos

| Acción | invitado | moderador | admin |
|--------|----------|-----------|-------|
| Ver listado global | ✅ | ✅ | ✅ |
| Mi Lista (notas, estado, destacar) | ✅ | ✅ | ✅ |
| Exportar Mi Lista a CSV | ✅ | ✅ | ✅ |
| Exportar deadlines a calendario | ✅ | ✅ | ✅ |
| Copiar URL de oportunidad | ✅ | ✅ | ✅ |
| Reportar oportunidad | ✅ | ✅ | ✅ |
| Sugerir oportunidades | ✅ (queda pendiente) | ✅ (aprobada directamente) | ✅ (aprobada directamente) |
| Aprobar / rechazar sugerencias | ❌ | ✅ | ✅ |
| Agregar / editar oportunidades | ❌ | ✅ | ✅ |
| Eliminar oportunidades | ❌ | ✅ | ✅ |
| Ver y gestionar reportes | ❌ | ✅ | ✅ |
| Gestionar usuarios e invitaciones | ❌ | ❌ | ✅ |
| Importar en lote | ❌ | ❌ | ✅ |

### Helpers de rol en el store de auth

```js
canEdit    = isAdmin || isModerador   // gestión de contenido
canApprove = canEdit                  // sinónimo semántico para aprobación
```

---

## Tipos de oportunidad

| Tipo | Label | Descripción |
|------|-------|-------------|
| `fuente` | Fuentes | Fuentes de información periódicas a monitorear |
| `convocatoria` | Convocatorias | Llamados con fecha límite de aplicación |
| `grant` | Grants | Fondos de financiamiento (abiertos o con deadline) |
| `capacitacion` | Capacitaciones | Cursos, talleres, programas de formación |
| `evento` | Eventos / Actividades | Conferencias, cumbres, encuentros |
| `red` | Redes | Comunidades, coaliciones, redes de trabajo |
| `linea_ayuda` | Líneas de Ayuda | Helplines, soporte urgente, asistencia técnica |
| `beca` | Becas / Fellowships | Becas, fellowships, residencias, programas de fellows |

---

## Modelo de datos (Firestore)

### Colección: `users`

```
users/{uid}
  email: string
  displayName: string
  role: 'admin' | 'moderador' | 'invitado'
  org: string | null
  invitedBy: uid | null
  createdAt: timestamp
  lastSeen: timestamp
  active: boolean
```

### Colección: `opportunities`

```
opportunities/{id}
  // — Campos base (todos los tipos) —
  title: string
  description: string
  url: string
  type: 'fuente' | 'convocatoria' | 'grant' | 'capacitacion' | 'evento' | 'red' | 'linea_ayuda' | 'beca'
  tags: string[]
  status: 'nueva' | 'en_revision' | 'aplicada' | 'descartada' | 'archivada' | 'pendiente_aprobacion'
  addedBy: uid
  addedByName: string | null
  approvedBy: uid | null
  createdAt: timestamp
  updatedAt: timestamp

  // — Campos por tipo (presentes solo si aplican) —

  // type: 'fuente'
  freq: 'semanal' | 'mensual'

  // type: 'convocatoria'
  deadline: timestamp | null
  reminderDays: number           // almacenado; lógica de disparo pendiente de implementar
  monto: string | null

  // type: 'grant'
  deadline: timestamp | null     // null = fondo abierto/permanente
  monto: string | null
  quien_puede_aplicar: string | null

  // type: 'capacitacion'
  fecha: timestamp | null
  modalidad: 'presencial' | 'virtual' | 'hibrida' | null
  dirigido_a: string | null

  // type: 'evento'
  fecha: timestamp | null
  modalidad: 'presencial' | 'virtual' | 'hibrida' | null
  lugar: string | null

  // type: 'red'
  como_unirse: string | null

  // type: 'linea_ayuda'
  disponibilidad: string | null  // ej. "24/7", "lunes a viernes"
  como_contactar: string | null

  // type: 'beca'
  deadline: timestamp | null
  reminderDays: number | null
  monto: string | null           // estipendio o monto de la beca
  duracion: string | null        // ej. "6 meses", "1 año"
  quien_puede_aplicar: string | null
```

> Los campos opcionales simplemente no se guardan si no aplican.

### Colección: `user_follows`

ID del documento: `{userId}_{opportunityId}` (compuesto, evita duplicados)

```
user_follows/{userId_opportunityId}
  userId: uid
  opportunityId: string
  followedAt: timestamp
  personalStatus: 'nueva' | 'siguiendo' | 'aplicando' | 'aplicada' | 'descartada'
  notes: [
    {
      id: string (UUID)
      text: string
      createdAt: ISO string
    }
  ]
  starred: boolean
```

**Reglas de acceso:** cada usuario solo puede leer/escribir sus propios documentos. Datos en texto plano en Firestore.

### Colección: `notifications`

```
notifications/{id}
  userId: uid
  type: 'pending' | 'approved' | 'rejected' | 'deadline_reminder'
  opportunityTitle: string
  read: boolean
  createdAt: timestamp
```

- `pending`: cuando un invitado propone una oportunidad
- `approved` / `rejected`: cuando admin/moderador resuelve una propuesta
- `deadline_reminder`: recordatorio de deadline (pendiente de implementar la lógica de disparo)

### Colección: `reports`

```
reports/{id}
  opportunityId: string
  opportunityTitle: string
  reason: 'link_roto' | 'info_desactualizada' | 'duplicado' | 'otro'
  comment: string | null
  reportedBy: uid
  reportedByName: string | null
  status: 'pendiente' | 'resuelto'
  createdAt: timestamp
  resolvedAt: timestamp | null
  resolvedBy: uid | null
```

### Colección: `invitations`

> El token UUID es el ID del documento (`setDoc(doc(db, 'invitations', token), ...)`), lo que permite validar con `getDoc` sin necesitar `query` en lista abierta.

```
invitations/{token}
  email: string
  role: 'moderador' | 'invitado'
  invitedBy: uid
  token: string (UUID — coincide con el ID del documento)
  used: boolean
  createdAt: timestamp
  expiresAt: timestamp     // 7 días
```

---

## Estructura del proyecto

```
src/
├── assets/
│   └── logo.svg
├── components/
│   ├── ui/
│   │   ├── AppModal.vue
│   │   ├── AppTag.vue
│   │   ├── AppConfirm.vue
│   │   ├── AppButton.vue
│   │   ├── SkeletonCard.vue
│   │   └── ThemeToggle.vue
│   ├── opportunities/
│   │   ├── OpportunityCard.vue
│   │   ├── OpportunityForm.vue
│   │   ├── StatusBadge.vue
│   │   └── Notes.vue
│   ├── layout/
│   │   ├── AppSidebar.vue
│   │   ├── AppHeader.vue
│   │   └── AppShell.vue
│   └── onboarding/
│       └── WelcomeModal.vue
├── views/
│   ├── auth/
│   │   ├── LoginView.vue
│   │   └── AcceptInviteView.vue
│   ├── OpportunitiesView.vue   // listado principal con filtros, agrupación y ordenamiento
│   ├── MyListView.vue          // lista personal: seguimiento, notas, CSV, calendario
│   ├── PendingView.vue         // pendientes de aprobación (moderador/admin)
│   ├── ReportsView.vue         // reportes de usuarios (moderador/admin)
│   ├── AdminView.vue           // usuarios, invitaciones, importación en lote
│   ├── GuideView.vue           // guía de uso + botón para relanzar tutorial
│   └── NotFoundView.vue
├── stores/
│   ├── auth.js                 // usuario actual, rol, estado de auth
│   ├── opportunities.js        // CRUD + filtros + real-time listener
│   ├── follows.js              // seguimiento personal (notas, estado, starred)
│   ├── notifications.js        // notificaciones in-app
│   ├── reports.js              // reportes de oportunidades
│   └── ui.js                   // tema oscuro/claro, sidebar
├── router/
│   └── index.js               // rutas con guards por rol
├── firebase/
│   ├── config.js
│   └── auth.js
└── main.js
```

---

## Vistas

### `/login`
- Login con email/password
- Contador de oportunidades aprobadas por tipo (chips) visible sin autenticar
- Si el usuario no está activo → error "Acceso restringido"

### `/invite/:token`
- Valida token con `getDoc(doc(db, 'invitations', token))`
- Si válido y no usado → formulario de registro (nombre, org, contraseña)
- Si inválido, usado o expirado → error claro
- Al completar: crea cuenta en Firebase Auth + doc en `users` + marca `used: true`

### `/` — Listado principal

**Sidebar izquierdo (filtros):**
- Vista por tipo: Todas / Fuentes / Convocatorias / Grants / Capacitaciones / Eventos / Redes / Líneas de Ayuda / Becas (con contadores)
- Estado: checkboxes múltiples (Nueva / En revisión / Aplicada / Descartada)
- Toggle "Ocultar las que sigo"
- Botón "Limpiar" cuando hay filtros activos

**Header de contenido:**
- Buscador en tiempo real (título, descripción, URL, tags) con botón × para limpiar
- Selector de ordenamiento: Por deadline / Más recientes / Por título
- Pill del tag activo con botón de limpiar
- Link a Pendientes con badge contador (solo moderador/admin, cuando hay pendientes)
- Botón "Agregar" (admin/moderador) o "Proponer" (invitado)
- Botón "Limpiar" global cuando hay filtros activos

**Listado:**
- Agrupado por tipo cuando no hay filtro de tipo: Convocatorias → Grants → Fuentes → Capacitaciones → Eventos → Redes → Líneas de Ayuda → Becas
- Lista plana cuando hay filtro de tipo activo
- Ordenamiento configurable (default: deadline ascendente, null al final)
- Skeleton cards durante carga
- Sección "Archivadas" colapsable al final (solo canEdit)

### `/my-list` — Mi Lista

**Header sticky:**
- Buscador, select de tipo, select de estado personal, toggle "★ Solo destacadas"
- Botón "Exportar CSV" — descarga lista con título, tipo, estado, deadline, URL, nota más reciente
- Botón "Exportar a calendario" — exporta oportunidades con deadline a iCal (`.ics`) o abre en Google Calendar (solo convocatorias, grants y becas)

**Listado:**
- Agrupado por tipo (mismo orden que listado principal)
- Cards con panel de seguimiento expandido

**Panel de seguimiento por card (menú ⋮):**
- Mi estado personal: Nueva / Siguiendo / Aplicando / Aplicada / Descartada
- Destacar / quitar destacado
- Dejar de seguir

**Panel de notas:**
- Lista de notas en orden inverso con texto y fecha/hora
- Eliminar nota con ícono de papelera (hover)
- Textarea + botón agregar (Ctrl/⌘+Enter)
- Aviso: datos en texto plano en DB

### `/pending` — Pendientes de aprobación (moderador/admin)

- Lista de oportunidades con `status: 'pendiente_aprobacion'`
- Toda la info: tipo, título, descripción, campos por tipo, tags, URL, quién propuso y cuándo
- "Editar antes de aprobar" → OpportunityForm en modal
- Aprobar → `status: 'nueva'` + notifica al proponente
- Rechazar → AppConfirm → elimina + notifica al proponente
- "Revisar después" (snooze) → pospone sin rechazar

### `/reports` — Reportes (moderador/admin)

- Lista de reportes pendientes y resueltos
- Muestra: oportunidad afectada, motivo, comentario, quién reportó y cuándo
- Acciones directas: editar oportunidad, archivarla, eliminarla
- Marcar reporte como resuelto

### `/admin` — Administración (solo admin)

**Tab Usuarios:**
- Tabla: nombre, email, rol (select editable), último acceso, toggle activo/inactivo
- El admin no puede cambiar su propio rol

**Tab Invitaciones:**
- Form: email + rol → genera link `{origin}/invite/{token}`
- Copiar link al portapapeles
- Lista de invitaciones pendientes con opción de revocar

**Tab Importar:**
- Textarea para JSON en lote
- Validación campo por campo con mensajes de error
- Vista previa antes de confirmar
- Siempre importa con `status: 'pendiente_aprobacion'`
- Formato: ver `oportunidades-import-schema.md`

### `/guide` — Guía de uso

- Descripción de secciones y tipos de oportunidades
- Flujo personal de estados
- Tabla de roles y permisos
- Botón "Ver tutorial" que relanza el WelcomeModal

---

## OpportunityCard — comportamiento por tipo

| Tipo | Badge | Info específica | Botón externo |
|------|-------|-----------------|---------------|
| `fuente` | gris | Frecuencia de revisión | Ver fuente |
| `convocatoria` | cyan | Monto + deadline con countdown | Ver convocatoria |
| `grant` | azul | Monto + quién puede aplicar + deadline (o "Fondo abierto") | Ver grant |
| `capacitacion` | violeta | Fecha + modalidad + dirigido a | Registrarse |
| `evento` | naranja | Fecha + modalidad + lugar | Ver evento |
| `red` | teal | Cómo unirse | Conectar |
| `linea_ayuda` | rojo dim | Disponibilidad + cómo contactar | Contactar |
| `beca` | amarillo | Monto/estipendio + duración + quién puede aplicar + deadline | Ver beca |

**Deadline urgency:**
- Vencida: tachado, texto muted
- ≤ 3 días: rojo, negrita, `¡Nd!`
- ≤ 14 días: amber, medium
- \> 14 días: muted
- Deadline en pasado (aún no vencida en la vista) → borde amber + aviso

**Acciones en card:**
- Botón "Seguir" / "Siguiendo" — agrega/quita de Mi Lista
- Botón copiar URL — copia el enlace externo al portapapeles
- Botón reportar — abre formulario de reporte con motivo y comentario
- Menú ⋮ (canEdit): Editar + Archivar + Eliminar

---

## OpportunityForm — campos dinámicos

```
Siempre:      title*, type*, description, url, tags (chip-based con autocomplete de tags existentes)

fuente:       + freq (semanal | mensual)
convocatoria: + deadline, reminderDays, monto
grant:        + deadline (opcional), monto, quien_puede_aplicar
capacitacion: + fecha, modalidad (virtual | presencial | hibrida), dirigido_a
evento:       + fecha, modalidad (virtual | presencial | hibrida), lugar
red:          + como_unirse
linea_ayuda:  + disponibilidad, como_contactar
beca:         + deadline, reminderDays, monto, duracion, quien_puede_aplicar
```

---

## Sistema de notificaciones in-app

Campana en el header con badge de no leídas (contador real, sin límite).

**Tipos:**
- `pending` — cuando un invitado propone una oportunidad
- `approved` / `rejected` — cuando moderador/admin resuelve una propuesta
- `deadline_reminder` — recordatorio de deadline próximo (lógica pendiente)

**Acciones en panel:**
- Marcar todas como leídas
- Eliminar notificación individual
- Limpiar leídas (elimina en batch)

---

## AppShell — comportamientos globales

- Arranca todas las suscripciones de stores en `onMounted` (`opportunities`, `follows`, `notifications`, `reports` si canApprove)
- **Detección offline**: banner amber fijo en la parte superior cuando `navigator.onLine` es false
- **Cierre automático por inactividad**: timer de 30 minutos. A los 29 minutos muestra modal de aviso ("¿Seguís ahí?") con countdown de 60 segundos. Si no hay respuesta, ejecuta `auth.logout()`
- **Tutorial de bienvenida**: se muestra al primer login. Key localStorage: `monitor_oportunidades_onboarding`

---

## Flujo de invitaciones

1. Admin genera invitación → `setDoc(doc(db, 'invitations', token), {...})`
2. Admin copia el link: `{origin}/invite/{token}`
3. Usuario abre el link → `getDoc` para validar token
4. Si válido y no usado y no expirado → formulario de registro
5. Al completar: crea cuenta Firebase Auth + doc en `users` + marca `used: true`

---

## Reglas de seguridad Firestore (resumen)

```
opportunities:  lectura a usuarios activos (pendientes solo para canEdit)
                escritura directa a canEdit
                invitados crean con status pendiente_aprobacion

user_follows:   solo el propio usuario (userId == auth.uid)

users:          cada usuario lee/actualiza su propio doc (solo lastSeen, displayName, org)
                admin puede leer todos y modificar cualquier campo

notifications:  cada usuario lee/actualiza/elimina las suyas
                canEdit puede crear para cualquier userId

reports:        lectura a canEdit
                cualquier usuario autenticado puede crear
                canEdit puede actualizar y eliminar

invitations:    admin crea y elimina
                allow get: if true (validación de token sin autenticar)
                allow list: solo admin
                allow update: solo admin o cambiar únicamente el campo 'used'
```

---

## Paleta de colores y tema

### Modo oscuro (default preferido)
```css
--bg-base: #0f0f0f
--bg-surface: #181818
--bg-surface-2: #222222
--border-base: #2a2a2a
--text-primary: #e8e6e0
--text-muted: #888888
--accent: #00c896        /* verde — acción principal */
--amber: #f0a030         /* deadlines próximos, offline */
--danger: #e05555        /* descartada / eliminar */
```

### Modo claro
```css
--bg-base: #f8f8f6
--bg-surface: #ffffff
--bg-surface-2: #f1f0eb
--border-base: #e0dfd8
--text-primary: #1a1a1a
--text-muted: #666666
--accent: #00a076
--amber: #c47d00
--danger: #c0392b
```

### Badges de estado de oportunidad
| Estado | Color |
|--------|-------|
| `nueva` | verde dim |
| `en_revision` | amber dim |
| `aplicada` | azul dim |
| `descartada` | gris |
| `archivada` | gris oscuro |
| `pendiente_aprobacion` | coral/amber dim |

---

## Variables de entorno

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=   # opcional
```

---

## Identidad visual

### Logo
- Archivo: `src/assets/logo.svg`
- Wordmark horizontal, paths SVG
- "seguridades" → cyan `#11C1E1`
- ".org" → magenta `#D15892`

### Uso del logo
- Sidebar: logo completo
- Login: centrado, tamaño grande
- Favicon: ícono derivado (no reducir wordmark a 32px)

---

## Notas de implementación

- Composition API con `<script setup>` en todos los componentes
- Guards de ruta verifican autenticación y rol desde el store de auth
- El store de auth tiene estado `loading` para evitar flashes en rutas protegidas
- `onSnapshot` listeners se desuscriben en `onUnmounted` (gestionado desde AppShell)
- Tokens de invitación generados con `crypto.randomUUID()`
- IDs de notas personales generados con `crypto.randomUUID()`
- Dropdowns dentro de cards y modales usan `Teleport to="body"` para evitar clipping
- Importación masiva siempre crea con `status: 'pendiente_aprobacion'`
- El campo `reminderDays` se guarda pero aún no dispara notificaciones (implementación pendiente, requiere lógica client-side al abrir la app o Cloud Functions en plan Blaze)
- Ver `costo_operativo.md` para referencia de límites y costos de Firebase
