import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/firebase/config'
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore'
import { useAuthStore } from '@/stores/auth'

export const useOrgFollowsStore = defineStore('orgFollows', () => {
  const follows = ref([])
  const loading = ref(false)
  let unsubscribe = null

  function subscribe() {
    const auth = useAuthStore()
    if (!auth.orgId) return

    loading.value = true
    const q = query(
      collection(db, 'org_follows'),
      where('orgId', '==', auth.orgId)
    )

    unsubscribe = onSnapshot(q, (snapshot) => {
      follows.value = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
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
    follows.value = []
  }

  function isFollowing(opportunityId) {
    return follows.value.some(f => f.opportunityId === opportunityId)
  }

  function getFollow(opportunityId) {
    return follows.value.find(f => f.opportunityId === opportunityId)
  }

  async function follow(opportunityId) {
    const auth = useAuthStore()
    if (!auth.orgId) return

    const id = `${auth.orgId}_${opportunityId}`
    await setDoc(doc(db, 'org_follows', id), {
      orgId: auth.orgId,
      opportunityId,
      followedAt: new Date(),
      followedBy: auth.user.uid,
      status: 'nueva',
      relevancia: null,
    })
  }

  async function unfollow(opportunityId) {
    const auth = useAuthStore()
    if (!auth.orgId) return
    const id = `${auth.orgId}_${opportunityId}`
    await deleteDoc(doc(db, 'org_follows', id))
  }

  async function updateFollow(opportunityId, data) {
    const auth = useAuthStore()
    if (!auth.orgId) return
    const id = `${auth.orgId}_${opportunityId}`
    await updateDoc(doc(db, 'org_follows', id), data)
  }

  return {
    follows,
    loading,
    subscribe,
    stopSubscription,
    isFollowing,
    getFollow,
    follow,
    unfollow,
    updateFollow,
  }
})
