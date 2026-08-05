<script setup lang="ts">
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

async function save() {
  if (!form.name.trim()) {
    toast.add({ title: 'Nama skema wajib diisi', color: 'warning' })
    return
  }

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
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {{ isEdit ? 'Edit Skema Tagihan' : 'Tambah Skema Tagihan' }}
          </h3>
          <UButton color="neutral" variant="ghost" icon="i-lucide-x" size="sm" square :disabled="saving" @click="close" />
        </div>

        <div class="space-y-4">
          <UFormField label="Nama" required>
            <UInput v-model="form.name" placeholder="Nama skema tagihan" />
          </UFormField>
          <UFormField label="Deskripsi">
            <UTextarea v-model="form.description" placeholder="Deskripsi (opsional)" :rows="2" />
          </UFormField>
        </div>

        <div class="mt-6 flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" :disabled="saving" @click="close">Batal</UButton>
          <UButton color="primary" :loading="saving" @click="save">Simpan</UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
