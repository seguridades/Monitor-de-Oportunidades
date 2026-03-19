# Monitor de Oportunidades — seguridades.org
## Especificación técnica del proyecto

> **Estado**: Piloto listo para testeo (marzo 2026). El spec refleja lo implementado, no la visión original.

---

## Visión general

Web app privada para el equipo de seguridades.org y organizaciones aliadas invitadas. Centraliza convocatorias de financiamiento, grants, fuentes, capacitaciones y redes relevantes para el trabajo de seguridad integral con sociedad civil en América Latina. Acceso por invitación, con roles diferenciados.

---

## Stack técnico

- **Frontend**: Vue.js 3 (Composition API + `<script setup>`) + Vite
- **Estilos**: Tailwind CSS v4
- **Backend / Auth / DB**: Firebase (Firestore + Firebase Auth)
- **Hosting**: Firebase Hosting
- **Estado global**: Pinia
- **Router**: Vue Router 4
- **Toasts**: vue-sonner
- **Íconos**: lucide-vue-next
- **Tema**: Modo oscuro y claro (Tailwind `darkMode: 'class'`, toggle manual + preferencia del sistema)

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
| Sugerir oportunidades | ✅ (queda pendiente) | ✅ (aprobada directamente) | ✅ (aprobada directamente) |
| Aprobar / rechazar sugerencias | ❌ | ✅ | ✅ |
| Agregar / editar oportunidades | ❌ | ✅ | ✅ |
| Eliminar oportunidades | ❌ | ✅ | ✅ |
| Gestionar usuarios e invitaciones | ❌ | ❌ | ✅ |
| Importar en lote | ❌ | ❌ | ✅ |

### Helpers de rol en el store de auth

```js
canEdit   = isAdmin || isModerador   // gestión de contenido
canApprove = canEdit                  // sinónimo semántico para aprobación
```

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
  type: 'fuente' | 'convocatoria' | 'grant' | 'capacitacion' | 'red'
  tags: string[]
  status: 'nueva' | 'en_revision' | 'aplicada' | 'descartada' | 'pendiente_aprobacion'
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
  reminderDays: number           // almacenado, aún sin lógica de disparo
  monto: string | null

  // type: 'grant'
  deadline: timestamp | null     // null = fondo abierto/permanente
  monto: string | null
  quien_puede_aplicar: string | null

  // type: 'capacitacion'
  fecha: timestamp | null
  modalidad: 'presencial' | 'virtual' | 'hibrida' | null
  dirigido_a: string | null

  // type: 'red'
  como_unirse: string | null
```

> Los campos opcionales simplemente no se guardan si no aplican. No hay `featured` global ni campo `fit`.

### Colección: `user_follows`

ID del documento: `{userId}_{opportunityId}` (compuesto, evita duplicados)

```
user_follows/{userId_opportunityId}
  userId: uid
  opportunityId: string
  followedAt: timestamp
  personalStatus: 'nueva' | 'siguiendo' | 'aplicando' | 'aplicada' | 'descartada'
  notes: [                          // array de notas privadas con timestamp
    {
      id: string (UUID)
      text: string
      createdAt: ISO string
    }
  ]
  starred: boolean                  // destacado personal
```

**Reglas de acceso:** cada usuario solo puede leer/escribir sus propios documentos. Nadie más accede desde la app — aunque los datos se guardan en texto plano en Firestore.

### Colección: `notifications`

```
notifications/{id}
  userId: uid
  type: 'pending' | 'approved' | 'rejected'
  opportunityTitle: string
  read: boolean
  createdAt: timestamp
```

- `pending`: creada cuando un invitado propone una oportunidad
- `approved` / `rejected`: creada cuando admin/moderador resuelve una propuesta

### Colección: `invitations`

> **Importante**: el documento se guarda con el token como ID (`setDoc(doc(db, 'invitations', token), ...)`), lo que permite validar por `getDoc` sin necesitar un `query` en lista abierta.

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
│   │   ├── SkeletonCard.vue
│   │   └── ThemeToggle.vue
│   ├── opportunities/
│   │   ├── OpportunityCard.vue
│   │   ├── OpportunityForm.vue
│   │   └── OpportunityStatusBadge.vue
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
│   ├── OpportunitiesView.vue   // listado principal con filtros y agrupación por tipo
│   ├── MyListView.vue          // lista personal de seguimiento
│   ├── PendingView.vue         // pendientes de aprobación (moderador/admin)
│   ├── AdminView.vue           // usuarios, invitaciones, importación en lote
│   ├── GuideView.vue           // guía de uso + tutorial
│   └── NotFoundView.vue
├── stores/
│   ├── auth.js                 // usuario actual, rol, estado de auth
│   ├── opportunities.js        // CRUD + filtros + real-time listener
│   ├── follows.js              // seguimiento personal (notas, estado, starred)
│   ├── notifications.js        // notificaciones in-app
│   └── ui.js                   // tema oscuro/claro
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
- Si el usuario no está activo → error "Acceso restringido"
- Si viene de link de invitación → completar registro

### `/invite/:token`
- Valida token con `getDoc(doc(db, 'invitations', token))`
- Si válido y no usado → formulario de registro (nombre, org, contraseña)
- Si inválido, usado o expirado → error claro

### `/` — Listado principal

**Sidebar izquierdo (filtros):**
- Vista por tipo: Todas / Fuentes / Convocatorias / Grants / Capacitaciones / Redes (con contadores)
- Estado: checkboxes múltiples (Nueva / En revisión / Aplicada / Descartada)
- Toggle "Ocultar las que sigo"

**Header de contenido:**
- Buscador (título, descripción, tags)
- Pill activo de tag seleccionado con botón de limpiar
- Link a Pendientes con badge contador (solo moderador/admin, cuando hay pendientes)
- Botón "Agregar" (admin/moderador) o "Proponer" (invitado)

**Listado:**
- Agrupado por tipo cuando no hay filtro activo de tipo: Convocatorias → Grants → Fuentes → Capacitaciones → Redes
- Lista plana cuando hay filtro de tipo activo
- Ordenado por deadline ascendente (null al final)
- Skeleton cards durante carga

### `/my-list` — Mi Lista

**Header sticky:**
- Buscador
- Select de tipo, select de estado personal, toggle "★ Solo destacadas"

**Listado:**
- Agrupado por tipo (mismo orden que listado principal)
- Cards con `showFollowPanel: true` — activa el menú y panel de Mi Lista

**Panel de seguimiento por card (menú ⋮):**
- Mi estado personal: Nueva / Siguiendo / Aplicando / Aplicada / Descartada
- Destacar / quitar destacado (personal, solo visible en Mi Lista)
- Dejar de seguir

**Panel de notas (botón "Notas (N)"):**
- Lista de notas en orden inverso con texto y fecha/hora
- Ícono de papelera al hacer hover para eliminar nota
- Textarea + botón para agregar nota nueva (Ctrl/⌘+Enter)
- Aviso de privacidad: datos en texto plano en DB

### `/pending` — Pendientes de aprobación (moderador/admin)

- Lista de oportunidades con `status: 'pendiente_aprobacion'`
- Muestra toda la info: tipo, título, descripción, campos por tipo, tags, URL, quien propuso y fecha
- Botón "Editar antes de aprobar" → abre OpportunityForm en modal
- Aprobar → publica con `status: 'nueva'` y notifica al proponente
- Rechazar → AppConfirm → elimina y notifica al proponente

### `/admin` — Administración (solo admin)

**Tab Usuarios:**
- Tabla: nombre, email, rol (select editable), último acceso, toggle activo/inactivo
- El admin no puede cambiar su propio rol

**Tab Invitaciones:**
- Form: email + rol (moderador/invitado) → genera link `{origin}/invite/{token}`
- Copiar link al portapapeles
- Lista de invitaciones pendientes con opción de revocar (AppConfirm)

**Tab Importar:**
- Textarea para JSON en lote
- Validación campo por campo con mensajes de error claros
- Vista previa antes de confirmar
- Importa con `status: 'nueva'`, sin `featured`
- Formato: ver `/oportunidades-ejemplo.json`

### `/guide` — Guía de uso

- Descripción de secciones, tipos de oportunidades, flujo personal de estados
- Tabla de roles y permisos
- Botón "Ver tutorial" que relanza el WelcomeModal

---

## OpportunityCard — comportamiento por tipo

El componente adapta su contenido según `type`:

| Tipo | Badge | Info específica | Botón externo |
|------|-------|-----------------|---------------|
| `fuente` | gris | Frecuencia de revisión | Ver fuente |
| `convocatoria` | cyan | Monto + deadline con countdown | Ver convocatoria |
| `grant` | azul | Monto + quién puede aplicar + deadline (o "Fondo abierto") | Ver grant |
| `capacitacion` | violeta | Fecha + modalidad + dirigido a | Registrarse |
| `red` | teal | Cómo unirse | Conectar |

**Deadline urgency:**
- Vencida: tachado, texto muted
- ≤ 3 días: rojo, negrita, `¡Nd!`
- ≤ 14 días: amber, medium
- \> 14 días: muted

**Menú ⋮:**
- Visible para: `canEdit` en listado general; todos en Mi Lista
- Listado general (canEdit): Editar + Eliminar
- Mi Lista (todos): Mi estado + Destacar + Dejar de seguir

---

## OpportunityForm — campos dinámicos

```
Siempre:    title*, type*, description, url, tags
fuente:     + freq (semanal|mensual)
convocatoria: + deadline, reminderDays, monto
grant:      + deadline (opcional), monto, quien_puede_aplicar
capacitacion: + fecha, modalidad (virtual|presencial|hibrida), dirigido_a
red:        + como_unirse
```

Sin campo `featured`. Sin campo `fit`. Sin campo `relevancia`.

---

## Sistema de notificaciones in-app

1. Invitado propone → notificación `pending` para el proponente ("Tu propuesta está pendiente")
2. Moderador/admin aprueba → notificación `approved` para el proponente
3. Moderador/admin rechaza → notificación `rejected` para el proponente

Bell en el header con badge de no leídas. Al abrir el panel → todas se marcan como leídas.

---

## Flujo de invitaciones

1. Admin genera invitación → `setDoc(doc(db, 'invitations', token), {...})` — el token UUID es el ID del documento
2. Admin copia el link: `{origin}/invite/{token}`
3. Usuario abre el link → `getDoc(doc(db, 'invitations', token))` para validar
4. Si válido y no usado y no expirado → formulario de registro
5. Al completar: crea cuenta en Firebase Auth + doc en `users` + marca `used: true`

---

## Reglas de seguridad Firestore (resumen)

```
opportunities:  lectura a usuarios activos (no pendientes para invitados)
                escritura directa a canEdit; invitados crean con pendiente_aprobacion
                actualización de propias pendientes para invitados

user_follows:   solo el propio usuario (userId == auth.uid)

users:          cada usuario lee/actualiza su propio doc (solo lastSeen, displayName, org)
                admin puede leer todos y cambiar cualquier campo

notifications:  cada usuario lee/actualiza las suyas
                canEdit puede crear para cualquier userId

invitations:    admin crea y elimina
                allow get: if true (validación de token sin autenticar)
                allow list: if isAdmin() (no listado público)
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
--amber: #f0a030         /* deadlines próximos */
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

### Badges de estado
| Estado | Significado |
|--------|-------------|
| `nueva` | verde dim |
| `en_revision` | amber dim |
| `aplicada` | azul dim |
| `descartada` | gris |
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
```

---

## Identidad visual

### Logo
- Archivo: `src/assets/logo.svg`
- Wordmark horizontal, paths SVG
- "seguridades" → cyan `#11C1E1`
- ".org" → magenta `#D15892`

### Uso del logo
- Sidebar: logo completo (funciona en oscuro y claro)
- Login: centrado, tamaño grande
- Favicon: ícono derivado (no reducir wordmark a 32px)

---

## Notas de implementación

- Composition API con `<script setup>` en todos los componentes
- Guards de ruta verifican autenticación y rol desde el store
- El store de auth tiene estado `loading` inicial para evitar flashes en rutas protegidas
- `onSnapshot` listeners se desuscriben en `onUnmounted` (gestionado desde AppShell)
- Tokens de invitación generados en cliente con `crypto.randomUUID()`
- IDs de notas personales generados con `crypto.randomUUID()`
- localStorage key para onboarding: `monitor_oportunidades_onboarding`
- El campo `reminderDays` se guarda pero aún no dispara notificaciones (pendiente Cloud Functions)
