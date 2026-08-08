<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
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

const schema = z.object({
  fee_component_id: z.string().min(1, 'Pilih komponen biaya'),
  amount_override: z.number().nullable(),
  is_required: z.boolean(),
  sort_order: z.number(),
})

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

async function onSubmit(_e: FormSubmitEvent<z.output<typeof schema>>) {
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
        <div class="mb-5 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Tambah Item Skema</h3>
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
          <UFormField label="Komponen Biaya" name="fee_component_id" required>
            <USelect v-model="form.fee_component_id" :items="componentOptions" placeholder="Pilih komponen" variant="subtle" class="w-full" />
          </UFormField>
          <UFormField label="Override Jumlah (Rp)" name="amount_override" :hint="`Kosongkan untuk pakai nilai default`">
            <UInput v-model.number="form.amount_override" type="number" placeholder="Opsional" :min="0" variant="subtle" class="w-full" />
          </UFormField>
          <UFormField label="Wajib Bayar">
            <USwitch v-model="form.is_required" class="mb-1" />
          </UFormField>
          <UFormField label="Urutan" name="sort_order">
            <UInput v-model.number="form.sort_order" type="number" placeholder="0" :min="0" variant="subtle" class="w-full" />
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
