# Monitor de Oportunidades — seguridades.org
## Especificación técnica del proyecto

---

## Visión general

Web app privada para el equipo de seguridades.org (y orgas aliadas invitadas) para centralizar, trackear y colaborar sobre convocatorias de financiamiento y consultoría relevantes al trabajo de seguridad digital con sociedad civil en América Latina.

---

## Stack técnico

- **Frontend**: Vue.js 3 + Vite
- **Estilos**: Tailwind CSS v4
- **Backend / Auth / DB**: Firebase (Firestore + Firebase Auth + Firebase Storage)
- **Hosting**: Firebase Hosting
- **Estado global**: Pinia
- **Router**: Vue Router 4
- **Notificaciones**: Vue Toastification (o similar)
- **Íconos**: Lucide Vue
- **Tema**: Modo oscuro y claro (Tailwind dark mode con `class` strategy, toggle manual + preferencia del sistema)

---

## Roles y permisos

### Roles definidos

| Rol | Descripción |
|-----|-------------|
| `admin` | Equipo core de seguridades.org. Control total. |
| `member` | Equipo interno con permisos completos sobre convocatorias. |
| `guest` | Usuario externo (otra orga), invitado por email. |

### Matriz de permisos

| Acción | admin | member | guest |
|--------|-------|--------|-------|
| Ver todas las convocatorias aprobadas | ✅ | ✅ | ✅ |
| Ver convocatorias pendientes de aprobación | ✅ | ✅ | ❌ |
| Agregar convocatoria (publicada directamente) | ✅ | ✅ | ❌ |
| Agregar convocatoria (pendiente de aprobación) | ✅ | ✅ | ✅ |
| Aprobar/rechazar convocatorias de guests | ✅ | ✅ | ❌ |
| Editar cualquier convocatoria | ✅ | ✅ | ❌ |
| Editar sus propias convocatorias (pendientes) | ✅ | ✅ | ✅ |
| Eliminar convocatorias | ✅ | ❌ | ❌ |
| Destacar convocatorias | ✅ | ✅ | ❌ |
| Escribir notas internas | ✅ | ✅ | ❌ |
| Ver notas internas | ✅ | ✅ | ❌ |
| Cambiar estado de convocatoria | ✅ | ✅ | ❌ |
| Invitar usuarios | ✅ | ❌ | ❌ |
| Cambiar roles | ✅ | ❌ | ❌ |
| Ver panel de gestión de usuarios | ✅ | ❌ | ❌ |

---

## Modelo de datos (Firestore)

### Colección: `users`
```
users/{uid}
  email: string
  displayName: string
  role: 'admin' | 'member' | 'guest'
  org: string              // nombre de la organización
  invitedBy: uid | null
  createdAt: timestamp
  lastSeen: timestamp
  active: boolean
```

### Colección: `opportunities`

Campos comunes a todos los tipos:
```
opportunities/{id}
  // — Campos base (todos los tipos) —
  title: string
  description: string
  url: string
  type: 'fuente' | 'convocatoria' | 'grant' | 'capacitacion' | 'red'
  fit: 'Alto' | 'Bueno' | 'Selectivo'
  tags: string[]
  status: 'nueva' | 'en_revision' | 'aplicada' | 'descartada' | 'pendiente_aprobacion'
  featured: boolean
  addedBy: uid
  addedByOrg: string
  approvedBy: uid | null
  createdAt: timestamp
  updatedAt: timestamp

  // — Campos por tipo (presentes solo si aplican) —

  // type: 'fuente'
  freq: 'semanal' | 'mensual' | null

  // type: 'convocatoria'
  deadline: timestamp | null
  reminderDays: number | null
  monto: string | null              // texto libre: "USD 5,000–15,000"

  // type: 'grant'
  deadline: timestamp | null        // null si es fondo abierto/permanente
  monto: string | null
  quien_puede_aplicar: string | null  // texto libre: "ONGs registradas en AL"

  // type: 'capacitacion'
  fecha: timestamp | null
  modalidad: 'presencial' | 'virtual' | 'hibrida' | null
  dirigido_a: string | null         // texto libre: "Trainers técnicos"

  // type: 'red'
  como_unirse: string | null        // texto libre: "Solicitar membresía en el sitio"
```

> **Nota de implementación**: Firestore no requiere esquema rígido. Los campos opcionales simplemente no se guardan si no aplican. El formulario de creación/edición muestra los campos relevantes dinámicamente según el `type` seleccionado.

### Subcolección: `opportunities/{id}/notes`
```
notes/{id}
  content: string
  authorId: uid
  authorName: string
  createdAt: timestamp
  updatedAt: timestamp
```

### Colección: `user_follows`

ID del documento: `{userId}_{opportunityId}` (compuesto, evita duplicados sin queries extra)

```
user_follows/{userId_opportunityId}
  userId: uid
  opportunityId: string
  followedAt: timestamp
  personalStatus: 'siguiendo' | 'aplicando' | 'aplicada' | 'descartada' | null
  personalNote: string | null       // nota privada del usuario
  noteShared: boolean               // true = visible para admin/member
```

**Reglas de acceso:**
- Cada usuario solo puede leer/escribir sus propios documentos (`userId == request.auth.uid`)
- Admin/member pueden leer documentos donde `noteShared == true`
- El contador de seguidores por oportunidad no se expone en la UI

---

### Colección: `invitations`
```
invitations/{id}
  email: string
  role: 'member' | 'guest'
  invitedBy: uid
  token: string            // UUID único para el link de invitación
  used: boolean
  createdAt: timestamp
  expiresAt: timestamp     // 7 días
```

---

## Estructura del proyecto

```
src/
├── assets/
├── components/
│   ├── ui/                     // componentes base reutilizables
│   │   ├── AppBadge.vue
│   │   ├── AppButton.vue
│   │   ├── AppModal.vue
│   │   ├── AppTag.vue
│   │   └── ThemeToggle.vue
│   ├── opportunities/
│   │   ├── OpportunityCard.vue
│   │   ├── OpportunityForm.vue
│   │   ├── OpportunityNotes.vue
│   │   ├── OpportunityStatusBadge.vue
│   │   └── FeaturedBadge.vue
│   └── layout/
│       ├── AppSidebar.vue
│       ├── AppHeader.vue
│       └── AppShell.vue
├── views/
│   ├── auth/
│   │   ├── LoginView.vue
│   │   └── AcceptInviteView.vue
│   ├── OpportunitiesView.vue   // listado principal
│   ├── MyListView.vue           // lista personal de seguimiento
│   ├── PendingView.vue         // pendientes de aprobación (admin/member)
│   ├── AdminView.vue           // gestión de usuarios e invitaciones
│   └── NotFoundView.vue
├── stores/
│   ├── auth.js                 // usuario actual, rol, estado de auth
│   ├── opportunities.js        // CRUD + filtros + real-time listener
│   └── follows.js              // seguimiento personal del usuario
│   └── ui.js                   // tema, sidebar abierto/cerrado
├── composables/
│   ├── useOpportunities.js
│   ├── useAuth.js
│   └── useTheme.js
├── router/
│   └── index.js               // rutas con guards por rol
├── firebase/
│   ├── config.js              // inicialización Firebase
│   ├── auth.js                // helpers de autenticación
│   └── firestore.js           // helpers de Firestore
└── main.js
```

---

## Vistas y funcionalidades

### `/login`
- Login con Google (Firebase Auth, proveedor Google)
- Login con email/password (para usuarios invitados sin Google)
- Si el usuario no está en la colección `users` y no tiene invitación válida → mostrar error "Acceso restringido"
- Si viene de un link de invitación (`/invite/:token`) → completar registro y redirigir

### `/invite/:token`
- Validar token contra colección `invitations`
- Si válido y no usado → permitir completar registro (nombre, org, contraseña si aplica)
- Si inválido o expirado → mostrar error claro

### `/` — Listado principal (OpportunitiesView)

**Sidebar izquierdo:**
- Filtros por vista: Todas / Fuentes / Convocatorias / Destacadas / Mis agregadas
- Filtros por estado: Nueva / En revisión / Aplicada / Descartada
- Filtros por frecuencia: Semanal / Mensual / Única
- Contador por filtro

**Header de contenido:**
- Buscador (título, descripción, tags)
- Chips de fit: Alto / Bueno / Selectivo
- Botón "Agregar" (todos los roles)
- Botón "Pendientes de aprobación" con badge contador (admin/member)

**Cards de convocatorias:**
- Badge "⭐ Destacada" si `featured: true` — visual prominente
- Badge de estado con color semántico
- Badge de fit (Alto / Bueno / Selectivo)
- Deadline con countdown si es < 14 días ("faltan 5 días")
- Tags
- Link externo
- Notas internas (solo admin/member) — contador de notas como chip
- Botón **"+ Seguir"** en cada card (todos los roles) — agrega a Mi Lista
- Si ya sigue: botón cambia a **"Siguiendo ✓"** con opción de quitar
- Menú de acciones según rol:
  - Cambiar estado (global, admin/member)
  - Destacar/quitar destacado
  - Editar
  - Eliminar (solo admin)
  - Agregar nota interna (admin/member)

**Agrupación por defecto:** Destacadas primero, luego por fit (Alto → Bueno → Selectivo), dentro de cada grupo por deadline más próximo.

### `/my-list` — Mi Lista (todos los roles)

Vista personal de seguimiento. Accesible desde el sidebar o header para todos los usuarios.

**Listado:**
- Solo muestra oportunidades que el usuario sigue (`user_follows` donde `userId == currentUser`)
- Misma card que el listado general, pero con panel adicional de seguimiento personal

**Panel de seguimiento personal (dentro del card):**
- `personalStatus`: selector visual — Siguiendo / Aplicando / Aplicada / Descartada
- `personalNote`: textarea de nota privada
- Toggle **"Compartir nota con el equipo"** (`noteShared: true/false`)
  - Si `noteShared: true`: la nota es visible para admin/member en el listado general (aparece como chip "Nota de [nombre]")
  - Si `noteShared: false`: completamente privada
- Botón "Dejar de seguir" — elimina el documento de `user_follows`

**Para guests:** esta vista es especialmente relevante — es su espacio de trabajo personal dentro de un listado que no controlan.

**Para admin/member:** ven además las notas compartidas de otros usuarios en el listado general, identificadas con el nombre del autor.

---

### `/pending` — Pendientes de aprobación (admin/member only)

- Lista de convocatorias con `status: 'pendiente_aprobacion'`
- Info de quién la agregó y desde qué org
- Botones: Aprobar (publica como `status: 'nueva'`) / Rechazar (elimina o archiva)
- Vista compacta, enfocada en revisión rápida

### `/admin` — Panel de administración (admin only)

**Gestión de usuarios:**
- Tabla de usuarios activos con: nombre, email, org, rol, fecha de último acceso
- Cambiar rol de usuario
- Desactivar acceso
- Ver quién invitó a quién

**Invitaciones:**
- Form: email + rol (member/guest)
- Genera link de invitación único con token
- Copia el link al portapapeles
- Lista de invitaciones pendientes (no usadas) con opción de revocar
- Invitaciones expiradas o usadas en sección colapsable

---

## Comportamiento del card por tipo

El componente `OpportunityCard.vue` adapta su contenido según `type`:

### `fuente` — Fuente de monitoreo
- Badge: `FUENTE` en gris
- Muestra: frecuencia de revisión ("Revisar cada semana")
- No muestra deadline ni countdown
- Botón de acción: **"Revisar fuente"** → abre URL
- Status relevante: nueva / revisada (mapea a `en_revision`) / descartada

### `convocatoria` — Convocatoria directa
- Badge: `CONVOCATORIA` en verde/accent
- Muestra: deadline con countdown si < 14 días ("Faltan 5 días" en amber, < 3 días en rojo)
- Muestra: monto si está disponible
- Botón de acción: **"Ver convocatoria"** → abre URL
- Status relevante: todos

### `grant` — Grant o fondo
- Badge: `GRANT` en azul
- Muestra: monto prominente, quién puede aplicar
- Deadline puede ser null (fondo permanente) → muestra "Fondo abierto"
- Botón de acción: **"Ver grant"** → abre URL
- Status relevante: todos

### `capacitacion` — Capacitación o taller
- Badge: `CAPACITACIÓN` en purple/amber
- Muestra: fecha, modalidad (presencial / virtual / híbrida), a quién va dirigida
- Countdown hacia la fecha del evento
- Botón de acción: **"Registrarse"** → abre URL
- Status: adaptar etiquetas → "nueva" / "registrada" / "descartada"

### `red` — Red o membresía
- Badge: `RED` en teal
- Muestra: cómo unirse
- Sin deadline ni countdown
- Botón de acción: **"Conectar"** → abre URL
- Status: nueva / contactada / descartada

### Formulario dinámico (`OpportunityForm.vue`)
Al seleccionar `type`, el formulario muestra/oculta campos:
```
Siempre: title, description, url, fit, tags, featured
+ fuente: freq
+ convocatoria: deadline, reminderDays, monto
+ grant: deadline (opcional), monto, quien_puede_aplicar
+ capacitacion: fecha, modalidad, dirigido_a
+ red: como_unirse
```

---

## Funcionalidades clave

### Sistema de invitaciones
1. Admin genera invitación → se crea documento en `invitations` con token UUID y expiración de 7 días
2. Admin copia el link: `https://app.seguridades.org/invite/{token}`
3. Usuario abre el link → ve pantalla de aceptar invitación
4. Completa nombre + org + (contraseña si no usa Google)
5. Se crea su cuenta en Firebase Auth + documento en `users`
6. Se marca la invitación como `used: true`

### Real-time updates
- Usar `onSnapshot` de Firestore para que el listado se actualice en tiempo real cuando alguien agrega o modifica una convocatoria
- Badge de "pendientes" en el header también en tiempo real

### Tema oscuro/claro
- Toggle manual en el header
- Persistir preferencia en `localStorage`
- Respetar `prefers-color-scheme` del sistema si no hay preferencia guardada
- Usar Tailwind `darkMode: 'class'` en `tailwind.config.js`
- Aplicar clase `dark` al `<html>` desde el store de UI

### Recordatorios de deadline
- Al crear/editar una convocatoria con deadline, opción de `reminderDays` (ej: 7, 14, 30)
- En el listado, mostrar un chip visual de countdown si `deadline - now < reminderDays`
- **V1**: solo visual en la app (sin emails/push)
- **V2 (futuro)**: Firebase Functions para emails automáticos

### Badge destacada
- Solo admin/member pueden marcar como destacada
- Las destacadas aparecen primero en el listado con un badge visual prominente (estrella + borde o fondo diferenciado)
- El badge debe ser inmediatamente reconocible en el card

---

## Paleta de colores y tema

### Modo oscuro (default preferido)
```css
--bg-base: #0f0f0f
--bg-surface: #181818
--bg-surface-2: #222222
--border: #2a2a2a
--text-primary: #e8e6e0
--text-muted: #888888
--accent: #00c896        /* verde — acción principal */
--amber: #f0a030         /* deadlines próximos */
--danger: #e05555        /* descartada / eliminar */
--blue: #4a9eff          /* fit bueno */
```

### Modo claro
```css
--bg-base: #f8f8f6
--bg-surface: #ffffff
--bg-surface-2: #f1f0eb
--border: #e0dfd8
--text-primary: #1a1a1a
--text-muted: #666666
--accent: #00a076
--amber: #c47d00
--danger: #c0392b
--blue: #2563eb
```

### Badges de estado
| Estado | Dark | Light |
|--------|------|-------|
| nueva | verde dim | verde claro |
| en_revision | amber dim | amber claro |
| aplicada | azul dim | azul claro |
| descartada | gris | gris |
| pendiente_aprobacion | coral dim | coral claro |

### Badge destacada
- Ícono ⭐ o similar
- Borde izquierdo de 3px en color accent
- Fondo ligeramente diferenciado del card normal

---

## Fuentes iniciales a sembrar (seed data)

Al hacer deploy inicial, ejecutar script que pobla Firestore con las siguientes entradas:

| # | Nombre | URL | Tipo | Fit | Freq/Nota |
|---|--------|-----|------|-----|-----------|
| 1 | Digital Defenders Partnership | digitaldefenders.org | `fuente` | Alto | semanal |
| 2 | Internews Tech & Society | internews.org/technology | `fuente` | Alto | semanal |
| 3 | Access Now Jobs & RFPs | accessnow.org/help/#jobs | `fuente` | Alto | semanal |
| 4 | ARTICLE 19 convocatorias | article19.org/get-involved/jobs | `fuente` | Bueno | semanal |
| 5 | CIVICUS consultancies | civicus.org/consultancies | `fuente` | Selectivo | mensual |
| 6 | Frontline Defenders vacantes | frontlinedefenders.org/vacancies | `fuente` | Bueno | mensual |
| 7 | CPJ Jobs | cpj.org/about/jobs | `fuente` | Bueno | mensual |
| 8 | Derechos Digitales | derechosdigitales.org/trabaja-con-nosotros | `fuente` | Bueno | mensual |
| 9 | fundsforNGOs | fundsforngos.org | `fuente` | Bueno | semanal |
| 10 | Tinker Foundation | tinker.org/institutional-grants-apply-page | `grant` | Selectivo | nota: "LOI cerrado ene 2026, próximo ciclo 2027. Gobernanza democrática + educación en AL. Montos: USD 50k–150k/año hasta 3 años." |
| 11 | FAU-LAC — Apoyos de Respuesta Rápida | fsfr.net/fau-dev/apoyos | `grant` | Selectivo | nota: "Fondo para defensoras/orgs feministas en AL. No es para consultorías. Útil para recomendar a orgas clientes. Monto: hasta USD 10k, 365 días/año." |

---

## Reglas de seguridad Firestore (resumen)

```javascript
// opportunities: lectura solo a usuarios autenticados y activos
// escritura directa solo a admin y member
// guests pueden crear con status 'pendiente_aprobacion'
// notas: solo admin y member pueden leer/escribir

// users: cada usuario puede leer su propio doc
// solo admin puede leer todos y cambiar roles

// invitations: solo admin puede crear
// cualquier usuario autenticado puede leer por token (para validar invitación)
```

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

## Orden de implementación sugerido

1. **Setup inicial**: Vite + Vue 3 + Tailwind + Firebase config + Pinia + Router
2. **Auth**: Login Google + email/password + guard de rutas + store de auth
3. **Sistema de invitaciones**: colección, generación de token, vista `/invite/:token`
4. **CRUD de oportunidades**: Firestore + store + real-time listener
5. **Vista principal**: listado con filtros, búsqueda, agrupación
6. **Cards**: todos los badges, acciones por rol, deadline countdown
7. **Notas internas**: subcolección + UI en card
8. **Vista de pendientes**: aprobación/rechazo
9. **Panel admin**: gestión usuarios + invitaciones
10. **Tema**: dark/light toggle + persistencia
11. **Seed data**: script para poblar fuentes iniciales
12. **Deploy**: Firebase Hosting + reglas de Firestore

---

## Notas de desarrollo

- Usar Composition API con `<script setup>` en todos los componentes
- Tipar con JSDoc donde sea útil (sin TypeScript por ahora para velocidad)
- Los guards de ruta deben verificar tanto autenticación como rol desde el store
- El store de auth debe tener un estado `loading` inicial para evitar flashes de login en rutas protegidas
- Firestore listeners deben desuscribirse en `onUnmounted` para evitar memory leaks
- Para invitaciones: generar el token en el cliente con `crypto.randomUUID()` — no necesita ser server-side para V1

---

## Identidad visual

### Logo
- Archivo: `logo_seguridades_logo.svg` — copiar a `src/assets/logo.svg`
- Formato: wordmark horizontal, paths SVG (sin fuente embebida)
- Dos colores:
  - "seguridades" → cyan `#11C1E1` (rgb 17,193,225)
  - ".org" → magenta `#D15892` (rgb 209,88,146)

### Uso del logo en la app
- **Sidebar / header**: logo completo en modo oscuro (sobre fondo oscuro funciona bien el cyan)
- **Modo claro**: el logo funciona igual, ambos colores tienen suficiente contraste
- **Favicon**: usar solo el "s" inicial o un ícono derivado — no reducir el wordmark completo a 32px
- **Login screen**: logo centrado, tamaño grande, como elemento principal de la pantalla

### Tokens de color derivados del logo
```css
--color-brand-cyan: #11C1E1;    /* accent principal, botones, links activos */
--color-brand-magenta: #D15892; /* accent secundario, badges especiales, destacados */
```

> Reemplaza el `--accent: #00c896` definido anteriormente. El verde era placeholder — el cyan del logo es el color de marca real. El magenta puede usarse para el badge "Destacada" en lugar de amarillo/estrella, dándole identidad de marca.
