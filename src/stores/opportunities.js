import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/firebase/config'
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import { useAuthStore } from '@/stores/auth'

export const useOpportunitiesStore = defineStore('opportunities', () => {
  const opportunities = ref([])
  const loading = ref(false)
  let unsubscribe = null

  const pending = computed(() =>
    opportunities.value.filter((o) => o.status === 'pendiente_aprobacion')
  )

  const approved = computed(() =>
    opportunities.value.filter((o) => o.status !== 'pendiente_aprobacion')
  )

  function subscribe() {
    const auth = useAuthStore()
    loading.value = true

    const col = collection(db, 'opportunities')
    let q

    if (auth.isMember) {
      q = query(col, orderBy('createdAt', 'desc'))
    } else {
      q = query(col, where('status', '!=', 'pendiente_aprobacion'), orderBy('status'), orderBy('createdAt', 'desc'))
    }

    unsubscribe = onSnapshot(q, (snapshot) => {
      opportunities.value = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      loading.value = false
    }, () => {
      loading.value = false
    })
  }

  function stopSubscription() {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  async function addOpportunity(data) {
    const auth = useAuthStore()
    const status = auth.isMember ? 'nueva' : 'pendiente_aprobacion'

    await addDoc(collection(db, 'opportunities'), {
      ...data,
      addedBy: auth.user?.uid ?? null,
      addedByOrg: auth.userProfile?.org ?? null,
      status,
      featured: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  async function updateOpportunity(id, data) {
    const docRef = doc(db, 'opportunities', id)
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    })
  }

  async function deleteOpportunity(id) {
    await deleteDoc(doc(db, 'opportunities', id))
  }

  async function approveOpportunity(id) {
    const auth = useAuthStore()
    await updateDoc(doc(db, 'opportunities', id), {
      status: 'nueva',
      approvedBy: auth.user?.uid ?? null,
      updatedAt: serverTimestamp(),
    })
  }

  async function rejectOpportunity(id) {
    await deleteDoc(doc(db, 'opportunities', id))
  }

  async function toggleFeatured(id, currentFeatured) {
    await updateDoc(doc(db, 'opportunities', id), {
      featured: !currentFeatured,
      updatedAt: serverTimestamp(),
    })
  }

  async function changeStatus(id, status) {
    await updateDoc(doc(db, 'opportunities', id), {
      status,
      updatedAt: serverTimestamp(),
    })
  }

  return {
    opportunities,
    loading,
    pending,
    approved,
    subscribe,
    stopSubscription,
    addOpportunity,
    updateOpportunity,
    deleteOpportunity,
    approveOpportunity,
    rejectOpportunity,
    toggleFeatured,
    changeStatus,
  }
})
