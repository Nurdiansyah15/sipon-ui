<script setup lang="ts">
import type { BillingScheme, SantriBillingAssignment } from '#shared/types/Keuangan'
import type { SantriItem } from '#shared/types/Kesantrian'
import { useKeuanganStore } from '~/stores/keuangan'

const props = defineProps<{
  open: boolean
  schemes: BillingScheme[]
  santriList: SantriItem[]
  selectedSantri?: SantriItem | null
  currentAssignment?: SantriBillingAssignment | null
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  success: []
}>()

const store = useKeuanganStore()
const toast = useToast()

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

const form = reactive({
  santri_id: '',
  billing_scheme_id: '',
  effective_from: '',
  effective_until: '',
})

watch(() => props.open, (val) => {
  if (val) {
    form.santri_id = props.selectedSantri?.id ?? ''
    form.billing_scheme_id = ''
    form.effective_from = props.currentAssignment ? new Date().toISOString().slice(0, 10) : ''
    form.effective_until = ''
  }
})

const saving = ref(false)

async function save() {
  if (!form.santri_id) {
    toast.add({ title: 'Pilih santri', color: 'warning' })
    return
  }
  if (!form.billing_scheme_id) {
    toast.add({ title: 'Pilih skema tagihan', color: 'warning' })
    return
  }
  if (!form.effective_from) {
    toast.add({ title: 'Tanggal berlaku wajib diisi', color: 'warning' })
    return
  }

  saving.value = true
  try {
    await store.assignSchemeToSantri({
      santri_id: form.santri_id,
      billing_scheme_id: form.billing_scheme_id,
      effective_from: form.effective_from,
      effective_until: form.effective_until || undefined,
    })
    toast.add({ title: props.currentAssignment ? 'Skema santri berhasil diganti' : 'Skema ditetapkan ke santri', color: 'success' })
    emit('update:open', false)
    emit('success')
  } catch {
    toast.add({ title: store.error ?? 'Gagal menetapkan skema', color: 'error' })
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
            {{ currentAssignment ? 'Ganti Skema Santri' : 'Tetapkan Skema ke Santri' }}
          </h3>
          <UButton color="neutral" variant="ghost" icon="i-lucide-x" size="sm" square :disabled="saving" @click="close" />
        </div>

        <div
          v-if="currentAssignment"
          class="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-300"
        >
          Santri ini sedang memiliki skema <strong>{{ currentSchemeName }}</strong> (berlaku sejak {{ formatDate(currentAssignment.effective_from) }}).
          Menyimpan skema baru akan mengakhiri skema ini pada tanggal sebelum tanggal berlaku baru.
        </div>

        <div class="space-y-4">
          <UFormField label="Santri" required>
            <USelectMenu
              v-model="form.santri_id"
              :items="santriOptions"
              value-key="value"
              placeholder="Cari nama atau NIS santri..."
              searchable
              :disabled="!!selectedSantri"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Skema Tagihan" required>
            <USelect v-model="form.billing_scheme_id" :items="schemeOptions" placeholder="Pilih skema" />
          </UFormField>
          <UFormField label="Tanggal Berlaku" required>
            <UInput v-model="form.effective_from" type="date" />
          </UFormField>
          <UFormField label="Tanggal Berakhir" :hint="`Kosongkan jika tidak ada batas`">
            <UInput v-model="form.effective_until" type="date" />
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
