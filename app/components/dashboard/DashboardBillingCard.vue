<script setup lang="ts">
import { useKeuanganStore } from '~/stores/keuangan'

const keuanganStore = useKeuanganStore()

const summary = computed(() => keuanganStore.myInvoiceSummary)

function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value).replace('Rp', 'Rp ')
}
</script>

<template>
  <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
    <div class="mb-4 flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Tagihan Keuangan</h3>
      <NuxtLink to="/keuangan/tagihan" class="text-sm text-teal-600 hover:underline dark:text-teal-400">
        Lihat Detail
      </NuxtLink>
    </div>

    <div v-if="keuanganStore.isLoading" class="py-8 text-center">
      <UIcon name="i-lucide-loader-2" class="mx-auto h-6 w-6 animate-spin text-gray-400" />
    </div>

    <div v-else-if="!summary || summary.jumlah_invoice === 0" class="py-8 text-center">
      <UIcon name="i-lucide-wallet" class="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Belum ada tagihan.</p>
    </div>

    <div v-else>
      <div class="grid gap-4 sm:grid-cols-3">
        <div class="text-center">
          <p class="text-sm text-gray-500 dark:text-gray-400">Total Tagihan</p>
          <p class="mt-1 text-lg font-bold text-gray-900 dark:text-gray-100">
            {{ formatRupiah(summary.total_tagihan) }}
          </p>
        </div>
        <div class="text-center">
          <p class="text-sm text-gray-500 dark:text-gray-400">Total Dibayar</p>
          <p class="mt-1 text-lg font-bold text-green-600 dark:text-green-400">
            {{ formatRupiah(summary.total_terbayar) }}
          </p>
        </div>
        <div class="text-center">
          <p class="text-sm text-gray-500 dark:text-gray-400">Total Tunggakan</p>
          <p class="mt-1 text-lg font-bold text-red-600 dark:text-red-400">
            {{ formatRupiah(summary.total_tunggakan) }}
          </p>
        </div>
      </div>
      <div class="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <span>
          <span class="font-medium text-green-600 dark:text-green-400">{{ summary.jumlah_lunas }}</span> lunas
        </span>
        <span>
          <span class="font-medium text-red-600 dark:text-red-400">{{ summary.jumlah_belum }}</span> belum lunas
        </span>
      </div>
    </div>
  </div>
</template>
