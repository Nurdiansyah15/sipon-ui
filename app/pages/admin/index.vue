<script setup lang="ts">
import { usePermission } from '~/composables/usePermission'

definePageMeta({ layout: 'admin' })

const { can, canAny } = usePermission()

const canManagePSB = computed(() => canAny(['manage_psb', 'manage_psb_settings']))
const canManageSantri = computed(() => canAny(['manage_santri', 'manage_persuratan']))
const canManageArticle = computed(() => canAny(['create_article', 'edit_article', 'manage_article_category']))
const canManageKeuangan = computed(() => canAny(['manage_keuangan', 'verify_payment', 'view_keuangan_reports', 'manage_accounts', 'manage_journal', 'close_period']))
const canManageFeedback = computed(() => can('manage_feedback'))

const shortcuts = computed(() => [
  {
    title: 'Dasbor',
    description: 'Ringkasan aktivitas modul manajemen sistem.',
    icon: 'i-lucide-gauge',
    to: '/admin',
    shown: true,
  },
  {
    title: 'Kesantrian',
    description: 'Kelola profil santri, tinjau permintaan menjadi santri, dan verifikasi dokumen persyaratan.',
    icon: 'i-lucide-graduation-cap',
    to: '/admin/kesantrian',
    shown: canManageSantri.value,
  },
  {
    title: 'PSB',
    description: 'Kelola pendaftaran santri baru: review pendaftar, verifikasi dokumen, generate NIS, dan periode PSB.',
    icon: 'i-lucide-user-plus',
    to: '/admin/psb',
    shown: canManagePSB.value,
  },
  {
    title: 'Artikel',
    description: 'Kelola artikel berita, informasi, dan konten publikasi pesantren.',
    icon: 'i-lucide-file-text',
    to: '/admin/artikel',
    shown: canManageArticle.value,
  },
  {
    title: 'Keuangan',
    description: 'Kelola komponen biaya, tagihan, pembayaran, jurnal, dan laporan keuangan pesantren.',
    icon: 'i-lucide-wallet',
    to: '/admin/keuangan',
    shown: canManageKeuangan.value,
  },
  {
    title: 'Feedback',
    description: 'Moderasi umpan balik: takedown/restore feedback dan komentar yang tidak pantas.',
    icon: 'i-lucide-message-square',
    to: '/admin/feedback',
    shown: canManageFeedback.value,
  },
])
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Portal Admin</h1>
      <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">
        Pusat administrasi untuk mengelola user, role, santri, dan pendaftaran santri baru.
      </p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <template v-for="mod in shortcuts" :key="mod.title">
        <FeatureModuleCard
          v-if="mod.shown"
          :title="mod.title"
          :description="mod.description"
          :icon="mod.icon"
          :to="mod.to"
        />
      </template>
    </div>
  </div>
</template>