<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { usePersuratanStore } from '~/stores/persuratan'
import { useDokumenAsetStore } from '~/stores/dokumenAset'
import type { SuratDetail } from '#shared/types/Persuratan'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  success: [detail: SuratDetail]
}>()

const store = usePersuratanStore()
const dokumenStore = useDokumenAsetStore()
const toast = useToast()

const isSubmitting = ref(false)

const schema = z.object({
  tipe_surat_id: z.string().min(1, 'Tipe surat wajib dipilih'),
  tanggal: z.string().min(1, 'Tanggal wajib diisi'),
  keterangan: z.string().optional(),
  dokumen_aset_ids: z.array(z.string()).optional(),
})
type Schema = z.output<typeof schema>

const state = reactive<Schema>({
  tipe_surat_id: '',
  tanggal: '',
  keterangan: '',
  dokumen_aset_ids: [],
})

const tipeSuratOptions = computed(() =>
  store.tipeSuratList.map((t) => ({ label: `${t.kode} - ${t.nama}`, value: t.id })),
)

const dokumenOptions = computed(() =>
  dokumenStore.items.map((d) => ({
    label: d.judul,
    value: d.id,
    filename: d.filename,
  })),
)

function reset() {
  state.tipe_surat_id = ''
  state.tanggal = new Date().toISOString().slice(0, 10)
  state.keterangan = ''
  state.dokumen_aset_ids = []
}

watch(
  () => props.open,
  async (v) => {
    if (v) {
      reset()
      try {
        await Promise.all([
          store.fetchTipeSuratList(),
          dokumenStore.fetchList({ limit: 100 }),
        ])
      } catch {
        /* error in store */
      }
    }
  },
)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  isSubmitting.value = true
  try {
    const detail = await store.createSurat({
      tipe_surat_id: event.data.tipe_surat_id,
      tanggal: event.data.tanggal,
      keterangan: event.data.keterangan || undefined,
      dokumen_aset_ids: event.data.dokumen_aset_ids && event.data.dokumen_aset_ids.length > 0
        ? event.data.dokumen_aset_ids
        : undefined,
    })
    toast.add({ title: 'Surat berhasil dibuat', color: 'success' })
    emit('success', detail)
    emit('update:open', false)
  } catch {
    toast.add({ title: 'Gagal membuat surat', description: store.error ?? undefined, color: 'error' })
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
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Buat Surat</h3>
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
          <UFormField label="Tipe Surat" name="tipe_surat_id" required>
            <USelect
              v-model="state.tipe_surat_id"
              :items="tipeSuratOptions"
              placeholder="Pilih tipe surat"
              class="w-full"
              :ui="{ base: 'bg-gray-50 dark:bg-gray-800', value: 'text-gray-900 dark:text-gray-100' }"
            />
          </UFormField>

          <UFormField label="Tanggal" name="tanggal" required>
            <UInput v-model="state.tanggal" type="date" class="w-full" variant="subtle" />
          </UFormField>

          <UFormField label="Keterangan" name="keterangan">
            <UTextarea v-model="state.keterangan" class="w-full" variant="subtle" placeholder="Opsional" :rows="3" />
          </UFormField>

          <UFormField label="Dokumen Terkait" name="dokumen_aset_ids">
            <USelectMenu
              v-model="state.dokumen_aset_ids"
              :items="dokumenOptions"
              value-key="value"
              multiple
              search-input
              placeholder="Pilih dokumen aset (opsional)"
              class="w-full"
            />
            <template #help>
              <span class="text-xs text-gray-500 dark:text-gray-400">
                Tautkan dokumen aset seperti template atau hasil akhir surat.
              </span>
            </template>
          </UFormField>

          <div class="flex justify-end gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
            <UButton color="neutral" variant="outline" :disabled="isSubmitting" @click="emit('update:open', false)">
              Batal
            </UButton>
            <UButton type="submit" :loading="isSubmitting" color="primary" icon="i-lucide-plus">
              Buat Surat
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>
