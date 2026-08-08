<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { BillingScheme } from '#shared/types/Keuangan'
import { useKeuanganStore } from '~/stores/keuangan'

const props = defineProps<{
  open: boolean
  scheme?: BillingScheme | null
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  success: []
}>()

const store = useKeuanganStore()
const toast = useToast()

const isEdit = computed(() => !!props.scheme)

const schema = z.object({
  name: z.string().min(1, 'Nama skema wajib diisi'),
  description: z.string().optional(),
})

const form = reactive({
  name: '',
  description: '',
})

watch(() => props.open, (val) => {
  if (val) {
    if (props.scheme) {
      form.name = props.scheme.name
      form.description = props.scheme.description ?? ''
    } else {
      form.name = ''
      form.description = ''
    }
  }
})

const saving = ref(false)

async function onSubmit(_e: FormSubmitEvent<z.output<typeof schema>>) {
  saving.value = true
  try {
    if (isEdit.value && props.scheme) {
      await store.updateBillingScheme(props.scheme.id, {
        name: form.name,
        description: form.description || undefined,
      })
      toast.add({ title: 'Skema tagihan diperbarui', color: 'success' })
    } else {
      await store.createBillingScheme({
        name: form.name,
        description: form.description || undefined,
      })
      toast.add({ title: 'Skema tagihan dibuat', color: 'success' })
    }
    emit('update:open', false)
    emit('success')
  } catch {
    toast.add({ title: store.error ?? 'Gagal menyimpan skema tagihan', color: 'error' })
  } finally {
    saving.value = false
  }
}

function close() {
  if (saving.value) return
  emit('update:open', false)
}
</script>

<template>
  <UModal :open="open" :dismissible="!saving" @update:open="(v: boolean) => emit('update:open', v)">
    <template #content>
      <div class="p-6">
        <div class="mb-5 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {{ isEdit ? 'Edit Skema Tagihan' : 'Tambah Skema Tagihan' }}
          </h3>
          <UButton
            v-if="!saving"
            color="neutral"
            variant="ghost"
            icon="i-lucide-x"
            size="sm"
            square
            @click="close"
          />
        </div>

        <UForm :schema="schema" :state="form" class="space-y-4" @submit="onSubmit">
          <UFormField label="Nama" name="name" required>
            <UInput v-model="form.name" placeholder="Nama skema tagihan" variant="subtle" class="w-full" />
          </UFormField>
          <UFormField label="Deskripsi" name="description">
            <UTextarea v-model="form.description" placeholder="Deskripsi (opsional)" :rows="2" variant="subtle" class="w-full" />
          </UFormField>

          <div class="flex justify-end gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
            <UButton color="neutral" variant="outline" :disabled="saving" @click="close">
              Batal
            </UButton>
            <UButton type="submit" :loading="saving" color="primary">
              Simpan
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>
