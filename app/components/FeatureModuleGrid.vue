<script setup lang="ts">
const modules = [
  { title: 'Kesantrian', description: 'Pengelolaan data santri dan kegiatan pondok pesantren', icon: 'i-lucide-users' },
  { title: 'Keuangan', description: 'Manajemen keuangan, pembayaran, dan laporan keuangan', icon: 'i-lucide-wallet' },
  { title: 'Keamanan', description: 'Sistem keamanan, akses kontrol, dan monitoring', icon: 'i-lucide-shield' },
  { title: 'Akademik', description: 'Nilai, jadwal, dan kurikulum pembelajaran', icon: 'i-lucide-book-open' },
  { title: 'Perpustakaan', description: 'Katalog buku, peminjaman, dan manajemen perpustakaan', icon: 'i-lucide-library' },
  { title: 'Asrama', description: 'Pengelolaan asrama, kamar, dan fasilitas hunian', icon: 'i-lucide-building' },
]
</script>

<template>
  <section class="mx-auto max-w-7xl px-4 py-8">
    <h2 class="mb-6 text-lg font-semibold text-gray-900">Aplikasi</h2>
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <FeatureModuleCard
        v-for="mod in modules"
        :key="mod.title"
        :title="mod.title"
        :description="mod.description"
        :icon="mod.icon"
      />
    </div>
  </section>
</template>
