import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/firebase/config'
import {
  collection, doc, addDoc, updateDoc, deleteDoc, query,
  where, onSnapshot, serverTimestamp, writeBatch,
} from 'firebase/firestore'
import { useAuthStore } from '@/stores/auth'

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref([])
  const loading = ref(false)
  let unsubscribe = null

  const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

  function subscribe() {
    const auth = useAuthStore()
    if (!auth.user) return

    loading.value = true
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', auth.user.uid)
    )

    unsubscribe = onSnapshot(q, (snap) => {
      notifications.value = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const ta = a.createdAt?.toDate?.() ?? new Date(0)
          const tb = b.createdAt?.toDate?.() ?? new Date(0)
          return tb - ta
        })
      loading.value = false
    }, (err) => {
      console.error('notifications subscription error:', err)
      loading.value = false
    })
  }

  function stopSubscription() {
    if (unsubscribe) { unsubscribe(); unsubscribe = null }
    notifications.value = []
  }

  async function markAllRead() {
    const unread = notifications.value.filter(n => !n.read)
    if (!unread.length) return
    const batch = writeBatch(db)
    unread.forEach(n => batch.update(doc(db, 'notifications', n.id), { read: true }))
    await batch.commit()
  }

  async function deleteNotification(id) {
    await deleteDoc(doc(db, 'notifications', id))
  }

  async function deleteAllRead() {
    const read = notifications.value.filter(n => n.read)
    if (!read.length) return
    const batch = writeBatch(db)
    read.forEach(n => batch.delete(doc(db, 'notifications', n.id)))
    await batch.commit()
  }

  async function createNotification(userId, type, opportunityTitle) {
    await addDoc(collection(db, 'notifications'), {
      userId,
      type,
      opportunityTitle,
      read: false,
      createdAt: serverTimestamp(),
    })
  }

  return {
    notifications, loading, unreadCount,
    subscribe, stopSubscription,
    markAllRead, deleteNotification, deleteAllRead, createNotification,
  }
})
