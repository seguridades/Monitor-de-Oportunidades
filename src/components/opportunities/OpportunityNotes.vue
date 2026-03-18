<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { db } from '@/firebase/config'
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import { useAuthStore } from '@/stores/auth'
import { toast } from 'vue-sonner'

const props = defineProps({
  opportunityId: { type: String, required: true },
})

const auth = useAuthStore()
const notes = ref([])
const newNote = ref('')
const submitting = ref(false)
let unsubscribe = null

onMounted(() => {
  if (!auth.isMember) return
  const q = query(
    collection(db, 'opportunities', props.opportunityId, 'notes'),
    orderBy('createdAt', 'asc')
  )
  unsubscribe = onSnapshot(q, (snap) => {
    notes.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  })
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})

function formatDate(ts) {
  if (!ts) return ''
  const d = ts?.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

async function addNote() {
  if (!newNote.value.trim() || !auth.isMember) return
  submitting.value = true
  try {
    await addDoc(collection(db, 'opportunities', props.opportunityId, 'notes'), {
      content: newNote.value.trim(),
      authorId: auth.user.uid,
      authorName: auth.userProfile?.displayName ?? 'Anónimo',
      createdAt: serverTimestamp(),
    })
    newNote.value = ''
  } catch {
    toast.error('Error al agregar nota')
  } finally {
    submitting.value = false
  }
}

async function deleteNote(noteId) {
  try {
    await deleteDoc(doc(db, 'opportunities', props.opportunityId, 'notes', noteId))
  } catch {
    toast.error('Error al eliminar nota')
  }
}

function canDelete(note) {
  return auth.isAdmin || note.authorId === auth.user?.uid
}
</script>

<template>
  <div v-if="auth.isMember" class="px-4 py-3 space-y-3">
    <!-- Notes list -->
    <div v-if="notes.length" class="space-y-2">
      <div
        v-for="note in notes"
        :key="note.id"
        class="bg-bg-surface-2 rounded-lg px-3 py-2"
      >
        <div class="flex items-start justify-between gap-2">
          <p class="text-xs text-text-primary flex-1">{{ note.content }}</p>
          <button
            v-if="canDelete(note)"
            @click="deleteNote(note.id)"
            class="text-xs text-text-muted hover:text-danger transition-colors shrink-0"
          >
            ✕
          </button>
        </div>
        <p class="text-xs text-text-muted mt-1">{{ note.authorName }} · {{ formatDate(note.createdAt) }}</p>
      </div>
    </div>
    <p v-else class="text-xs text-text-muted">Sin notas aún.</p>

    <!-- Add note form -->
    <div class="flex gap-2">
      <textarea
        v-model="newNote"
        rows="2"
        placeholder="Agregar nota..."
        class="flex-1 px-2 py-1.5 rounded border border-border-base bg-bg-base text-text-primary text-xs resize-none focus:outline-none focus:border-accent"
        @keydown.ctrl.enter="addNote"
      />
      <button
        @click="addNote"
        :disabled="submitting || !newNote.trim()"
        class="px-3 py-1.5 rounded-lg bg-accent text-bg-base text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-opacity self-end"
      >
        Agregar
      </button>
    </div>
  </div>
</template>
