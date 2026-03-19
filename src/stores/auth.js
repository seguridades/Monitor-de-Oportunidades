import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { onAuthChange, logout as firebaseLogout } from '@/firebase/auth'
import { db } from '@/firebase/config'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const userProfile = ref(null)
  const loading = ref(true)

  const isAuthenticated = computed(() => !!user.value)
  const role = computed(() => userProfile.value?.role ?? null)

  const isAdmin = computed(() => role.value === 'admin')
  const isModerador = computed(() => role.value === 'moderador')
  // invitado = everyone else
  const isInvitado = computed(() => !isAdmin.value && !isModerador.value)

  // canEdit/canApprove: admin + moderador
  const canEdit = computed(() => isAdmin.value || isModerador.value)
  const canApprove = computed(() => isAdmin.value || isModerador.value)

  // Legacy aliases
  const isMember = canEdit
  const canApproveGlobal = canApprove

  async function loadUserProfile(uid) {
    const docRef = doc(db, 'users', uid)
    const snap = await getDoc(docRef)
    if (snap.exists()) {
      userProfile.value = { id: snap.id, ...snap.data() }
    } else {
      userProfile.value = null
    }
  }

  async function init() {
    return new Promise((resolve) => {
      onAuthChange(async (firebaseUser) => {
        if (firebaseUser) {
          const docRef = doc(db, 'users', firebaseUser.uid)
          const snap = await getDoc(docRef)

          if (!snap.exists() || snap.data().active === false) {
            await firebaseLogout()
            user.value = null
            userProfile.value = null
            loading.value = false
            resolve()
            return
          }

          user.value = firebaseUser
          userProfile.value = { id: snap.id, ...snap.data() }

          try {
            await updateDoc(docRef, { lastSeen: serverTimestamp() })
          } catch {
            // Non-critical
          }
        } else {
          user.value = null
          userProfile.value = null
        }

        loading.value = false
        resolve()
      })
    })
  }

  async function logout() {
    await firebaseLogout()
    user.value = null
    userProfile.value = null
  }

  return {
    user, userProfile, loading,
    isAuthenticated, role,
    isAdmin, isModerador, isInvitado,
    canEdit, canApprove,
    // legacy aliases
    isMember, canApproveGlobal,
    init, logout, loadUserProfile,
  }
})
