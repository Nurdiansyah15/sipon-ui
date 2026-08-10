<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { usePersuratanStore } from '~/stores/persuratan'
import type { TipeSuratItem } from '#shared/types/Persuratan'

const props = defineProps<{
  open: boolean
  tipeSurat?: TipeSuratItem | null
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  success: []
}>()

const store = usePersuratanStore()
const toast = useToast()

const isSubmitting = ref(false)

const schema = z.object({
  nama: z.string().min(1, 'Nama wajib diisi'),
  kode: z
    .string()
    .min(1, 'Kode wajib diisi')
    .max(20, 'Kode maksimal 20 karakter')
    .regex(/^[A-Za-z0-9-]+$/, 'Kode hanya boleh huruf, angka, dan tanda hubung'),
})
type Schema = z.output<typeof schema>

const state = reactive<Schema>({ nama: '', kode: '' })

function reset() {
  state.nama = props.tipeSurat?.nama ?? ''
  state.kode = props.tipeSurat?.kode ?? ''
}

watch(
  () => props.open,
  (v) => {
    if (v) reset()
  },
)

async function onSubmit(_event: FormSubmitEvent<Schema>) {
  isSubmitting.value = true
  try {
    if (props.tipeSurat) {
      await store.updateTipeSurat(props.tipeSurat.id, {
        nama: state.nama,
        kode: state.kode,
      })
      toast.add({ title: 'Tipe surat berhasil diperbarui', color: 'success' })
    } else {
      await store.createTipeSurat({
        nama: state.nama,
        kode: state.kode,
      })
      toast.add({ title: 'Tipe surat berhasil dibuat', color: 'success' })
    }
    emit('success')
    emit('update:open', false)
  } catch {
    toast.add({ title: 'Gagal menyimpan tipe surat', description: store.error ?? undefined, color: 'error' })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <UModal :open="open" :dismissible="!isSubmitting" @update:open="(v: boolean) => !isSubmitting && emit('update:open', v)">
    <template #content>
      <div class="p-6">
        <div class="mb-5 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {{ tipeSurat ? 'Edit Tipe Surat' : 'Buat Tipe Surat' }}
          </h3>
          <UButton
            v-if="!isSubmitting"
            color="neutral"
            variant="ghost"
            icon="i-lucide-x"
            size="sm"
            square
            @click="emit('update:open', false)"
          />
        </div>

        <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
          <UFormField label="Nama" name="nama" required>
            <UInput v-model="state.nama" placeholder="cth: Surat Keterangan Aktif" variant="subtle" class="w-full" />
          </UFormField>

          <UFormField label="Kode" name="kode" required>
            <UInput
              v-model="state.kode"
              placeholder="cth: SKA"
              variant="subtle"
              class="w-full"
              :ui="{ base: 'uppercase' }"
            />
            <template #help>
              <span class="text-xs text-gray-500 dark:text-gray-400">
                Kode singkat yang dipakai pada nomor surat. Tidak bisa diubah jika tipe sudah dipakai surat.
              </span>
            </template>
          </UFormField>

          <div class="flex justify-end gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
            <UButton color="neutral" variant="outline" :disabled="isSubmitting" @click="emit('update:open', false)">
              Batal
            </UButton>
            <UButton type="submit" :loading="isSubmitting" color="primary">
              {{ tipeSurat ? 'Simpan Perubahan' : 'Buat Tipe Surat' }}
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>
