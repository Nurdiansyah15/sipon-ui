<script setup lang="ts">
import type { FeeComponent } from '#shared/types/Keuangan'
import { useKeuanganStore } from '~/stores/keuangan'

const props = defineProps<{
  open: boolean
  schemeId: string
  components: FeeComponent[]
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  success: []
}>()

const store = useKeuanganStore()
const toast = useToast()

const form = reactive({
  fee_component_id: '',
  amount_override: null as number | null,
  is_required: true,
  sort_order: 0,
})

watch(() => props.open, (val) => {
  if (val) {
    form.fee_component_id = ''
    form.amount_override = null
    form.is_required = true
    form.sort_order = 0
  }
})

const componentOptions = computed(() =>
  props.components.map((c) => ({
    label: `${c.code} — ${c.name}`,
    value: c.id,
  })),
)

const saving = ref(false)

async function save() {
  if (!form.fee_component_id) {
    toast.add({ title: 'Pilih komponen biaya', color: 'warning' })
    return
  }

  saving.value = true
  try {
    await store.addSchemeItem(props.schemeId, {
      fee_component_id: form.fee_component_id,
      amount_override: form.amount_override ?? undefined,
      is_required: form.is_required,
      sort_order: form.sort_order,
    })
    toast.add({ title: 'Item skema ditambahkan', color: 'success' })
    emit('update:open', false)
    emit('success')
  } catch {
    toast.add({ title: store.error ?? 'Gagal menambahkan item skema', color: 'error' })
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
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Tambah Item Skema</h3>
          <UButton color="neutral" variant="ghost" icon="i-lucide-x" size="sm" square :disabled="saving" @click="close" />
        </div>

        <div class="space-y-4">
          <UFormField label="Komponen Biaya" required>
            <USelect v-model="form.fee_component_id" :items="componentOptions" placeholder="Pilih komponen" />
          </UFormField>
          <UFormField label="Override Jumlah (Rp)" :hint="`Kosongkan untuk pakai nilai default`">
            <UInput v-model.number="form.amount_override" type="number" placeholder="Opsional" :min="0" />
          </UFormField>
          <UFormField label="Wajib Bayar">
            <USwitch v-model="form.is_required" class="mb-1" />
          </UFormField>
          <UFormField label="Urutan">
            <UInput v-model.number="form.sort_order" type="number" placeholder="0" :min="0" />
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
