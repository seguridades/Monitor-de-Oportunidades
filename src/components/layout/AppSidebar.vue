<script setup>
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { useOpportunitiesStore } from '@/stores/opportunities'
import { useReportsStore } from '@/stores/reports'
import { db } from '@/firebase/config'
import { doc, updateDoc } from 'firebase/firestore'
import { getAuth, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'
import { toast } from 'vue-sonner'

const router = useRouter()
const ui = useUIStore()
const auth = useAuthStore()
const opps = useOpportunitiesStore()
const reportsStore = useReportsStore()

const showEditProfile = ref(false)
const editProfile = ref({ displayName: '', org: '' })
const newPassword = ref('')
const currentPassword = ref('')
const savingProfile = ref(false)

function openEditProfile() {
  editProfile.value = {
    displayName: auth.userProfile?.displayName ?? '',
    org: auth.userProfile?.org ?? '',
  }
  newPassword.value = ''
  currentPassword.value = ''
  showEditProfile.value = true
}

async function saveProfile() {
  if (!editProfile.value.displayName.trim()) {
    toast.error('El nombre es obligatorio')
    return
  }
  savingProfile.value = true
  try {
    // Update Firestore profile
    await updateDoc(doc(db, 'users', auth.user.uid), {
      displayName: editProfile.value.displayName.trim(),
      org: editProfile.value.org.trim() || null,
    })

    // Update password if provided
    if (newPassword.value) {
      if (!currentPassword.value) {
        toast.error('Ingresa tu contraseña actual para cambiarla')
        savingProfile.value = false
        return
      }
      const firebaseUser = getAuth().currentUser
      const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword.value)
      await reauthenticateWithCredential(firebaseUser, credential)
      await updatePassword(firebaseUser, newPassword.value)
    }

    await auth.loadUserProfile(auth.user.uid)
    showEditProfile.value = false
    toast.success('Perfil actualizado')
  } catch (e) {
    console.error('saveProfile error:', e)
    if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
      toast.error('Contraseña actual incorrecta')
    } else if (e.code === 'auth/weak-password') {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres')
    } else {
      toast.error(e.message || 'Error al guardar')
    }
  } finally {
    savingProfile.value = false
  }
}

const roleLabelMap = {
  admin: 'Admin',
  moderador: 'Moderador',
  invitado: 'Invitado',
}
</script>

<template>
  <aside class="flex flex-col w-56 border-r border-border-base bg-bg-surface h-full">
    <!-- Logo -->
    <div class="flex items-center h-14 px-4 border-b border-border-base shrink-0">
      <RouterLink to="/catalog">
        <img src="@/assets/logo.svg" alt="seguridades.org" class="h-6" />
      </RouterLink>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
      <RouterLink
        to="/catalog"
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
        v-if="auth.canApprove"
        to="/pending"
        class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
        :class="$route.name === 'Pending'
          ? 'bg-bg-surface-2 text-text-primary font-medium'
          : 'text-text-muted hover:text-text-primary hover:bg-bg-surface-2'"
      >
        Pendientes
        <span v-if="opps.pending.length > 0" class="ml-auto text-xs bg-amber/20 text-amber px-1.5 py-0.5 rounded-full font-medium">
          {{ opps.pending.length }}
        </span>
      </RouterLink>
      <RouterLink
        v-if="auth.canApprove"
        to="/reports"
        class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
        :class="$route.name === 'Reports'
          ? 'bg-bg-surface-2 text-text-primary font-medium'
          : 'text-text-muted hover:text-text-primary hover:bg-bg-surface-2'"
      >
        Reportes
        <span v-if="reportsStore.pending.length > 0" class="ml-auto text-xs bg-danger/15 text-danger px-1.5 py-0.5 rounded-full font-medium">
          {{ reportsStore.pending.length }}
        </span>
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

      <div class="mt-3 border-t border-border-base pt-3 space-y-0.5">
        <RouterLink
          to="/guide"
          class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
          :class="$route.name === 'Guide'
            ? 'bg-bg-surface-2 text-text-primary font-medium'
            : 'text-text-muted hover:text-text-primary hover:bg-bg-surface-2'"
        >
          Guía de uso
        </RouterLink>
        <RouterLink
          to="/about"
          class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
          :class="$route.name === 'About'
            ? 'bg-bg-surface-2 text-text-primary font-medium'
            : 'text-text-muted hover:text-text-primary hover:bg-bg-surface-2'"
        >
          Acerca del proyecto
        </RouterLink>
      </div>
    </nav>

    <!-- User section -->
    <div class="px-3 py-3 border-t border-border-base shrink-0">
      <div class="px-2 py-1.5 mb-2">
        <p class="text-xs font-medium text-text-primary truncate">{{ auth.userProfile?.displayName }}</p>
        <p v-if="auth.userProfile?.org" class="text-xs text-text-muted truncate">{{ auth.userProfile.org }}</p>
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
      <div v-if="showEditProfile" class="mt-2 mb-1 space-y-2 px-1">
        <div>
          <label class="block text-xs text-text-muted mb-1">Nombre *</label>
          <input
            v-model="editProfile.displayName"
            type="text"
            class="w-full px-2 py-1.5 rounded border border-border-base bg-bg-base text-text-primary text-xs focus:outline-none focus:border-accent"
            placeholder="Nombre o pseudónimo"
          />
        </div>
        <div>
          <label class="block text-xs text-text-muted mb-1">Organización <span class="font-normal">(opcional)</span></label>
          <input
            v-model="editProfile.org"
            type="text"
            class="w-full px-2 py-1.5 rounded border border-border-base bg-bg-base text-text-primary text-xs focus:outline-none focus:border-accent"
            placeholder="Tu organización"
          />
        </div>
        <div class="border-t border-border-base pt-2">
          <label class="block text-xs text-text-muted mb-1">Nueva contraseña <span class="font-normal">(opcional)</span></label>
          <input
            v-model="newPassword"
            type="password"
            class="w-full px-2 py-1.5 rounded border border-border-base bg-bg-base text-text-primary text-xs focus:outline-none focus:border-accent"
            placeholder="Dejar vacío para no cambiar"
            minlength="6"
          />
        </div>
        <div v-if="newPassword">
          <label class="block text-xs text-text-muted mb-1">Contraseña <strong class="text-text-primary">actual</strong> *</label>
          <input
            v-model="currentPassword"
            type="password"
            class="w-full px-2 py-1.5 rounded border border-border-base bg-bg-base text-text-primary text-xs focus:outline-none focus:border-accent"
            placeholder="Requerida para cambiar"
          />
        </div>
        <div class="flex gap-2 pt-1">
          <button
            @click="saveProfile"
            :disabled="savingProfile"
            class="flex-1 py-1.5 rounded bg-accent text-bg-base text-xs font-medium hover:opacity-90 disabled:opacity-50"
          >
            {{ savingProfile ? 'Guardando...' : 'Guardar' }}
          </button>
          <button
            @click="showEditProfile = false"
            class="px-2 py-1.5 rounded border border-border-base text-text-muted text-xs hover:text-text-primary"
          >
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
