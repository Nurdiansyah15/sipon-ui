<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { TableColumn } from '@nuxt/ui'
import { useKeuanganStore } from '~/stores/keuangan'
import type { BillingBatch } from '#shared/types/Keuangan'

definePageMeta({ layout: 'keuangan' })

const store = useKeuanganStore()
const toast = useToast()

const schema = z.object({
  billing_scheme_id: z.string().min(1, 'Skema tagihan wajib dipilih'),
  billing_period_id: z.string().min(1, 'Periode tagihan wajib dipilih'),
  issued_date: z.string().min(1, 'Tanggal terbit wajib diisi'),
  due_date: z.string().min(1, 'Tanggal jatuh tempo wajib diisi'),
})
type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  billing_scheme_id: '',
  billing_period_id: '',
  issued_date: '',
  due_date: '',
})

const confirmOpen = ref(false)
const isGenerating = ref(false)

const schemeOptions = computed(() =>
  store.billingSchemes
    .filter((s) => s.is_active)
    .map((s) => ({
      label: s.name,
      value: s.id,
    })),
)

const selectedScheme = computed(() =>
  store.billingSchemes.find((s) => s.id === state.billing_scheme_id),
)

const billingPeriodOptions = computed(() =>
  store.billingPeriods.map((p) => ({
    label: p.name,
    value: p.id,
  })),
)

const batchStatusLabel: Record<BillingBatch['status'], string> = {
  processing: 'Diproses',
  completed: 'Selesai',
  failed: 'Gagal',
}

const batchStatusColor: Record<BillingBatch['status'], 'warning' | 'success' | 'error'> = {
  processing: 'warning',
  completed: 'success',
  failed: 'error',
}

const historyColumns: TableColumn<BillingBatch>[] = [
  { accessorKey: 'name', header: 'Batch' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'total_created', header: 'Dibuat' },
  { accessorKey: 'total_skipped', header: 'Dilewati' },
  { accessorKey: 'total_error', header: 'Error' },
  { accessorKey: 'created_at', header: 'Dibuat Pada' },
  { id: 'actions', header: '' },
]

function formatDateTime(v: string) {
  return new Date(v).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}

async function loadHistory() {
  try {
    await store.fetchBillingBatches({ limit: 10 })
  } catch {
    /* error in store */
  }
}

onMounted(async () => {
  try {
    await Promise.all([
      store.fetchBillingSchemes({ is_active: true, limit: 100 }),
      store.fetchBillingPeriods({ status: 'open', limit: 100 }),
      loadHistory(),
    ])
  } catch {
    /* error in store */
  }
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  confirmOpen.value = true
}

async function confirmGenerate() {
  isGenerating.value = true
  try {
    const res = await store.createInvoiceBatch({
      billing_scheme_id: state.billing_scheme_id!,
      billing_period_id: state.billing_period_id!,
      issued_date: state.issued_date!,
      due_date: state.due_date!,
    })
    confirmOpen.value = false
    toast.add({ title: 'Tagihan massal sedang diproses', color: 'success' })
    await navigateTo(`/admin/keuangan/tagihan/batch/${res.batch_id}`)
  } catch {
    toast.add({
      title: 'Gagal membuat tagihan massal',
      description: store.error ?? undefined,
      color: 'error',
    })
    confirmOpen.value = false
  } finally {
    isGenerating.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-8">
    <div class="mb-6">
      <UButton
        color="neutral"
        variant="ghost"
        icon="i-lucide-arrow-left"
        size="sm"
        class="mb-3"
        @click="navigateTo('/admin/keuangan/tagihan')"
      >
        Kembali ke Daftar Tagihan
      </UButton>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Generate Tagihan Massal</h1>
      <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">
        Buat tagihan untuk semua santri yang memiliki skema tagihan aktif.
      </p>
    </div>

    <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Skema Tagihan" name="billing_scheme_id" required>
          <USelect
            v-model="state.billing_scheme_id"
            :items="schemeOptions"
            placeholder="Pilih skema"
            class="w-full"
            :ui="{ base: 'bg-gray-50 dark:bg-gray-800', value: 'text-gray-900 dark:text-gray-100' }"
          />
        </UFormField>

        <div v-if="selectedScheme" class="rounded border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
          <p class="mb-2 text-sm font-medium text-gray-900 dark:text-gray-100">{{ selectedScheme.name }}</p>
          <p v-if="selectedScheme.description" class="mb-2 text-xs text-gray-500 dark:text-gray-400">{{ selectedScheme.description }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ selectedScheme.items?.length ?? 0 }} komponen biaya
          </p>
        </div>

        <UFormField label="Periode Tagihan" name="billing_period_id" required>
          <USelect
            v-model="state.billing_period_id"
            :items="billingPeriodOptions"
            placeholder="Pilih periode tagihan"
            class="w-full"
            :ui="{ base: 'bg-gray-50 dark:bg-gray-800', value: 'text-gray-900 dark:text-gray-100' }"
          />
        </UFormField>

        <UFormField label="Tanggal Terbit" name="issued_date" required>
          <UInput
            v-model="state.issued_date"
            type="date"
            class="w-full"
            variant="subtle"
          />
        </UFormField>

        <UFormField label="Jatuh Tempo" name="due_date" required>
          <UInput
            v-model="state.due_date"
            type="date"
            class="w-full"
            variant="subtle"
          />
        </UFormField>

        <div class="flex justify-end gap-2 pt-2">
          <UButton
            color="neutral"
            variant="ghost"
            type="button"
            @click="navigateTo('/admin/keuangan/tagihan')"
          >
            Batal
          </UButton>
          <UButton
            type="submit"
            :loading="store.isSubmitting"
            icon="i-lucide-layers"
            class="bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400"
          >
            Generate
          </UButton>
        </div>
      </UForm>
    </div>

    <div class="mt-8">
      <h2 class="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">Riwayat Batch Terbaru</h2>
      <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700/50 dark:bg-gray-900">
        <UTable
          :data="store.billingBatches"
          :columns="historyColumns"
          :loading="store.isLoading"
          class="w-full"
          :ui="{ th: 'text-gray-900 font-bold dark:text-gray-100' }"
        >
          <template #name-cell="{ row }">
            <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ row.original.name }}</span>
          </template>

          <template #status-cell="{ row }">
            <UBadge :color="batchStatusColor[row.original.status]" variant="subtle" size="sm">
              {{ batchStatusLabel[row.original.status] }}
            </UBadge>
          </template>

          <template #created_at-cell="{ row }">
            <span class="text-sm text-gray-700 dark:text-gray-300">{{ formatDateTime(row.original.created_at) }}</span>
          </template>

          <template #actions-cell="{ row }">
            <UButton
              size="xs"
              color="neutral"
              variant="outline"
              @click="navigateTo(`/admin/keuangan/tagihan/batch/${row.original.id}`)"
            >
              Lihat Detail
            </UButton>
          </template>
        </UTable>
      </div>
    </div>

    <AdminConfirmActionModal
      v-model:open="confirmOpen"
      title="Konfirmasi Generate Massal"
      description="Tagihan akan dibuat untuk semua santri yang terhubung dengan skema ini. Proses ini tidak dapat dibatalkan."
      confirm-label="Generate"
      color="primary"
      :loading="isGenerating"
      @confirm="confirmGenerate"
    />
  </div>
</template>
