<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent, DropdownMenuItem } from '@nuxt/ui'
import { useRolePermissionStore } from '~/stores/rolePermission'
import type { UserRoleItem } from '#shared/types/RolePermission'

const props = defineProps<{
  open: boolean
  targetUserId: string
  targetUserName: string
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  updated: []
}>()

const store = useRolePermissionStore()
const toast = useToast()

const schema = z.object({
  role_id: z.string().min(1, 'Role wajib dipilih'),
  scope_type: z.enum(['global', 'region', 'community']),
  expired_at: z.string().optional(),
})
type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  role_id: '',
  scope_type: 'global',
  expired_at: '',
})

const isSubmitting = ref(false)
const currentRoles = ref<UserRoleItem[]>([])
const isLoadingRoles = ref(false)
const isDeleting = ref<string | null>(null)

watch(
  () => props.open,
  async (open) => {
    if (open) {
      state.role_id = ''
      state.scope_type = 'global'
      state.expired_at = ''
      await loadRoles()
      if (store.roles.length === 0) {
        store.fetchRoles({ limit: 100 }).catch(() => {})
      }
    }
  },
)

async function loadRoles() {
  isLoadingRoles.value = true
  try {
    currentRoles.value = await store.fetchUserRoles({
      user_id: props.targetUserId,
      limit: 50,
    })
  } catch {
    currentRoles.value = []
  } finally {
    isLoadingRoles.value = false
  }
}

function close() {
  emit('update:open', false)
}

async function handleDelete(assignment: UserRoleItem) {
  isDeleting.value = assignment.id
  try {
    await store.deleteUserRole(assignment.id)
    currentRoles.value = currentRoles.value.filter((r) => r.id !== assignment.id)
    toast.add({ title: 'Role berhasil dihapus', color: 'success' })
    emit('updated')
  } catch {
    toast.add({
      title: 'Gagal menghapus role',
      description: store.error ?? undefined,
      color: 'error',
    })
  } finally {
    isDeleting.value = null
  }
}

const roleOptions = computed<DropdownMenuItem[]>(() =>
  store.roles
    .filter((r) => r.assignable)
    .map((r) => ({ label: `${r.display_name} (${r.name})`, value: r.id })),
)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  isSubmitting.value = true
  try {
    await store.assignUserRole({
      user_id: props.targetUserId,
      role_id: event.data.role_id,
      scope_type: event.data.scope_type,
      expired_at: event.data.expired_at ? new Date(event.data.expired_at).toISOString() : null,
    })
    toast.add({ title: 'Role berhasil ditambahkan', color: 'success' })
    state.role_id = ''
    state.scope_type = 'global'
    state.expired_at = ''
    await loadRoles()
    emit('updated')
  } catch (err) {
    toast.add({
      title: 'Gagal menambahkan role',
      description: store.error ?? undefined,
      color: 'error',
    })
  } finally {
    isSubmitting.value = false
  }
}

function scopeBadgeColor(scopeType: string) {
  if (scopeType === 'global') return 'info'
  if (scopeType === 'region') return 'warning'
  return 'neutral'
}

function formatDate(value?: string | null) {
  if (!value) return null
  try {
    return new Date(value).toLocaleDateString('id-ID')
  } catch {
    return value
  }
}
</script>

<template>
  <UModal
    :open="open"
    @update:open="(v: boolean) => emit('update:open', v)"
  >
    <template #content>
      <div class="p-6">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">Kelola Role User</h3>
          <UButton color="neutral" variant="ghost" icon="i-lucide-x" size="sm" square @click="close" />
        </div>

        <p class="mb-4 text-sm text-gray-500">
          Role untuk <strong class="text-gray-900">{{ targetUserName }}</strong>.
        </p>

        <!-- Current roles -->
        <div class="mb-6">
          <h4 class="mb-2 text-sm font-medium text-gray-700">Role Saat Ini</h4>
          <div v-if="isLoadingRoles" class="py-4 text-center text-sm text-gray-500">
            Memuat...
          </div>
          <div
            v-else-if="currentRoles.length === 0"
            class="rounded-lg border border-dashed border-gray-300 py-4 text-center text-sm text-gray-500"
          >
            Belum ada role.
          </div>
          <div v-else class="divide-y rounded-lg border border-gray-200">
            <div
              v-for="assignment in currentRoles"
              :key="assignment.id"
              class="flex items-center justify-between px-3 py-2.5"
            >
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-gray-900">{{ assignment.role.display_name }}</span>
                <UBadge :color="assignment.is_active ? 'success' : 'neutral'" variant="subtle" size="xs">
                  {{ assignment.is_active ? 'Aktif' : 'Nonaktif' }}
                </UBadge>
                <UBadge :color="scopeBadgeColor(assignment.scope_type)" variant="subtle" size="xs">
                  {{ assignment.scope_type }}
                </UBadge>
                <span v-if="assignment.expired_at" class="text-xs text-gray-500">
                  s.d. {{ formatDate(assignment.expired_at) }}
                </span>
              </div>
              <UButton
                color="error"
                variant="ghost"
                icon="i-lucide-trash-2"
                size="xs"
                square
                :loading="isDeleting === assignment.id"
                @click="handleDelete(assignment)"
              />
            </div>
          </div>
        </div>

        <!-- Add role form -->
        <div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h4 class="mb-3 text-sm font-medium text-gray-700">Tambah Role</h4>
          <UForm :schema="schema" :state="state" class="space-y-3" @submit="onSubmit">
            <UFormField label="Role" name="role_id" required>
              <USelectMenu
                v-model="state.role_id"
                class="w-full"
                variant="subtle"
                :items="roleOptions"
                value-key="value"
                placeholder="Pilih role"
              />
            </UFormField>

            <UFormField label="Scope" name="scope_type" required>
              <USelect
                v-model="state.scope_type"
                class="w-full"
                variant="subtle"
                :items="[
                  { label: 'Global', value: 'global' },
                  { label: 'Region', value: 'region' },
                  { label: 'Community', value: 'community' },
                ]"
              />
            </UFormField>

            <UFormField label="Kedaluwarsa (opsional)" name="expired_at">
              <UInput v-model="state.expired_at" type="datetime-local" class="w-full" variant="subtle" />
            </UFormField>

            <div class="flex justify-end gap-2 pt-1">
              <UButton color="neutral" variant="ghost" type="button" @click="close">Selesai</UButton>
              <UButton type="submit" :loading="isSubmitting" icon="i-lucide-plus">Tambah Role</UButton>
            </div>
          </UForm>
        </div>
      </div>
    </template>
  </UModal>
</template>
