<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { BillingScheme, SantriBillingAssignment } from '#shared/types/Keuangan'
import type { SantriItem } from '#shared/types/Kesantrian'
import { useKeuanganStore } from '~/stores/keuangan'

const props = defineProps<{
  open: boolean
  schemes: BillingScheme[]
  santriList: SantriItem[]
  selectedSantri?: SantriItem | null
  currentAssignment?: SantriBillingAssignment | null
  mode?: 'edit' | 'create'
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  success: []
}>()

const store = useKeuanganStore()
const toast = useToast()

const mode = computed(() => props.mode ?? (props.currentAssignment ? 'edit' : 'create'))
const isEdit = computed(() => mode.value === 'edit')

const santriOptions = computed(() =>
  props.santriList.map((s) => ({
    label: s.fullname ? `${s.fullname}${s.nis ? ` (${s.nis})` : ''}` : s.nis ?? s.username,
    value: s.id,
  })),
)

const schemeOptions = computed(() =>
  props.schemes
    .filter((s) => s.is_active)
    .map((s) => ({ label: s.name, value: s.id })),
)

const currentSchemeName = computed(() => {
  if (!props.currentAssignment) return null
  return props.schemes.find((s) => s.id === props.currentAssignment!.billing_scheme_id)?.name ?? 'skema tidak ditemukan'
})

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

const schema = z.object({
  santri_id: z.string().min(1, 'Pilih santri'),
  billing_scheme_id: z.string().min(1, 'Pilih skema tagihan'),
  effective_from: z.string().min(1, 'Tanggal berlaku wajib diisi'),
  effective_until: z.string().optional(),
})

const form = reactive({
  santri_id: '',
  billing_scheme_id: '',
  effective_from: '',
  effective_until: '',
})

watch(() => props.open, (val) => {
  if (val) {
    form.santri_id = props.selectedSantri?.id ?? ''
    if (isEdit.value && props.currentAssignment) {
      form.billing_scheme_id = props.currentAssignment.billing_scheme_id
      form.effective_from = props.currentAssignment.effective_from
      form.effective_until = props.currentAssignment.effective_until ?? ''
    } else {
      form.billing_scheme_id = ''
      form.effective_from = props.currentAssignment ? new Date().toISOString().slice(0, 10) : ''
      form.effective_until = ''
    }
  }
})

const saving = ref(false)

async function onSubmit(_e: FormSubmitEvent<z.output<typeof schema>>) {
  saving.value = true
  try {
    if (isEdit.value && props.currentAssignment) {
      await store.updateAssignment(props.currentAssignment.id, {
        billing_scheme_id: form.billing_scheme_id,
        effective_from: form.effective_from,
        effective_until: form.effective_until || undefined,
      })
      toast.add({ title: 'Skema aktif santri diperbarui', color: 'success' })
    } else {
      await store.assignSchemeToSantri({
        santri_id: form.santri_id,
        billing_scheme_id: form.billing_scheme_id,
        effective_from: form.effective_from,
        effective_until: form.effective_until || undefined,
      })
      toast.add({ title: props.currentAssignment ? 'Skema baru ditetapkan, skema lama berakhir' : 'Skema ditetapkan ke santri', color: 'success' })
    }
    emit('update:open', false)
    emit('success')
  } catch {
    toast.add({ title: store.error ?? 'Gagal menyimpan skema', color: 'error' })
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
            {{ isEdit ? 'Edit Skema Santri' : 'Tetapkan Skema ke Santri' }}
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

        <div
          v-if="isEdit && currentAssignment"
          class="mb-4 rounded-lg border border-teal-200 bg-teal-50 p-3 text-sm text-teal-800 dark:border-teal-900/50 dark:bg-teal-900/20 dark:text-teal-300"
        >
          Mengedit skema aktif <strong>{{ currentSchemeName }}</strong> (berlaku sejak {{ formatDate(currentAssignment.effective_from) }}).
          Perubahan hanya berlaku untuk tagihan yang dibuat setelahnya — invoice lama yang sudah terbit tidak berubah.
        </div>

        <div
          v-else-if="currentAssignment"
          class="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-300"
        >
          Santri ini sedang memiliki skema <strong>{{ currentSchemeName }}</strong> (berlaku sejak {{ formatDate(currentAssignment.effective_from) }}).
          Menetapkan skema baru akan mengakhiri skema ini pada tanggal sebelum tanggal berlaku baru.
        </div>

        <UForm :schema="schema" :state="form" class="space-y-4" @submit="onSubmit">
          <UFormField label="Santri" name="santri_id" required>
            <USelectMenu
              v-model="form.santri_id"
              :items="santriOptions"
              value-key="value"
              placeholder="Cari nama atau NIS santri..."
              searchable
              :disabled="!!selectedSantri"
              variant="subtle"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Skema Tagihan" name="billing_scheme_id" required>
            <USelect v-model="form.billing_scheme_id" :items="schemeOptions" placeholder="Pilih skema" variant="subtle" class="w-full" />
          </UFormField>
          <UFormField label="Tanggal Berlaku" name="effective_from" required>
            <UInput v-model="form.effective_from" type="date" variant="subtle" class="w-full" />
          </UFormField>
          <UFormField label="Tanggal Berakhir" name="effective_until" :hint="`Kosongkan jika tidak ada batas`">
            <UInput v-model="form.effective_until" type="date" variant="subtle" class="w-full" />
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
