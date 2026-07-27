<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent, DropdownMenuItem } from '@nuxt/ui'
import { useRolePermissionStore } from '~/stores/rolePermission'

const props = defineProps<{
  open: boolean
  targetUserId: string
  targetUserName: string
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  assigned: []
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

watch(
  () => props.open,
  (open) => {
    if (open) {
      state.role_id = ''
      state.scope_type = 'global'
      state.expired_at = ''
      if (store.roles.length === 0) {
        store.fetchRoles({ limit: 100 }).catch(() => {})
      }
    }
  },
)

function close() {
  emit('update:open', false)
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
    toast.add({ title: 'Role berhasil ditetapkan', color: 'success' })
    emit('assigned')
    close()
  } catch (err) {
    toast.add({
      title: 'Gagal menetapkan role',
      description: store.error ?? undefined,
      color: 'error',
    })
  } finally {
    isSubmitting.value = false
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
          Menetapkan role untuk user <strong class="text-gray-900">{{ targetUserName }}</strong>.
        </p>

        <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
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

          <div class="flex justify-end gap-2 pt-2">
            <UButton color="neutral" variant="ghost" type="button" @click="close">Batal</UButton>
            <UButton type="submit" :loading="isSubmitting" icon="i-lucide-plus">Tetapkan Role</UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>