import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/firebase/config'
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'

export const useOrganizationsStore = defineStore('organizations', () => {
  const organizations = ref([])
  const loading = ref(false)

  async function load() {
    loading.value = true
    try {
      const snap = await getDocs(query(collection(db, 'organizations'), orderBy('name', 'asc')))
      organizations.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    } finally {
      loading.value = false
    }
  }

  async function create(data) {
    const ref = await addDoc(collection(db, 'organizations'), {
      name: data.name.trim(),
      description: (data.description || '').trim(),
      active: true,
      createdAt: serverTimestamp(),
    })
    await load()
    return ref.id
  }

  async function update(id, data) {
    await updateDoc(doc(db, 'organizations', id), {
      name: data.name.trim(),
      description: (data.description || '').trim(),
    })
    const org = organizations.value.find(o => o.id === id)
    if (org) {
      org.name = data.name.trim()
      org.description = (data.description || '').trim()
    }
  }

  async function toggleActive(org) {
    const newActive = !org.active
    await updateDoc(doc(db, 'organizations', org.id), { active: newActive })
    org.active = newActive
  }

  async function remove(id) {
    await deleteDoc(doc(db, 'organizations', id))
    organizations.value = organizations.value.filter(o => o.id !== id)
  }

  return { organizations, loading, load, create, update, toggleActive, remove }
})
