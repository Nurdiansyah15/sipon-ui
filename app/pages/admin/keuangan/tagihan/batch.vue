<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useKeuanganStore } from '~/stores/keuangan'
import { usePermission } from '~/composables/usePermission'

definePageMeta({ layout: 'keuangan' })

const store = useKeuanganStore()
const toast = useToast()
const { can } = usePermission()

const schema = z.object({
  billing_scheme_id: z.string().min(1, 'Skema tagihan wajib dipilih'),
  periode: z.string().min(1, 'Periode wajib diisi'),
  tahun_ajaran: z.string().min(1, 'Tahun ajaran wajib diisi'),
  due_date: z.string().min(1, 'Tanggal jatuh tempo wajib diisi'),
})
type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  billing_scheme_id: '',
  periode: '',
  tahun_ajaran: '',
  due_date: '',
})

const confirmOpen = ref(false)
const isGenerating = ref(false)
const batchResult = ref<{ message: string } | null>(null)

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

onMounted(async () => {
  try {
    await store.fetchBillingSchemes({ is_active: true, limit: 100 })
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
      periode: state.periode!,
      tahun_ajaran: state.tahun_ajaran!,
      due_date: state.due_date!,
    })
    batchResult.value = res
    toast.add({ title: 'Tagihan massal berhasil dibuat', color: 'success' })
    confirmOpen.value = false
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

function resetForm() {
  state.billing_scheme_id = ''
  state.periode = ''
  state.tahun_ajaran = ''
  state.due_date = ''
  batchResult.value = null
}
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-8">
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

    <div v-if="batchResult" class="mb-6 rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-900/20">
      <div class="flex items-start gap-3">
        <UIcon name="i-lucide-check-circle-2" class="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
        <div>
          <h2 class="mb-1 text-lg font-semibold text-green-800 dark:text-green-300">Hasil Generate</h2>
          <p class="text-sm text-green-700 dark:text-green-400">{{ batchResult.message }}</p>
        </div>
      </div>
      <div class="mt-4 flex gap-2">
        <UButton
          color="neutral"
          variant="outline"
          @click="navigateTo('/admin/keuangan/tagihan')"
        >
          Lihat Daftar Tagihan
        </UButton>
        <UButton color="neutral" variant="ghost" @click="resetForm">
          Generate Lagi
        </UButton>
      </div>
    </div>

    <div v-else class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
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

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Periode" name="periode" required>
            <UInput v-model="state.periode" class="w-full" variant="subtle" placeholder="Semester 1" />
          </UFormField>
          <UFormField label="Tahun Ajaran" name="tahun_ajaran" required>
            <UInput v-model="state.tahun_ajaran" class="w-full" variant="subtle" placeholder="2025/2026" />
          </UFormField>
        </div>

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
