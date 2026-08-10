import { usePermission } from '~/composables/usePermission'

export interface AppModuleLink {
  title: string
  description: string
  icon: string
  to: string
  shown?: boolean
}

// Sumber tunggal daftar aplikasi yang tersedia (public + admin). Dipakai oleh
// halaman /aplikasi (FeatureModuleGrid) dan launcher grid di navbar
// (AppAppMenu) supaya daftar aplikasi konsisten di mana pun.
export const useAppModules = () => {
  const { can, canAny } = usePermission()

  const publicApps: AppModuleLink[] = [
    {
      title: 'Artikel',
      description: 'Baca artikel, berita, dan informasi pesantren.',
      icon: 'i-lucide-globe',
      to: '/artikel',
    },
    {
      title: 'Pendaftaran Santri Baru',
      description: 'Daftar sebagai santri baru, isi formulir, upload dokumen, dan pantau status.',
      icon: 'i-lucide-user-plus',
      to: '/psb',
    },
    {
      title: 'Umpan Balik',
      description: 'Sampaikan saran, pengaduan, pertanyaan, atau apresiasi Anda kepada pengelola.',
      icon: 'i-lucide-message-square',
      to: '/feedback',
    },
  ]

  const adminApps = computed<AppModuleLink[]>(() => [
    {
      title: 'Portal Admin',
      description: 'Manajemen pengguna, peran, dan izin akses sistem.',
      icon: 'i-lucide-settings-2',
      to: '/admin',
      shown: canAny(['manage_system_settings', 'assign_role', 'manage_users', 'manage_roles', 'manage_role_permissions']),
    },
    {
      title: 'Kesantrian',
      description: 'Kelola profil santri, permintaan menjadi santri, dan dokumen persyaratan.',
      icon: 'i-lucide-graduation-cap',
      to: '/admin/kesantrian',
      shown: can('manage_santri'),
    },
    {
      title: 'PSB',
      description: 'Kelola pendaftaran santri baru: review, verifikasi dokumen, dan generate NIS.',
      icon: 'i-lucide-user-plus',
      to: '/admin/psb',
      shown: canAny(['manage_psb', 'manage_psb_settings']),
    },
    {
      title: 'Artikel',
      description: 'Kelola artikel, kategori, dan sumber berita.',
      icon: 'i-lucide-file-text',
      to: '/admin/artikel',
      shown: canAny(['create_article', 'edit_article', 'publish_article', 'manage_article_category', 'manage_article_sources']),
    },
    {
      title: 'Keuangan',
      description: 'Kelola tagihan, pembayaran, jurnal, dan laporan keuangan pesantren.',
      icon: 'i-lucide-wallet',
      to: '/admin/keuangan',
      shown: canAny(['manage_keuangan', 'verify_payment', 'view_keuangan_reports', 'manage_accounts', 'manage_journal', 'close_period']),
    },
    {
      title: 'Feedback',
      description: 'Moderasi umpan balik: takedown/restore feedback dan komentar.',
      icon: 'i-lucide-message-square',
      to: '/admin/feedback',
      shown: can('manage_feedback'),
    },
  ])

  const visibleAdminApps = computed(() => adminApps.value.filter((a) => a.shown))

  return { publicApps, adminApps, visibleAdminApps }
}
