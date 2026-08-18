<script setup lang="ts">
import { useKeuanganPeriodContext } from '~/composables/useKeuanganPeriodContext'
import { usePermission } from '~/composables/usePermission'

definePageMeta({ layout: 'keuangan' })

const { selectedPeriodId, selectedPeriod, setPeriod, loadPeriods, periods, periodOptions } = useKeuanganPeriodContext()
const { can } = usePermission()

interface WorkCard {
  label: string
  description: string
  icon: string
  to: string
}

interface WorkSection {
  title: string
  icon: string
  cards: WorkCard[]
}

const sections = computed<WorkSection[]>(() => {
  const result: WorkSection[] = []

  if (can('manage_keuangan')) {
    result.push({
      title: 'Transaksi',
      icon: 'i-lucide-arrow-left-right',
      cards: [
        {
          label: 'Tagihan',
          description: 'Kelola tagihan santri, buat tagihan individual atau massal.',
          icon: 'i-lucide-receipt',
          to: '/admin/keuangan/tagihan',
        },
        {
          label: 'Pembayaran',
          description: 'Verifikasi pembayaran dan kelola pembayaran santri.',
          icon: 'i-lucide-credit-card',
          to: '/admin/keuangan/pembayaran',
        },
        {
          label: 'Periode Tagihan',
          description: 'Kelola periode tagihan di bawah periode akuntansi ini.',
          icon: 'i-lucide-calendar-range',
          to: '/admin/keuangan/periode-tagihan',
        },
      ],
    })
  }

  if (can('manage_journal')) {
    result.push({
      title: 'Akuntansi',
      icon: 'i-lucide-calculator',
      cards: [
        {
          label: 'Jurnal',
          description: 'Lihat dan kelola jurnal transaksi akuntansi.',
          icon: 'i-lucide-book-open',
          to: '/admin/keuangan/jurnal',
        },
      ],
    })
  }

  if (can('view_keuangan_reports')) {
    result.push({
      title: 'Laporan',
      icon: 'i-lucide-file-bar-chart',
      cards: [
        {
          label: 'Rekap Tagihan',
          description: 'Ringkasan tagihan dan pembayaran per periode tagihan.',
          icon: 'i-lucide-bar-chart-3',
          to: '/admin/keuangan/laporan/rekap',
        },
        {
          label: 'Tunggakan',
          description: 'Daftar santri dengan tunggakan tagihan.',
          icon: 'i-lucide-alert-circle',
          to: '/admin/keuangan/laporan/tunggakan',
        },
        {
          label: 'Buku Besar',
          description: 'Rincian transaksi per akun dalam suatu periode.',
          icon: 'i-lucide-book',
          to: '/admin/keuangan/laporan/buku-besar',
        },
        {
          label: 'Neraca Saldo',
          description: 'Saldo semua akun pada periode tertentu.',
          icon: 'i-lucide-scale',
          to: '/admin/keuangan/laporan/neraca-saldo',
        },
        {
          label: 'Neraca',
          description: 'Posisi keuangan pada tanggal tertentu.',
          icon: 'i-lucide-file-text',
          to: '/admin/keuangan/laporan/neraca',
        },
        {
          label: 'Laba Rugi',
          description: 'Pendapatan dan beban selama periode tertentu.',
          icon: 'i-lucide-trending-up',
          to: '/admin/keuangan/laporan/laba-rugi',
        },
      ],
    })
  }

  return result
})

onMounted(() => {
  loadPeriods()
})

function onPick(id: string) {
  setPeriod(id)
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Ruang Kerja Keuangan</h1>
      <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">
        Pilih periode akuntansi untuk mulai bekerja. Semua proses keuangan (transaksi, akuntansi, laporan, dan periode tagihan) akan otomatis difilter ke periode ini.
      </p>
    </div>

    <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
      <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Periode Akuntansi</label>

      <div v-if="periods.length === 0" class="flex items-center justify-between gap-3 rounded-lg border border-dashed border-gray-300 p-4 dark:border-gray-600">
        <p class="text-sm text-gray-500 dark:text-gray-400">Belum ada periode akuntansi. Buat periode terlebih dahulu di Master › Periode Akuntansi.</p>
        <UButton variant="outline" size="sm" color="primary" to="/admin/keuangan/periode">Buat Periode</UButton>
      </div>

      <USelect
        v-else
        :model-value="selectedPeriodId ?? ''"
        :items="periodOptions"
        placeholder="Pilih periode akuntansi..."
        searchable
        class="w-full max-w-xl"
        size="lg"
        @update:model-value="onPick($event as string)"
      />

      <p v-if="selectedPeriod" class="mt-3 text-sm text-teal-600 dark:text-teal-400">
        Periode aktif: <span class="font-semibold">{{ selectedPeriod.name }}</span>
      </p>
    </div>

    <div v-if="selectedPeriodId" class="mt-8 space-y-8">
      <section v-for="section in sections" :key="section.title">
        <div class="mb-3 flex items-center gap-2">
          <UIcon :name="section.icon" class="h-5 w-5 text-teal-600 dark:text-teal-400" />
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ section.title }}</h2>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NuxtLink
            v-for="card in section.cards"
            :key="card.to"
            :to="card.to"
            class="group flex flex-col justify-between gap-4 rounded-lg border border-gray-200 bg-white p-5 transition hover:shadow-md dark:border-gray-700/50 dark:bg-gray-900"
          >
            <div class="flex items-start justify-between">
              <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950">
                <UIcon :name="card.icon" class="h-6 w-6 text-teal-600 dark:text-teal-400" />
              </div>
              <UIcon name="i-lucide-arrow-right" class="h-4 w-4 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-teal-600 dark:text-gray-500" />
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-gray-100">{{ card.label }}</h3>
              <p class="mt-0.5 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">{{ card.description }}</p>
            </div>
          </NuxtLink>
        </div>
      </section>
    </div>
  </div>
</template>
