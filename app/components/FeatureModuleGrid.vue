<script setup lang="ts">
import { usePermission } from '~/composables/usePermission'

const { canAny } = usePermission()

const modules = [
  { title: 'Kesantrian', description: 'Pengelolaan data santri dan kegiatan pondok pesantren', icon: 'i-lucide-users' },
  { title: 'Keuangan', description: 'Manajemen keuangan, pembayaran, dan laporan keuangan', icon: 'i-lucide-wallet' },
  { title: 'Keamanan', description: 'Sistem keamanan, akses kontrol, dan monitoring', icon: 'i-lucide-shield' },
  { title: 'Akademik', description: 'Nilai, jadwal, dan kurikulum pembelajaran', icon: 'i-lucide-book-open' },
  { title: 'Perpustakaan', description: 'Katalog buku, peminjaman, dan manajemen perpustakaan', icon: 'i-lucide-library' },
  { title: 'Asrama', description: 'Pengelolaan asrama, kamar, dan fasilitas hunian', icon: 'i-lucide-building' },
]

// Tile "Manajemen Sistem" hanya tampil kalau user punya salah satu permission
// manage_users/manage_roles/manage_role_permissions — entry-point ke modul
// system-admin (lihat docs/plans/system-management-module.md §Frontend nav wiring).
const showSystemManagement = computed(() =>
  canAny(['manage_users', 'manage_roles', 'manage_role_permissions']),
)
</script>

<template>
  <section class="mx-auto max-w-7xl px-4 py-8">
    <h2 class="mb-6 text-lg font-semibold text-gray-900 dark:text-gray-100">Aplikasi</h2>
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <template v-for="mod in modules" :key="mod.title">
        <FeatureModuleCard
          :title="mod.title"
          :description="mod.description"
          :icon="mod.icon"
        />
      </template>

      <FeatureModuleCard
        v-if="showSystemManagement"
        title="Manajemen Sistem"
        description="Kelola user, role, dan hak akses di seluruh platform."
        icon="i-lucide-settings-2"
        to="/system-admin"
      />
    </div>
  </section>
</template>