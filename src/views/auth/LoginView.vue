<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import { loginWithEmail } from '@/firebase/auth'
import { logout } from '@/firebase/auth'
import { db } from '@/firebase/config'
import { doc, getDoc } from 'firebase/firestore'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function checkAndLoadProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists() || snap.data().active === false) {
    await logout()
    throw new Error('Acceso restringido. No tienes una invitación activa.')
  }
  await auth.loadUserProfile(uid)
}

async function handleEmailLogin() {
  error.value = ''
  loading.value = true
  try {
    const result = await loginWithEmail(email.value, password.value)
    await checkAndLoadProfile(result.user.uid)
    toast.success('Bienvenido/a')
    router.push(route.query.redirect || '/')
  } catch (e) {
    if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
      error.value = 'Email o contraseña incorrectos.'
    } else {
      error.value = e.message || 'Error al iniciar sesión.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-bg-base px-4">
    <div class="flex flex-col items-center gap-8 w-full max-w-sm">
      <img src="@/assets/logo.svg" alt="seguridades.org" class="h-10" />

      <div class="bg-bg-surface border border-border-base rounded-2xl p-8 w-full shadow-sm">
        <h1 class="text-xl font-semibold text-text-primary text-center mb-1">Monitor de Oportunidades</h1>
        <p class="text-text-muted text-sm text-center mb-6">seguridades.org</p>

        <div v-if="error" class="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">
          {{ error }}
        </div>

        <form @submit.prevent="handleEmailLogin" class="space-y-3">
          <div>
            <label class="block text-xs font-medium text-text-muted mb-1">Email</label>
            <input
              v-model="email"
              type="email"
              required
              autocomplete="email"
              class="w-full px-3 py-2 rounded-lg border border-border-base bg-bg-base text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-text-muted mb-1">Contraseña</label>
            <input
              v-model="password"
              type="password"
              required
              autocomplete="current-password"
              class="w-full px-3 py-2 rounded-lg border border-border-base bg-bg-base text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            :disabled="loading"
            class="w-full py-2.5 rounded-lg bg-accent text-bg-base text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? 'Iniciando...' : 'Iniciar sesión' }}
          </button>
        </form>
      </div>

      <p class="text-xs text-text-muted text-center">
        Acceso restringido - solo usuarios invitados
      </p>
    </div>
  </div>
</template>
