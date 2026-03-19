import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/firebase/config'
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, onSnapshot, serverTimestamp,
} from 'firebase/firestore'
import { useAuthStore } from '@/stores/auth'
import { useNotificationsStore } from '@/stores/notifications'

export const useOpportunitiesStore = defineStore('opportunities', () => {
  const allOpportunities = ref([])
  const loading = ref(false)
  let unsubscribe = null

  const approved = computed(() =>
    allOpportunities.value.filter(o => o.status !== 'pendiente_aprobacion')
  )

  const pending = computed(() =>
    allOpportunities.value.filter(o => o.status === 'pendiente_aprobacion')
  )

  function subscribe() {
    const auth = useAuthStore()
    loading.value = true
    const col = collection(db, 'opportunities')
    let q
    if (auth.canApprove) {
      // Admin/moderador: fetch everything including pending
      q = query(col, orderBy('createdAt', 'desc'))
    } else {
      // Invitados: query must match rule (status != pendiente_aprobacion)
      // Single orderBy('status') avoids composite index requirement
      q = query(col, where('status', '!=', 'pendiente_aprobacion'), orderBy('status'))
    }
    unsubscribe = onSnapshot(q, (snap) => {
      allOpportunities.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      loading.value = false
    }, () => { loading.value = false })
  }

  function stopSubscription() {
    if (unsubscribe) { unsubscribe(); unsubscribe = null }
    allOpportunities.value = []
  }

  async function addOpportunity(data) {
    const auth = useAuthStore()
    const status = auth.canApprove ? 'nueva' : 'pendiente_aprobacion'
    const { scope: _scope, orgId: _orgId, ...rest } = data
    await addDoc(collection(db, 'opportunities'), {
      ...rest,
      addedBy: auth.user?.uid ?? null,
      addedByName: auth.userProfile?.displayName ?? null,
      status,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    if (!auth.canApprove && auth.user) {
      const notifs = useNotificationsStore()
      notifs.createNotification(auth.user.uid, 'pending', data.title).catch(() => {})
    }
  }

  async function updateOpportunity(id, data) {
    await updateDoc(doc(db, 'opportunities', id), {
      ...data,
      updatedAt: serverTimestamp(),
    })
  }

  async function deleteOpportunity(id) {
    await deleteDoc(doc(db, 'opportunities', id))
  }

  async function approveOpportunity(id) {
    const auth = useAuthStore()
    const opp = allOpportunities.value.find(o => o.id === id)
    await updateDoc(doc(db, 'opportunities', id), {
      status: 'nueva',
      approvedBy: auth.user?.uid ?? null,
      updatedAt: serverTimestamp(),
    })
    if (opp?.addedBy) {
      const notifs = useNotificationsStore()
      notifs.createNotification(opp.addedBy, 'approved', opp.title).catch(() => {})
    }
  }

  async function rejectOpportunity(id) {
    const opp = allOpportunities.value.find(o => o.id === id)
    await deleteDoc(doc(db, 'opportunities', id))
    if (opp?.addedBy) {
      const notifs = useNotificationsStore()
      notifs.createNotification(opp.addedBy, 'rejected', opp.title).catch(() => {})
    }
  }

  async function changeStatus(id, status) {
    await updateDoc(doc(db, 'opportunities', id), {
      status,
      updatedAt: serverTimestamp(),
    })
  }

  return {
    allOpportunities, loading,
    approved, pending,
    subscribe, stopSubscription,
    addOpportunity, updateOpportunity, deleteOpportunity,
    approveOpportunity, rejectOpportunity,
    changeStatus,
  }
})
