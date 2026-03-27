import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/firebase/config'
import {
  collection, doc, addDoc, updateDoc,
  query, orderBy, onSnapshot, serverTimestamp,
} from 'firebase/firestore'
import { useAuthStore } from '@/stores/auth'

export const useReportsStore = defineStore('reports', () => {
  const reports = ref([])
  const loading = ref(false)
  let unsubscribe = null

  const pending = computed(() => reports.value.filter(r => r.status === 'pendiente'))
  const resolved = computed(() => reports.value.filter(r => r.status === 'resuelto'))

  function subscribe() {
    loading.value = true
    const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'))
    unsubscribe = onSnapshot(q, (snap) => {
      reports.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      loading.value = false
    }, () => { loading.value = false })
  }

  function stopSubscription() {
    if (unsubscribe) { unsubscribe(); unsubscribe = null }
    reports.value = []
  }

  async function createReport({ opportunityId, opportunityTitle, reason, comment }) {
    const auth = useAuthStore()
    await addDoc(collection(db, 'reports'), {
      opportunityId,
      opportunityTitle,
      reason,
      comment: comment?.trim() || '',
      reportedBy: auth.user?.uid ?? null,
      reportedByName: auth.userProfile?.displayName ?? null,
      status: 'pendiente',
      createdAt: serverTimestamp(),
    })
  }

  async function resolveReport(id) {
    await updateDoc(doc(db, 'reports', id), { status: 'resuelto' })
  }

  async function reopenReport(id) {
    await updateDoc(doc(db, 'reports', id), { status: 'pendiente' })
  }

  return {
    reports, loading, pending, resolved,
    subscribe, stopSubscription,
    createReport, resolveReport, reopenReport,
  }
})
