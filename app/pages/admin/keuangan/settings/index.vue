<script setup lang="ts">
import { useKeuanganStore } from '~/stores/keuangan'
import { parseApiError } from '~/utils/errorParser'
import type { AccountBrief } from '#shared/types/Keuangan'

definePageMeta({ layout: 'keuangan' })

const store = useKeuanganStore()
const toast = useToast()

const accountId = ref<string | null>(null)
const selectedAccount = ref<AccountBrief | null>(null)
const isLoaded = ref(false)

onMounted(async () => {
  try {
    const settings = await store.fetchKeuanganSettings()
    accountId.value = settings.default_payment_debit_account_id ?? null
    selectedAccount.value = settings.default_payment_debit_account ?? null
  } catch (err) {
    toast.add({ title: 'Gagal memuat settings', description: parseApiError(err), color: 'error' })
  } finally {
    isLoaded.value = true
  }
})

async function onSave() {
  try {
    const res = await store.updateKeuanganSettings({
      default_payment_debit_account_id: accountId.value,
    })
    accountId.value = res.default_payment_debit_account_id ?? null
    selectedAccount.value = res.default_payment_debit_account ?? null
    toast.add({ title: 'Settings keuangan berhasil disimpan', color: 'success' })
  } catch (err) {
    toast.add({ title: 'Gagal menyimpan settings', description: parseApiError(err), color: 'error' })
  }
}

function onAccountChange(id: string | null) {
  accountId.value = id
  if (id === null) {
    selectedAccount.value = null
  }
}
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-8">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Pengaturan Keuangan</h1>
      <p class="mt-1 text-sm text-gray-500">Konfigurasi default untuk transaksi keuangan.</p>
    </div>

    <div v-if="!isLoaded" class="space-y-4">
      <USkeleton class="h-40 w-full" />
    </div>

    <div v-else class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
      <div class="mb-6 flex items-start gap-3">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950">
          <UIcon name="i-lucide-landmark" class="h-5 w-5 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h2 class="font-semibold text-gray-900 dark:text-gray-100">Akun Debit Default Pembayaran</h2>
          <p class="mt-1 text-sm text-gray-500">
            Akun kas/bank default yang digunakan saat santri melakukan pembayaran. Akun harus berjenis kas atau bank dan dapat diposting.
          </p>
        </div>
      </div>

      <div class="space-y-4">
        <UFormField
          label="Akun Debit Default"
          hint="Pilih akun kas atau bank dari Chart of Accounts"
          name="default_payment_debit_account_id"
        >
          <KeuanganAccountPicker
            v-model="accountId"
            filter="asset"
            sub-type="cash_bank"
            placeholder="Pilih akun kas/bank"
            @update:model-value="onAccountChange"
          />
        </UFormField>

        <div v-if="selectedAccount" class="rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-800">
          <p class="text-gray-500">Akun terpilih</p>
          <p class="mt-1 font-medium text-gray-900 dark:text-gray-100">
            <span class="font-mono text-teal-600 dark:text-teal-400">{{ selectedAccount.code }}</span>
            &nbsp;·&nbsp;{{ selectedAccount.name }}
          </p>
        </div>

        <div class="border-t border-gray-200 pt-4 dark:border-gray-700">
          <UButton
            icon="i-lucide-save"
            class="bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400"
            :loading="store.isSubmitting"
            :disabled="accountId === null"
            @click="onSave"
          >
            Simpan Pengaturan
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
