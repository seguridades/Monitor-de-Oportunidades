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

export const useFollowsStore = defineStore('follows', () => {
  const follows = ref([])
  const loading = ref(false)
  let unsubscribe = null

  function subscribe() {
    const auth = useAuthStore()
    if (!auth.user) return

    loading.value = true
    const q = query(
      collection(db, 'user_follows'),
      where('userId', '==', auth.user.uid)
    )

    unsubscribe = onSnapshot(q, (snapshot) => {
      follows.value = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
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
    return follows.value.some((f) => f.opportunityId === opportunityId)
  }

  function getFollow(opportunityId) {
    return follows.value.find((f) => f.opportunityId === opportunityId)
  }

  async function follow(opportunityId) {
    const auth = useAuthStore()
    if (!auth.user) return

    const userId = auth.user.uid
    const id = `${userId}_${opportunityId}`
    const docRef = doc(db, 'user_follows', id)

    await setDoc(docRef, {
      userId,
      opportunityId,
      followedAt: new Date(),
      personalStatus: 'siguiendo',
      personalNote: null,
      noteShared: false,
    })
  }

  async function unfollow(opportunityId) {
    const auth = useAuthStore()
    if (!auth.user) return

    const id = `${auth.user.uid}_${opportunityId}`
    await deleteDoc(doc(db, 'user_follows', id))
  }

  async function updateFollow(opportunityId, data) {
    const auth = useAuthStore()
    if (!auth.user) return

    const id = `${auth.user.uid}_${opportunityId}`
    await updateDoc(doc(db, 'user_follows', id), data)
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
