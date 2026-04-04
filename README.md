# Monitor de Oportunidades — seguridades.org

Plataforma web para centralizar y rastrear convocatorias de financiamiento, grants, capacitaciones, fuentes y redes relevantes para el trabajo de seguridad integral con sociedad civil en América Latina.

Desarrollado por [seguridades.org](https://seguridades.org).

---

## ¿Qué es esto?

Tiene un **listado público** accesible sin login y una capa privada (por invitación) con funciones avanzadas:

- Explorar un catálogo curado de oportunidades agrupadas por tipo
- Proponer nuevas oportunidades para revisión del equipo
- Llevar seguimiento personal en **Mi Lista**: estado, notas privadas, recordatorios de deadline y exportación a CSV
- Recibir notificaciones cuando sus propuestas son aprobadas o rechazadas, y recordatorios antes del vencimiento de deadlines

---

## Stack técnico

- **Frontend**: Vue.js 3 (Composition API + `<script setup>`) + Vite
- **Estilos**: Tailwind CSS v4
- **Backend / Auth / DB**: Firebase (Firestore + Auth + Hosting)
- **Estado global**: Pinia
- **Router**: Vue Router 4
- **Íconos**: lucide-vue-next
- **Toasts**: vue-sonner

> Usamos Firebase por razones de costo y mantenimiento. Este no es un proyecto con financiamiento dedicado. Somos fans de tecnologías descentralizadas y aspiramos a migrar a infraestructura más soberana si el proyecto crece.

---

## Roles

| Rol | Permisos |
|-----|----------|
| `admin` | Todo: contenido, usuarios, importación en lote |
| `moderador` | Aprobar, agregar, editar y eliminar oportunidades |
| `invitado` | Ver catálogo, proponer oportunidades, Mi Lista personal |

---

## Instalación local

**Requisitos**: Node.js 22.12+ o 25+. Si usas `nvm`, el proyecto incluye `.nvmrc`.

```bash
# Clonar el repositorio
git clone https://github.com/seguridades/Monitor-de-Oportunidades.git
cd Monitor-de-Oportunidades

# Activar versión de Node (si usas nvm)
nvm use

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Firebase

# Desarrollo
npm run dev

# Build para producción
npm run build

# Deploy a Firebase Hosting
npm run build && firebase deploy
```

### Variables de entorno

Encuéntralas en Firebase Console → Project Settings → Your apps → SDK setup.

| Variable | Descripción |
|----------|-------------|
| `VITE_FIREBASE_API_KEY` | API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | ID del proyecto |
| `VITE_FIREBASE_STORAGE_BUCKET` | Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID |
| `VITE_FIREBASE_APP_ID` | App ID |

---

## Estructura del proyecto

```
src/
├── assets/
├── components/
│   ├── ui/                # Componentes base (AppModal, AppTag, AppConfirm…)
│   ├── opportunities/     # OpportunityCard, OpportunityForm, OpportunityStatusBadge
│   ├── layout/            # AppShell, AppSidebar, AppHeader
│   └── onboarding/        # WelcomeModal
├── views/
│   ├── auth/              # LoginView, AcceptInviteView
│   ├── PublicView         # Listado público sin login
│   ├── OpportunitiesView  # Catálogo privado con filtros y agrupación por tipo
│   ├── MyListView         # Seguimiento personal
│   ├── PendingView        # Aprobación de propuestas (moderador/admin)
│   ├── AdminView          # Usuarios, invitaciones, importación en lote
│   └── GuideView          # Guía de uso
├── stores/                # auth, opportunities, follows, notifications, ui
├── firebase/              # config.js, auth.js
└── router/                # Guards de autenticación y rol
```

---

## Importar oportunidades en lote

El panel de administración permite importar oportunidades desde JSON. Ver [`oportunidades-ejemplo.json`](./oportunidades-ejemplo.json) como referencia de formato.

---

## Privacidad

Los datos se guardan en texto plano en Firestore (Google). Los datos personales de seguimiento (notas, estado, destacados en Mi Lista) son accesibles para quien tenga acceso directo a la base de datos. Ningún dato se comparte con terceros ni se usa con fines comerciales.

---

## Contacto y feedback

Para solicitudes, comentarios o reportar un problema: **info@seguridades.org**

---

## Licencia

Código abierto. Puedes revisarlo, adaptarlo o contribuir desde este repositorio.
