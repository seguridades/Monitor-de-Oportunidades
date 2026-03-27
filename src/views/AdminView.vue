<script setup>
import { ref, onMounted, computed } from 'vue'
import { toast } from 'vue-sonner'
import { Copy, Check } from 'lucide-vue-next'
import { db } from '@/firebase/config'
import {
  collection,
  query,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
  orderBy,
  where,
  writeBatch,
} from 'firebase/firestore'
import { useAuthStore } from '@/stores/auth'
import AppConfirm from '@/components/ui/AppConfirm.vue'

const auth = useAuthStore()
const activeTab = ref('users')

// ---- Users ----
const users = ref([])
const usersLoading = ref(false)

async function loadUsers() {
  usersLoading.value = true
  try {
    const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')))
    users.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch {
    toast.error('Error al cargar usuarios')
  } finally {
    usersLoading.value = false
  }
}

async function updateUserRole(userId, role) {
  try {
    await updateDoc(doc(db, 'users', userId), { role })
    const u = users.value.find(u => u.id === userId)
    if (u) u.role = role
    toast.success('Rol actualizado')
  } catch {
    toast.error('Error al actualizar rol')
  }
}

async function toggleUserActive(user) {
  try {
    const newActive = !user.active
    await updateDoc(doc(db, 'users', user.id), { active: newActive })
    user.active = newActive
    toast.success(newActive ? 'Usuario activado' : 'Usuario desactivado')
  } catch {
    toast.error('Error al actualizar')
  }
}

function formatDate(ts) {
  if (!ts) return '—'
  const d = ts?.toDate ? ts.toDate() : new Date(ts)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ---- Invitations ----
const inviteEmail = ref('')
const inviteRole = ref('invitado')
const inviteSubmitting = ref(false)
const generatedLink = ref('')
const copiedLink = ref(false)

const invitations = ref([])
const invitationsLoading = ref(false)

async function loadInvitations() {
  invitationsLoading.value = true
  try {
    const snap = await getDocs(query(collection(db, 'invitations'), orderBy('createdAt', 'desc')))
    invitations.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch {
    toast.error('Error al cargar invitaciones')
  } finally {
    invitationsLoading.value = false
  }
}

const pendingInvitations = computed(() => {
  const now = new Date()
  return invitations.value.filter(inv => {
    if (inv.used) return false
    const exp = inv.expiresAt?.toDate ? inv.expiresAt.toDate() : new Date(inv.expiresAt)
    return exp > now
  })
})

async function generateInvitation() {
  if (!inviteEmail.value.trim()) return
  inviteSubmitting.value = true
  generatedLink.value = ''

  try {
    const token = crypto.randomUUID()
    const expiresAt = Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))

    await setDoc(doc(db, 'invitations', token), {
      email: inviteEmail.value.trim().toLowerCase(),
      role: inviteRole.value,
      invitedBy: auth.user.uid,
      token,
      used: false,
      createdAt: serverTimestamp(),
      expiresAt,
    })

    const baseUrl = window.location.origin
    generatedLink.value = `${baseUrl}/invite/${token}`
    toast.success('Invitación generada')
    inviteEmail.value = ''
    await loadInvitations()
  } catch (e) {
    toast.error('Error al generar invitación')
  } finally {
    inviteSubmitting.value = false
  }
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(generatedLink.value)
    copiedLink.value = true
    setTimeout(() => { copiedLink.value = false }, 2000)
  } catch {
    toast.error('No se pudo copiar')
  }
}

const confirmRevokeTarget = ref(null)

function revokeInvitation(inv) {
  confirmRevokeTarget.value = inv
}

async function confirmRevoke() {
  const inv = confirmRevokeTarget.value
  confirmRevokeTarget.value = null
  try {
    await deleteDoc(doc(db, 'invitations', inv.id))
    invitations.value = invitations.value.filter(i => i.id !== inv.id)
    toast.success('Invitación revocada')
  } catch {
    toast.error('Error al revocar')
  }
}

// ---- Bulk Import ----
const VALID_TYPES = ['fuente', 'convocatoria', 'grant', 'capacitacion', 'evento', 'red', 'linea_ayuda', 'beca']

const importJson = ref('')
const importBatch = ref('')
const importParsed = ref([])
const importErrors = ref([])
const importResult = ref(null)
const importing = ref(false)

const IMPORT_EXAMPLE = JSON.stringify([
  {
    title: "OTF Internet Freedom Fund",
    type: "grant",
    description: "Apoya proyectos de libertad en internet.",
    url: "https://www.opentech.fund/funds/internet-freedom-fund/",
    tags: ["grant", "seguridad digital"],
    monto: "USD 10k–900k",
    quien_puede_aplicar: "Individuos y organizaciones",
    deadline: "2026-09-30"
  },
  {
    title: "Freedom of the Press Foundation – Security Training",
    type: "capacitacion",
    description: "Capacitaciones en seguridad digital para periodistas.",
    url: "https://freedom.press/training/",
    tags: ["capacitación", "periodismo"],
    fecha: "2026-06-15",
    modalidad: "virtual",
    dirigido_a: "Periodistas y activistas"
  }
], null, 2)

function parseImport() {
  importErrors.value = []
  importParsed.value = []
  importResult.value = null

  let raw
  try {
    raw = JSON.parse(importJson.value.trim().replace(/[\x00-\x1F]/g, ' '))
  } catch (e) {
    importErrors.value = ['JSON inválido: ' + e.message]
    return
  }

  if (!Array.isArray(raw)) {
    importErrors.value = ['El JSON debe ser un array [ ... ]']
    return
  }

  const errors = []
  const parsed = []

  raw.forEach((item, i) => {
    const n = i + 1
    if (!item.title?.trim()) { errors.push(`#${n}: "title" es obligatorio`); return }
    if (!VALID_TYPES.includes(item.type)) { errors.push(`#${n}: "type" debe ser uno de: ${VALID_TYPES.join(', ')}`); return }


    const tags = Array.isArray(item.tags)
      ? item.tags.map(t => String(t).trim()).filter(Boolean)
      : (item.tags || '').split(',').map(t => t.trim()).filter(Boolean)

    const entry = {
      title: item.title.trim(),
      type: item.type,
      description: (item.description || '').trim(),
      url: (item.url || '').trim(),
      tags,
    }

    if (item.type === 'fuente') {
      entry.freq = ['semanal', 'mensual'].includes(item.freq) ? item.freq : 'semanal'
    }
    if (item.type === 'convocatoria') {
      entry.deadline = item.deadline ? new Date(item.deadline) : null
      entry.reminderDays = Number(item.reminderDays) || 7
      if (item.monto) entry.monto = String(item.monto).trim()
    }
    if (item.type === 'grant') {
      entry.deadline = item.deadline ? new Date(item.deadline) : null
      if (item.monto) entry.monto = String(item.monto).trim()
      if (item.quien_puede_aplicar) entry.quien_puede_aplicar = String(item.quien_puede_aplicar).trim()
    }
    if (item.type === 'capacitacion') {
      entry.fecha = item.fecha ? new Date(item.fecha) : null
      entry.modalidad = ['virtual', 'presencial', 'hibrida'].includes(item.modalidad) ? item.modalidad : 'virtual'
      if (item.dirigido_a) entry.dirigido_a = String(item.dirigido_a).trim()
    }
    if (item.type === 'red') {
      if (item.como_unirse) entry.como_unirse = String(item.como_unirse).trim()
    }
    if (item.type === 'evento') {
      entry.fecha = item.fecha ? new Date(item.fecha) : null
      entry.modalidad = ['virtual', 'presencial', 'hibrida'].includes(item.modalidad) ? item.modalidad : 'virtual'
      if (item.lugar) entry.lugar = String(item.lugar).trim()
      if (item.dirigido_a) entry.dirigido_a = String(item.dirigido_a).trim()
    }
    if (item.type === 'linea_ayuda') {
      entry.respuesta_rapida = !!item.respuesta_rapida
      if (item.como_acceder) entry.como_acceder = String(item.como_acceder).trim()
      if (item.disponibilidad) entry.disponibilidad = String(item.disponibilidad).trim()
      if (item.para_quien) entry.para_quien = String(item.para_quien).trim()
    }
    if (item.type === 'beca') {
      entry.deadline = item.deadline ? new Date(item.deadline) : null
      if (item.monto) entry.monto = String(item.monto).trim()
      if (item.duracion) entry.duracion = String(item.duracion).trim()
      if (item.quien_puede_aplicar) entry.quien_puede_aplicar = String(item.quien_puede_aplicar).trim()
    }

    parsed.push(entry)
  })

  importErrors.value = errors
  importParsed.value = parsed
}

async function runImport() {
  if (!importParsed.value.length) return
  importing.value = true
  importResult.value = null

  try {
    const batch = writeBatch(db)
    const col = collection(db, 'opportunities')
    const now = serverTimestamp()

    const status = 'pendiente_aprobacion'
    const batchLabel = importBatch.value.trim() || null

    importParsed.value.forEach(entry => {
      const ref = doc(col)
      batch.set(ref, {
        ...entry,
        scope: 'global',
        orgId: null,
        addedBy: auth.user?.uid ?? null,
        addedByOrg: auth.userProfile?.org ?? null,
        ...(batchLabel ? { importBatch: batchLabel } : {}),
        status,
        createdAt: now,
        updatedAt: now,
      })
    })

    await batch.commit()
    importResult.value = { ok: importParsed.value.length, pending: !!importBatch.value.trim() }
    importParsed.value = []
    importJson.value = ''
    importBatch.value = ''
    toast.success(`${importResult.value.ok} oportunidades importadas`)
  } catch (e) {
    importResult.value = { error: e.message || 'Error al importar' }
    toast.error('Error al importar')
  } finally {
    importing.value = false
  }
}

// ---- Maintenance ----
const showResetConfirm = ref(false)
const resetting = ref(false)
const resetResult = ref(null)

function chunkArray(arr, size) {
  const result = []
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size))
  return result
}

async function runReset() {
  showResetConfirm.value = false
  resetting.value = true
  resetResult.value = null
  try {
    // 1. Reset all approved opportunities → pendiente_aprobacion
    const oppSnap = await getDocs(
      query(collection(db, 'opportunities'), where('status', '!=', 'pendiente_aprobacion'), orderBy('status'))
    )
    for (const chunk of chunkArray(oppSnap.docs, 499)) {
      const b = writeBatch(db)
      chunk.forEach(d => b.update(d.ref, { status: 'pendiente_aprobacion', updatedAt: serverTimestamp() }))
      await b.commit()
    }

    // 2. Delete all user_follows and org_follows (collections may not exist yet — ignore errors)
    for (const colName of ['user_follows', 'org_follows']) {
      try {
        const snap = await getDocs(collection(db, colName))
        for (const chunk of chunkArray(snap.docs, 499)) {
          const b = writeBatch(db)
          chunk.forEach(d => b.delete(d.ref))
          await b.commit()
        }
      } catch {
        // collection may not exist yet, not critical
      }
    }

    resetResult.value = { ok: true, opps: oppSnap.docs.length }
    toast.success('Reset completado')
  } catch (e) {
    resetResult.value = { error: e.message || 'Error inesperado' }
    toast.error('Error durante el reset')
  } finally {
    resetting.value = false
  }
}

onMounted(() => {
  loadUsers()
  loadInvitations()
})
</script>

<template>
  <div class="p-6 max-w-5xl">
    <div class="mb-6">
      <h1 class="text-xl font-semibold text-text-primary">Panel de administración</h1>
      <p class="text-text-muted text-sm mt-0.5">Gestión de organizaciones, usuarios e invitaciones</p>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 mb-6 border-b border-border-base">
      <button
        @click="activeTab = 'users'"
        class="px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px"
        :class="activeTab === 'users'
          ? 'border-accent text-text-primary'
          : 'border-transparent text-text-muted hover:text-text-primary'"
      >
        Usuarios
        <span class="ml-1 text-xs text-text-muted">{{ users.length }}</span>
      </button>
      <button
        @click="activeTab = 'invitations'"
        class="px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px"
        :class="activeTab === 'invitations'
          ? 'border-accent text-text-primary'
          : 'border-transparent text-text-muted hover:text-text-primary'"
      >
        Invitaciones
        <span class="ml-1 text-xs text-text-muted">{{ pendingInvitations.length }}</span>
      </button>
      <button
        @click="activeTab = 'import'"
        class="px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px"
        :class="activeTab === 'import'
          ? 'border-accent text-text-primary'
          : 'border-transparent text-text-muted hover:text-text-primary'"
      >
        Importar
      </button>
      <button
        @click="activeTab = 'maintenance'"
        class="px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px"
        :class="activeTab === 'maintenance'
          ? 'border-danger text-danger'
          : 'border-transparent text-text-muted hover:text-text-primary'"
      >
        Mantenimiento
      </button>
    </div>

    <!-- Users tab -->
    <div v-if="activeTab === 'users'">
      <div v-if="usersLoading" class="py-12 text-center text-text-muted text-sm">Cargando usuarios...</div>
      <div v-else-if="users.length === 0" class="py-12 text-center text-text-muted text-sm">Sin usuarios aún.</div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border-base text-left">
              <th class="pb-2 pr-4 text-xs font-medium text-text-muted">Nombre</th>
              <th class="pb-2 pr-4 text-xs font-medium text-text-muted">Email</th>
              <th class="pb-2 pr-4 text-xs font-medium text-text-muted">Rol</th>
              <th class="pb-2 pr-4 text-xs font-medium text-text-muted">Último acceso</th>
              <th class="pb-2 text-xs font-medium text-text-muted">Activo</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-base">
            <tr v-for="user in users" :key="user.id" class="group">
              <td class="py-2.5 pr-4 text-text-primary font-medium">
                {{ user.displayName || '—' }}
                <span v-if="user.id === auth.user?.uid" class="ml-1 text-xs text-accent">(tú)</span>
              </td>
              <td class="py-2.5 pr-4 text-text-muted text-xs">{{ user.email || '—' }}</td>
              <td class="py-2.5 pr-4">
                <select
                  :value="user.role"
                  @change="updateUserRole(user.id, $event.target.value)"
                  :disabled="user.id === auth.user?.uid"
                  class="px-2 py-1 rounded border border-border-base bg-bg-base text-text-primary text-xs focus:outline-none focus:border-accent disabled:opacity-50"
                >
                  <option value="admin">Admin</option>
                  <option value="moderador">Moderador</option>
                  <option value="invitado">Invitado</option>
                </select>
              </td>
              <td class="py-2.5 pr-4 text-text-muted text-xs">{{ formatDate(user.lastSeen) }}</td>
              <td class="py-2.5">
                <button
                  @click="toggleUserActive(user)"
                  :disabled="user.id === auth.user?.uid"
                  class="px-2 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50"
                  :class="user.active !== false
                    ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-red-900/30 dark:hover:text-red-400'
                    : 'bg-red-100 text-red-700 hover:bg-green-100 hover:text-green-700 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-green-900/30 dark:hover:text-green-400'"
                >
                  {{ user.active !== false ? 'Activo' : 'Inactivo' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Invitations tab -->
    <div v-if="activeTab === 'invitations'" class="space-y-6">
      <!-- Admin generate form -->
      <div v-if="auth.isAdmin" class="bg-bg-surface border border-border-base rounded-xl p-4">
        <h3 class="text-sm font-semibold text-text-primary mb-3">Generar invitación</h3>
        <form @submit.prevent="generateInvitation" class="flex items-end gap-3 flex-wrap">
          <div class="flex-1 min-w-48">
            <label class="block text-xs text-text-muted mb-1">Email del invitado</label>
            <input
              v-model="inviteEmail"
              type="email"
              required
              placeholder="usuario@ejemplo.com"
              class="w-full px-3 py-2 rounded-lg border border-border-base bg-bg-base text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label class="block text-xs text-text-muted mb-1">Rol</label>
            <select
              v-model="inviteRole"
              class="px-3 py-2 rounded-lg border border-border-base bg-bg-base text-text-primary text-sm focus:outline-none focus:border-accent"
            >
              <option value="moderador">Moderador</option>
              <option value="invitado">Invitado</option>
            </select>
          </div>
          <button
            type="submit"
            :disabled="inviteSubmitting"
            class="px-4 py-2 rounded-lg bg-accent text-bg-base text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {{ inviteSubmitting ? 'Generando...' : 'Generar invitación' }}
          </button>
        </form>

        <!-- Generated link -->
        <div v-if="generatedLink" class="mt-4 p-3 bg-bg-surface-2 rounded-lg border border-border-base">
          <p class="text-xs text-text-muted mb-2">Enlace generado (válido por 7 días):</p>
          <div class="flex items-center gap-2">
            <code class="flex-1 text-xs text-accent bg-bg-base px-2 py-1.5 rounded border border-border-base break-all">
              {{ generatedLink }}
            </code>
            <button
              @click="copyLink"
              class="shrink-0 p-1.5 rounded-lg border border-border-base text-text-muted hover:text-accent hover:border-accent transition-colors"
            >
              <Check v-if="copiedLink" class="w-4 h-4 text-accent" />
              <Copy v-else class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Pending invitations list -->
      <div>
        <h3 class="text-sm font-semibold text-text-primary mb-3">
          Invitaciones pendientes
          <span class="text-text-muted font-normal ml-1">{{ pendingInvitations.length }}</span>
        </h3>

        <div v-if="invitationsLoading" class="text-text-muted text-sm py-4 text-center">Cargando...</div>
        <div v-else-if="pendingInvitations.length === 0" class="text-text-muted text-sm py-4 text-center">
          No hay invitaciones pendientes.
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="inv in pendingInvitations"
            :key="inv.id"
            class="flex items-center gap-3 bg-bg-surface border border-border-base rounded-lg px-4 py-2.5"
          >
            <div class="flex-1 min-w-0">
              <p class="text-sm text-text-primary">{{ inv.email }}</p>
              <p class="text-xs text-text-muted">
                Rol: {{ inv.role }} ·
                Creada: {{ formatDate(inv.createdAt) }} ·
                Expira: {{ formatDate(inv.expiresAt) }}
              </p>
            </div>
            <button
              @click="revokeInvitation(inv)"
              class="text-xs text-danger hover:underline shrink-0"
            >
              Revocar
            </button>
          </div>
        </div>
      </div>
    </div>
    <!-- Import tab -->
    <div v-if="activeTab === 'import'" class="space-y-5">
      <div class="bg-bg-surface border border-border-base rounded-xl p-4 space-y-3">
        <div>
          <h3 class="text-sm font-semibold text-text-primary">Importar oportunidades en lote</h3>
          <p class="text-xs text-text-muted mt-0.5">Pegá un array JSON. Las oportunidades se importarán con estado <strong>nueva</strong>.</p>
        </div>

        <!-- Example toggle -->
        <details class="group">
          <summary class="text-xs text-accent cursor-pointer select-none hover:underline">Ver formato de ejemplo</summary>
          <pre class="mt-2 p-3 bg-bg-base border border-border-base rounded-lg text-xs text-text-muted overflow-x-auto leading-relaxed">{{ IMPORT_EXAMPLE }}</pre>
        </details>

        <!-- Fields reference -->
        <div class="p-3 bg-bg-surface-2 rounded-lg border border-border-base text-xs text-text-muted space-y-1">
          <p class="font-medium text-text-primary mb-1.5">Campos disponibles</p>
          <p><span class="text-text-primary font-medium">Comunes:</span> title* · type* (fuente|convocatoria|grant|capacitacion|evento|red|linea_ayuda|beca) · description · url · tags (array o string separado por coma)</p>
          <p><span class="text-text-primary font-medium">fuente:</span> freq (semanal|mensual)</p>
          <p><span class="text-text-primary font-medium">convocatoria:</span> deadline (YYYY-MM-DD) · reminderDays · monto</p>
          <p><span class="text-text-primary font-medium">grant:</span> deadline · monto · quien_puede_aplicar</p>
          <p><span class="text-text-primary font-medium">capacitacion:</span> fecha (YYYY-MM-DD) · modalidad (virtual|presencial|hibrida) · dirigido_a</p>
          <p><span class="text-text-primary font-medium">evento:</span> fecha (YYYY-MM-DD) · modalidad (virtual|presencial|hibrida) · lugar · dirigido_a</p>
          <p><span class="text-text-primary font-medium">red:</span> como_unirse</p>
          <p><span class="text-text-primary font-medium">linea_ayuda:</span> respuesta_rapida (true/false) · como_acceder · disponibilidad · para_quien</p>
          <p><span class="text-text-primary font-medium">beca:</span> deadline (YYYY-MM-DD) · monto · duracion · quien_puede_aplicar</p>
        </div>

        <!-- Batch source -->
        <div>
          <label class="block text-xs font-medium text-text-muted mb-1">
            Fuente / lote <span class="font-normal">(opcional)</span>
          </label>
          <input
            v-model="importBatch"
            type="text"
            placeholder="Ej: Excel de Fernanda, marzo 2026"
            class="w-full px-3 py-2 rounded-lg border border-border-base bg-bg-base text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
          />
          <p class="mt-1 text-xs text-text-muted">
            Opcional. Todas las importaciones van a pendientes de aprobación.
          </p>
        </div>

        <textarea
          v-model="importJson"
          rows="12"
          class="w-full px-3 py-2.5 rounded-lg border border-border-base bg-bg-base text-text-primary text-xs font-mono placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors resize-y"
          placeholder='[&#10;  { "title": "...", "type": "fuente", ... },&#10;  { "title": "...", "type": "grant", ... }&#10;]'
        />

        <div class="flex items-center gap-3">
          <button
            @click="parseImport"
            :disabled="!importJson.trim()"
            class="px-4 py-2 rounded-lg border border-border-base bg-bg-surface text-text-primary text-sm hover:bg-bg-surface-2 transition-colors disabled:opacity-40"
          >
            Validar
          </button>
          <button
            v-if="importParsed.length && !importErrors.length"
            @click="runImport"
            :disabled="importing"
            class="px-4 py-2 rounded-lg bg-accent text-bg-base text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {{ importing ? 'Importando...' : `Importar ${importParsed.length} oportunidades` }}
          </button>
        </div>
      </div>

      <!-- Validation errors -->
      <div v-if="importErrors.length" class="p-4 bg-danger/10 border border-danger/30 rounded-xl space-y-1">
        <p class="text-sm font-medium text-danger mb-2">Errores de validación</p>
        <p v-for="err in importErrors" :key="err" class="text-xs text-danger">{{ err }}</p>
      </div>

      <!-- Import result -->
      <div v-if="importResult" class="p-4 rounded-xl border"
        :class="importResult.ok ? 'bg-green-100 border-green-300 dark:bg-green-900/10 dark:border-green-800/30' : 'bg-danger/10 border-danger/30'"
      >
        <p v-if="importResult.ok" class="text-sm text-green-700 dark:text-green-400 font-medium">
          ✓ {{ importResult.ok }} oportunidades importadas correctamente.
          <span v-if="importResult.pending"> Quedaron pendientes de aprobación — revisalas en la sección Pendientes.</span>
        </p>
        <p v-else class="text-sm text-danger">Error: {{ importResult.error }}</p>
      </div>

      <!-- Preview table -->
      <div v-if="importParsed.length" class="overflow-x-auto">
        <p class="text-xs text-text-muted mb-2">Vista previa - {{ importParsed.length }} registros listos para importar</p>
        <table class="w-full text-xs border border-border-base rounded-lg overflow-hidden">
          <thead class="bg-bg-surface-2">
            <tr class="text-left">
              <th class="px-3 py-2 text-text-muted font-medium">#</th>
              <th class="px-3 py-2 text-text-muted font-medium">Título</th>
              <th class="px-3 py-2 text-text-muted font-medium">Tipo</th>
              <th class="px-3 py-2 text-text-muted font-medium">Tags</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-base">
            <tr v-for="(item, i) in importParsed" :key="i" class="bg-bg-surface">
              <td class="px-3 py-2 text-text-muted">{{ i + 1 }}</td>
              <td class="px-3 py-2 text-text-primary font-medium max-w-xs truncate">{{ item.title }}</td>
              <td class="px-3 py-2 text-text-muted capitalize">{{ item.type }}</td>
              <td class="px-3 py-2 text-text-muted">{{ item.tags.join(', ') || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <!-- Maintenance tab -->
    <div v-if="activeTab === 'maintenance'" class="space-y-4 max-w-xl">
      <div class="p-4 bg-danger/5 border border-danger/30 rounded-xl space-y-3">
        <div>
          <h3 class="text-sm font-semibold text-danger">Reset para revisión inicial</h3>
          <p class="text-xs text-text-muted mt-1 leading-relaxed">
            Mueve <strong>todas las oportunidades aprobadas</strong> de vuelta a «Pendiente de aprobación»
            y elimina <strong>todas las listas personales y de organización</strong> (user_follows y org_follows).
            Útil para una revisión limpia antes del lanzamiento.
          </p>
          <ul class="mt-2 text-xs text-text-muted space-y-0.5 list-disc list-inside">
            <li>Las oportunidades quedan visibles solo para moderadores y admins.</li>
            <li>Los usuarios pierden su lista, estados y notas privadas.</li>
            <li>Esta acción <strong>no se puede deshacer</strong>.</li>
          </ul>
        </div>
        <button
          @click="showResetConfirm = true"
          :disabled="resetting"
          class="px-4 py-2 rounded-lg bg-danger text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {{ resetting ? 'Ejecutando...' : 'Resetear todo para revisión' }}
        </button>
        <div v-if="resetResult" class="p-3 rounded-lg border text-xs"
          :class="resetResult.ok
            ? 'bg-green-100 border-green-300 dark:bg-green-900/10 dark:border-green-800/30 text-green-700 dark:text-green-400'
            : 'bg-danger/10 border-danger/30 text-danger'"
        >
          <span v-if="resetResult.ok">
            ✓ {{ resetResult.opps }} oportunidades movidas a pendientes. Listas de usuarios borradas.
          </span>
          <span v-else>Error: {{ resetResult.error }}</span>
        </div>
      </div>
    </div>

    <AppConfirm
      :open="showResetConfirm"
      title="¿Resetear todo?"
      message="Esta acción moverá TODAS las oportunidades aprobadas a pendientes y borrará TODAS las listas de usuarios. No se puede deshacer."
      confirm-label="Sí, resetear"
      @confirm="runReset"
      @cancel="showResetConfirm = false"
    />

    <AppConfirm
      :open="!!confirmRevokeTarget"
      title="Revocar invitación"
      :message="confirmRevokeTarget ? `¿Revocar la invitación para ${confirmRevokeTarget.email}?` : ''"
      confirm-label="Revocar"
      @confirm="confirmRevoke"
      @cancel="confirmRevokeTarget = null"
    />
  </div>
</template>
