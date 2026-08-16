<script setup lang="ts">
import { useRolePermissionStore } from '~/stores/rolePermission'
import { useScopeStore } from '~/stores/scope'
import type { RoleScope } from '#shared/types/RolePermission'
import type { ScopeItem } from '#shared/types/Scope'

const props = defineProps<{
  open: boolean
  roleId: string
  roleName: string
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  updated: []
}>()

const store = useRolePermissionStore()
const scopeStore = useScopeStore()
const toast = useToast()

const isLoading = ref(false)
const scopes = ref<RoleScope[]>([])
const isSubmitting = ref(false)

// Master scope sebagai sumber kebenaran tunggal — opsi tipe/nilai diambil dari
// API master scope (module identity), bukan hardcoded di UI.
const masterScopes = ref<ScopeItem[]>([])
const scopeTypes = computed(() => {
  const seen = new Map<string, string>()
  for (const s of masterScopes.value) {
    if (!seen.has(s.scope_type)) seen.set(s.scope_type, s.scope_type)
  }
  return Array.from(seen.entries()).map(([value, key]) => ({ label: key, value }))
})
const scopeValues = computed<Record<string, { label: string; value: string }[]>>(() => {
  const grouped: Record<string, { label: string; value: string }[]> = {}
  for (const s of masterScopes.value) {
    if (!grouped[s.scope_type]) grouped[s.scope_type] = []
    grouped[s.scope_type].push({ label: s.name, value: s.code })
  }
  return grouped
})

const selectedScopeType = ref('')
const selectedScopeValue = ref('')

function close() {
  emit('update:open', false)
}

watch(
  () => props.open,
  async (open) => {
    if (open && props.roleId) {
      await loadMasterScopes()
      selectedScopeType.value = scopeTypes.value[0]?.value ?? ''
      selectedScopeValue.value = scopeValues.value[selectedScopeType.value]?.[0]?.value ?? ''
      await loadScopes()
    }
  },
)

async function loadMasterScopes() {
  try {
    masterScopes.value = await scopeStore.fetchList({ include_inactive: true })
  } catch {
    masterScopes.value = []
  }
}

watch(selectedScopeType, (type) => {
  selectedScopeValue.value = scopeValues.value[type]?.[0]?.value ?? ''
})

async function loadScopes() {
  isLoading.value = true
  try {
    scopes.value = await store.fetchRoleScopes(props.roleId)
  } catch {
    scopes.value = []
  } finally {
    isLoading.value = false
  }
}

async function addScope() {
  isSubmitting.value = true
  try {
    await store.assignRoleScope(props.roleId, selectedScopeType.value, selectedScopeValue.value)
    toast.add({ title: 'Scope berhasil ditambahkan', color: 'success' })
    await loadScopes()
    emit('updated')
  } catch (err) {
    toast.add({
      title: 'Gagal menambah scope',
      description: store.error ?? undefined,
      color: 'error',
    })
  } finally {
    isSubmitting.value = false
  }
}

async function removeScope(scopeId: string) {
  isSubmitting.value = true
  try {
    await store.removeRoleScope(props.roleId, scopeId)
    toast.add({ title: 'Scope berhasil dihapus', color: 'success' })
    await loadScopes()
    emit('updated')
  } catch (err) {
    toast.add({
      title: 'Gagal menghapus scope',
      description: store.error ?? undefined,
      color: 'error',
    })
  } finally {
    isSubmitting.value = false
  }
}

function scopeLabel(type: string, value: string): string {
  const m = masterScopes.value.find((s) => s.scope_type === type && s.code === value)
  return m?.name ?? value
}
</script>

<template>
  <UModal :open="open" @update:open="(v: boolean) => emit('update:open', v)">
    <template #content>
      <div class="p-6">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Kelola Scope — {{ roleName }}
          </h3>
          <UButton color="neutral" variant="ghost" icon="i-lucide-x" size="sm" square @click="close" />
        </div>

        <div v-if="isLoading" class="flex justify-center py-4">
          <UIcon name="i-lucide-loader-2" class="h-5 w-5 animate-spin text-gray-400" />
        </div>

        <div v-else class="space-y-3">
          <div v-if="scopes.length === 0" class="py-2 text-center text-sm text-gray-500 dark:text-gray-400">
            Belum ada scope pada role ini.
          </div>
          <div
            v-for="s in scopes"
            :key="s.id"
            class="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700"
          >
            <div class="flex items-center gap-2">
              <UBadge variant="subtle" color="neutral" size="sm">{{ s.scope_type }}</UBadge>
              <span class="text-sm text-gray-900 dark:text-gray-100">{{ scopeLabel(s.scope_type, s.scope_value) }}</span>
            </div>
            <UButton
              variant="ghost"
              size="xs"
              icon="i-lucide-x"
              color="error"
              :disabled="isSubmitting"
              @click="removeScope(s.id)"
            />
          </div>
        </div>

        <div class="mt-5 border-t border-gray-200 pt-4 dark:border-gray-700">
          <p class="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Tambah Scope</p>
          <div class="flex items-end gap-2">
            <div class="flex-1">
              <p class="mb-1 text-xs text-gray-500 dark:text-gray-400">Tipe</p>
              <USelect v-model="selectedScopeType" :items="scopeTypes" class="w-full" />
            </div>
            <div class="flex-1">
              <p class="mb-1 text-xs text-gray-500 dark:text-gray-400">Nilai</p>
              <USelect
                v-model="selectedScopeValue"
                :items="scopeValues[selectedScopeType] ?? []"
                class="w-full"
              />
            </div>
            <UButton :loading="isSubmitting" icon="i-lucide-plus" size="sm" @click="addScope">
              Tambah
            </UButton>
          </div>
        </div>

        <div class="mt-4 flex justify-end">
          <UButton color="neutral" variant="ghost" @click="close">Tutup</UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
