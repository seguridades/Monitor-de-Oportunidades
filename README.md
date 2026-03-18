# Monitor de Oportunidades — seguridades.org

App privada para centralizar y trackear convocatorias de financiamiento, grants, capacitaciones y fuentes de consultoría relevantes para trabajo de seguridad digital con sociedad civil en América Latina.

## Stack

- **Vue 3** + Vite
- **Tailwind CSS v4**
- **Firebase** (Firestore + Auth + Storage + Hosting)
- **Pinia** (estado global)
- **Vue Router 4**
- **Lucide Vue** (íconos)
- **vue-sonner** (notificaciones)

## Requisitos

- **Node.js** 22.12+ o 25+ (Vite 8 requiere esto). Usa `nvm use` si tienes `.nvmrc`.

## Setup

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con las credenciales de tu proyecto Firebase (Firebase Console → Project Settings → Your apps → SDK setup and configuration).

### 3. Correr en desarrollo

```bash
nvm use   # activa Node 25 desde .nvmrc
npm run dev
```

### 4. Build para producción

```bash
npm run build
```

### 5. Deploy a Firebase Hosting

```bash
npm run build
firebase deploy
```

## Variables de entorno requeridas

| Variable | Descripción |
|----------|-------------|
| `VITE_FIREBASE_API_KEY` | API Key de Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | Auth domain (ej: `tu-proyecto.firebaseapp.com`) |
| `VITE_FIREBASE_PROJECT_ID` | ID del proyecto Firebase |
| `VITE_FIREBASE_STORAGE_BUCKET` | Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID |
| `VITE_FIREBASE_APP_ID` | App ID |

## Estructura del proyecto

```
src/
├── assets/           # logo.svg y otros assets estáticos
├── components/
│   ├── ui/           # Componentes base reutilizables
│   ├── opportunities/ # Componentes de oportunidades
│   └── layout/       # AppShell, AppSidebar, AppHeader
├── views/            # Vistas por ruta
├── stores/           # Pinia stores (auth, opportunities, follows, ui)
├── composables/      # Lógica reutilizable
├── firebase/         # Config e helpers de Firebase
└── router/           # Vue Router con guards de rol
```

## Roles

| Rol | Descripción |
|-----|-------------|
| `admin` | Equipo core de seguridades.org. Control total. |
| `member` | Equipo interno con permisos completos sobre convocatorias. |
| `guest` | Usuario externo invitado. |
# Monitor-de-Oportunidades
