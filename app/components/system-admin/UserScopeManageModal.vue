<script setup lang="ts">
import { useUserManagementStore } from '~/stores/userManagement'
import type { UserScope } from '#shared/types/UserManagement'

const props = defineProps<{
  open: boolean
  targetUserId: string
  targetUserName: string
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  updated: []
}>()

const store = useUserManagementStore()
const toast = useToast()

const isLoading = ref(false)
const scopes = ref<UserScope[]>([])
const isSubmitting = ref(false)

const scopeTypes = [
  { label: 'Gender', value: 'gender' },
]
const scopeValues = {
  gender: [
    { label: 'Putra (Male)', value: 'male' },
    { label: 'Putri (Female)', value: 'female' },
  ],
}

const selectedScopeType = ref('gender')
const selectedScopeValue = ref('male')

function close() {
  emit('update:open', false)
}

watch(
  () => props.open,
  async (open) => {
    if (open && props.targetUserId) {
      selectedScopeType.value = 'gender'
      selectedScopeValue.value = 'male'
      await loadScopes()
    }
  },
)

async function loadScopes() {
  isLoading.value = true
  try {
    scopes.value = await store.fetchUserScopes(props.targetUserId)
  } catch {
    scopes.value = []
  } finally {
    isLoading.value = false
  }
}

async function addScope() {
  isSubmitting.value = true
  try {
    await store.assignUserScope(props.targetUserId, selectedScopeType.value, selectedScopeValue.value)
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
    await store.removeUserScope(props.targetUserId, scopeId)
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
  if (type === 'gender') return value === 'male' ? 'Putra' : 'Putri'
  return value
}
</script>

<template>
  <UModal :open="open" @update:open="(v: boolean) => emit('update:open', v)">
    <template #content>
      <div class="p-6">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Kelola Scope — {{ targetUserName }}
          </h3>
          <UButton color="neutral" variant="ghost" icon="i-lucide-x" size="sm" square @click="close" />
        </div>

        <!-- Current scopes -->
        <div v-if="isLoading" class="flex justify-center py-4">
          <UIcon name="i-lucide-loader-2" class="h-5 w-5 animate-spin text-gray-400" />
        </div>

        <div v-else class="space-y-3">
          <div v-if="scopes.length === 0" class="py-2 text-center text-sm text-gray-500 dark:text-gray-400">
            Belum ada scope yang di-assign.
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

        <!-- Add scope form -->
        <div class="mt-5 border-t border-gray-200 pt-4 dark:border-gray-700">
          <p class="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Tambah Scope Baru</p>
          <div class="flex items-end gap-2">
            <div class="flex-1">
              <p class="mb-1 text-xs text-gray-500 dark:text-gray-400">Tipe</p>
              <USelect
                v-model="selectedScopeType"
                :items="scopeTypes"
                class="w-full"
              />
            </div>
            <div class="flex-1">
              <p class="mb-1 text-xs text-gray-500 dark:text-gray-400">Nilai</p>
              <USelect
                v-model="selectedScopeValue"
                :items="scopeValues[selectedScopeType as keyof typeof scopeValues] ?? []"
                class="w-full"
              />
            </div>
            <UButton
              :loading="isSubmitting"
              icon="i-lucide-plus"
              size="sm"
              @click="addScope"
            >
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
