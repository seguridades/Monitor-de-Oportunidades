<script setup>
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { db } from '@/firebase/config'
import { doc, updateDoc } from 'firebase/firestore'
import { toast } from 'vue-sonner'

const router = useRouter()

const showEditProfile = ref(false)
const editProfile = ref({ displayName: '', org: '' })
const savingProfile = ref(false)

function openEditProfile() {
  editProfile.value = {
    displayName: auth.userProfile?.displayName ?? '',
    org: auth.userProfile?.org ?? '',
  }
  showEditProfile.value = true
}

async function saveProfile() {
  savingProfile.value = true
  try {
    await updateDoc(doc(db, 'users', auth.user.uid), {
      displayName: editProfile.value.displayName.trim(),
      org: editProfile.value.org.trim() || null,
    })
    await auth.loadUserProfile(auth.user.uid)
    showEditProfile.value = false
    toast.success('Perfil actualizado')
  } catch {
    toast.error('Error al guardar')
  } finally {
    savingProfile.value = false
  }
}

const ui = useUIStore()
const auth = useAuthStore()

const roleLabelMap = {
  admin: 'Admin',
  member: 'Miembro',
  guest: 'Invitado',
}
</script>

<template>
  <aside
    class="flex flex-col w-56 border-r border-border-base bg-bg-surface h-full"
  >
    <!-- Logo -->
    <div class="flex items-center h-14 px-4 border-b border-border-base shrink-0">
      <RouterLink to="/">
        <img src="@/assets/logo.svg" alt="seguridades.org" class="h-6" />
      </RouterLink>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
      <RouterLink
        to="/"
        class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
        :class="$route.name === 'Opportunities'
          ? 'bg-bg-surface-2 text-text-primary font-medium'
          : 'text-text-muted hover:text-text-primary hover:bg-bg-surface-2'"
      >
        Todas las oportunidades
      </RouterLink>
      <RouterLink
        to="/my-list"
        class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
        :class="$route.name === 'MyList'
          ? 'bg-bg-surface-2 text-text-primary font-medium'
          : 'text-text-muted hover:text-text-primary hover:bg-bg-surface-2'"
      >
        Mi Lista
      </RouterLink>
      <RouterLink
        v-if="auth.isMember"
        to="/pending"
        class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
        :class="$route.name === 'Pending'
          ? 'bg-bg-surface-2 text-text-primary font-medium'
          : 'text-text-muted hover:text-text-primary hover:bg-bg-surface-2'"
      >
        Pendientes
      </RouterLink>
      <RouterLink
        v-if="auth.isAdmin"
        to="/admin"
        class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
        :class="$route.name === 'Admin'
          ? 'bg-bg-surface-2 text-text-primary font-medium'
          : 'text-text-muted hover:text-text-primary hover:bg-bg-surface-2'"
      >
        Administración
      </RouterLink>

      <div class="mt-3 border-t border-border-base pt-3">
        <RouterLink
          to="/guide"
          class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
          :class="$route.name === 'Guide'
            ? 'bg-bg-surface-2 text-text-primary font-medium'
            : 'text-text-muted hover:text-text-primary hover:bg-bg-surface-2'"
        >
          Guía de uso
        </RouterLink>
      </div>
    </nav>

    <!-- User section -->
    <div class="px-3 py-3 border-t border-border-base shrink-0">
      <div class="px-2 py-1.5 mb-2">
        <p class="text-xs font-medium text-text-primary truncate">{{ auth.userProfile?.displayName }}</p>
        <p class="text-xs text-text-muted truncate">{{ auth.userProfile?.org }}</p>
        <span class="inline-flex items-center mt-1 px-1.5 py-0.5 rounded text-xs bg-bg-surface-2 text-text-muted border border-border-base">
          {{ roleLabelMap[auth.role] ?? auth.role }}
        </span>
      </div>
      <button
        @click="openEditProfile"
        class="w-full text-left px-2 py-1.5 rounded-lg text-xs text-text-muted hover:text-text-primary hover:bg-bg-surface-2 transition-colors"
      >
        Editar perfil
      </button>

      <!-- Inline edit form -->
      <div v-if="showEditProfile" class="mt-1 mb-1 space-y-2 px-1">
        <div>
          <label class="block text-xs text-text-muted mb-1">Nombre</label>
          <input v-model="editProfile.displayName" type="text"
            class="w-full px-2 py-1.5 rounded border border-border-base bg-bg-base text-text-primary text-xs focus:outline-none focus:border-accent" />
        </div>
        <div>
          <label class="block text-xs text-text-muted mb-1">Organización</label>
          <input v-model="editProfile.org" type="text"
            class="w-full px-2 py-1.5 rounded border border-border-base bg-bg-base text-text-primary text-xs focus:outline-none focus:border-accent" />
        </div>
        <div class="flex gap-2">
          <button @click="saveProfile" :disabled="savingProfile"
            class="flex-1 py-1.5 rounded bg-accent text-bg-base text-xs font-medium hover:opacity-90 disabled:opacity-50">
            {{ savingProfile ? 'Guardando...' : 'Guardar' }}
          </button>
          <button @click="showEditProfile = false"
            class="px-2 py-1.5 rounded border border-border-base text-text-muted text-xs hover:text-text-primary">
            ×
          </button>
        </div>
      </div>

      <button
        @click="auth.logout().then(() => router.push('/login'))"
        class="w-full text-left px-2 py-1.5 rounded-lg text-xs text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
      >
        Cerrar sesión
      </button>
    </div>
  </aside>
</template>
