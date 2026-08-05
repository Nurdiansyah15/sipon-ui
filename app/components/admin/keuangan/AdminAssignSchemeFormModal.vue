<script setup lang="ts">
import type { BillingScheme } from '#shared/types/Keuangan'
import type { SantriItem } from '#shared/types/Kesantrian'
import { useKeuanganStore } from '~/stores/keuangan'

const props = defineProps<{
  open: boolean
  schemes: BillingScheme[]
  santriList: SantriItem[]
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

const form = reactive({
  santri_id: '',
  billing_scheme_id: '',
  effective_from: '',
  effective_until: '',
})

watch(() => props.open, (val) => {
  if (val) {
    form.santri_id = ''
    form.billing_scheme_id = ''
    form.effective_from = ''
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
    toast.add({ title: 'Skema ditetapkan ke santri', color: 'success' })
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
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Tetapkan Skema ke Santri</h3>
          <UButton color="neutral" variant="ghost" icon="i-lucide-x" size="sm" square :disabled="saving" @click="close" />
        </div>

        <div class="space-y-4">
          <UFormField label="Santri" required>
            <USelectMenu
              v-model="form.santri_id"
              :items="santriOptions"
              value-key="value"
              placeholder="Cari nama atau NIS santri..."
              searchable
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
