<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useRolePermissionStore } from '~/stores/rolePermission'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  created: []
}>()

const store = useRolePermissionStore()
const toast = useToast()

const schema = z.object({
  name: z.string().min(1, 'Wajib diisi'),
  display_name: z.string().min(1, 'Wajib diisi'),
  description: z.string().optional(),
  role_type: z.enum(['custom']).refine((v) => v === 'custom', {
    message: 'Hanya role custom yang bisa dibuat via form ini',
  }),
  scope_type: z.enum(['global', 'region', 'community']),
  assignable: z.boolean().default(true),
})
type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  name: '',
  display_name: '',
  description: '',
  role_type: 'custom',
  scope_type: 'global',
  assignable: true,
})

const isSubmitting = ref(false)

function resetState() {
  state.name = ''
  state.display_name = ''
  state.description = ''
  state.role_type = 'custom'
  state.scope_type = 'global'
  state.assignable = true
}

watch(
  () => props.open,
  (open) => {
    if (open) resetState()
  },
)

function close() {
  emit('update:open', false)
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  isSubmitting.value = true
  try {
    await store.createRole({
      name: event.data.name,
      display_name: event.data.display_name,
      description: event.data.description || undefined,
      role_type: 'custom',
      scope_type: event.data.scope_type,
      assignable: !!event.data.assignable,
    })
    toast.add({ title: 'Role berhasil dibuat', color: 'success' })
    emit('created')
    close()
  } catch (err) {
    toast.add({
      title: 'Gagal membuat role',
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
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Buat Role Baru</h3>
          <UButton color="neutral" variant="ghost" icon="i-lucide-x" size="sm" square @click="close" />
        </div>

        <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
          <UFormField label="Nama Role (key)" name="name" required>
            <UInput v-model="state.name" class="w-full" variant="subtle" placeholder="operator_keuangan" />
          </UFormField>

          <UFormField label="Nama Tampilan" name="display_name" required>
            <UInput v-model="state.display_name" class="w-full" variant="subtle" placeholder="Operator Keuangan" />
          </UFormField>

          <UFormField label="Deskripsi" name="description">
            <UTextarea v-model="state.description" class="w-full" variant="subtle" :rows="3" />
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

          <UFormField name="assignable">
            <div class="flex items-center gap-2">
              <USwitch v-model="state.assignable" />
              <span class="text-sm text-gray-700 dark:text-gray-300">Boleh di-assign ke user</span>
            </div>
          </UFormField>

          <div class="flex justify-end gap-2 pt-2">
            <UButton color="neutral" variant="ghost" type="button" @click="close">Batal</UButton>
            <UButton type="submit" :loading="isSubmitting" icon="i-lucide-plus">Buat Role</UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>