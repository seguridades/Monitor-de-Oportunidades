<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { registerWithEmail } from '@/firebase/auth'
import { db } from '@/firebase/config'
import {
  getDoc,
  setDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const step = ref('loading') // loading | valid | invalid | done
const invitation = ref(null)
const inviteDocId = ref(null)
const errorMsg = ref('')

const displayName = ref('')
const org = ref('')
const password = ref('')
const confirmPassword = ref('')
const submitting = ref(false)

onMounted(async () => {
  try {
    const token = route.params.token
    const invDoc = await getDoc(doc(db, 'invitations', token))

    if (!invDoc.exists()) {
      step.value = 'invalid'
      errorMsg.value = 'Invitación no encontrada o ya utilizada.'
      return
    }

    const data = invDoc.data()

    if (data.used) {
      step.value = 'invalid'
      errorMsg.value = 'Invitación no encontrada o ya utilizada.'
      return
    }

    // Check expiration
    const expiresAt = data.expiresAt?.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt)
    if (expiresAt < new Date()) {
      step.value = 'invalid'
      errorMsg.value = 'Esta invitación ha expirado.'
      return
    }

    invitation.value = data
    inviteDocId.value = invDoc.id

    step.value = 'valid'
  } catch (e) {
    step.value = 'invalid'
    errorMsg.value = 'Error al validar la invitación.'
  }
})

async function handleEmailRegister() {
  if (password.value !== confirmPassword.value) {
    errorMsg.value = 'Las contraseñas no coinciden.'
    return
  }
  if (!displayName.value.trim()) {
    errorMsg.value = 'El nombre es obligatorio.'
    return
  }
  errorMsg.value = ''
  submitting.value = true

  try {
    const result = await registerWithEmail(invitation.value.email, password.value)
    const uid = result.user.uid

    await setDoc(doc(db, 'users', uid), {
      displayName: displayName.value.trim(),
      org: org.value.trim() || null,
      email: invitation.value.email,
      role: invitation.value.role,
      active: true,
      invitedBy: invitation.value.invitedBy ?? null,
      createdAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
    })

    await updateDoc(doc(db, 'invitations', inviteDocId.value), { used: true })
    await auth.loadUserProfile(uid)

    step.value = 'done'
    toast.success('¡Cuenta creada exitosamente!')
    router.push('/')
  } catch (e) {
    if (e.code === 'auth/email-already-in-use') {
      errorMsg.value = 'Este email ya está registrado. Intenta iniciar sesión.'
    } else {
      errorMsg.value = e.message || 'Error al crear la cuenta.'
    }
  } finally {
    submitting.value = false
  }
}


</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-bg-base px-4">
    <div class="flex flex-col items-center gap-8 w-full max-w-sm">
      <img src="@/assets/logo.svg" alt="seguridades.org" class="h-10" />

      <!-- Loading -->
      <div v-if="step === 'loading'" class="bg-bg-surface border border-border-base rounded-2xl p-8 w-full text-center">
        <p class="text-text-muted text-sm">Validando invitación...</p>
      </div>

      <!-- Invalid -->
      <div v-else-if="step === 'invalid'" class="bg-bg-surface border border-border-base rounded-2xl p-8 w-full text-center space-y-3">
        <h2 class="text-lg font-semibold text-text-primary">Invitación inválida</h2>
        <p class="text-text-muted text-sm">{{ errorMsg }}</p>
        <router-link to="/login" class="text-accent text-sm hover:underline">Ir al login</router-link>
      </div>

      <!-- Valid — registration form -->
      <div v-else-if="step === 'valid'" class="bg-bg-surface border border-border-base rounded-2xl p-8 w-full shadow-sm">
        <h1 class="text-xl font-semibold text-text-primary text-center mb-1">Aceptar Invitación</h1>
        <p class="text-text-muted text-sm text-center mb-1">
          Fuiste invitado/a como <span class="text-text-primary font-medium">{{ invitation?.role }}</span>
        </p>
        <p class="text-text-muted text-xs text-center mb-6">{{ invitation?.email }}</p>

        <div v-if="errorMsg" class="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">
          {{ errorMsg }}
        </div>

        <form @submit.prevent="handleEmailRegister" class="space-y-3">
          <div>
            <label class="block text-xs font-medium text-text-muted mb-1">Nombre o pseudónimo *</label>
            <input
              v-model="displayName"
              type="text"
              required
              class="w-full px-3 py-2 rounded-lg border border-border-base bg-bg-base text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
              placeholder="Cómo quieres nombrarte"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-text-muted mb-1">Organización <span class="text-text-muted font-normal">(opcional)</span></label>
            <input
              v-model="org"
              type="text"
              class="w-full px-3 py-2 rounded-lg border border-border-base bg-bg-base text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
              placeholder="Tu organización o institución"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-text-muted mb-1">Contraseña *</label>
            <input
              v-model="password"
              type="password"
              required
              minlength="6"
              class="w-full px-3 py-2 rounded-lg border border-border-base bg-bg-base text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-text-muted mb-1">Confirmar contraseña *</label>
            <input
              v-model="confirmPassword"
              type="password"
              required
              class="w-full px-3 py-2 rounded-lg border border-border-base bg-bg-base text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
              placeholder="Repetir contraseña"
            />
          </div>
          <button
            type="submit"
            :disabled="submitting"
            class="w-full py-2.5 rounded-lg bg-accent text-bg-base text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ submitting ? 'Creando cuenta...' : 'Crear cuenta' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
