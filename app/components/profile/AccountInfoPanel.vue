<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const user = computed(() => authStore.user)

function formatDate(value?: string | null) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return value
  }
}
</script>

<template>
  <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
    <div>
      <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Username</p>
      <p class="mt-1 text-sm text-gray-900 dark:text-gray-100">{{ user?.username }}</p>
    </div>

    <div>
      <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Nama Lengkap</p>
      <p class="mt-1 text-sm text-gray-900 dark:text-gray-100">{{ user?.fullname || '—' }}</p>
    </div>

    <div>
      <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Email</p>
      <div class="mt-1 flex flex-wrap items-center gap-2">
        <p class="text-sm text-gray-900 dark:text-gray-100">{{ user?.email }}</p>
        <UBadge :color="user?.is_email_verified ? 'success' : 'warning'" variant="subtle" size="sm">
          {{ user?.is_email_verified ? 'Terverifikasi' : 'Belum Verifikasi' }}
        </UBadge>
      </div>
    </div>

    <div>
      <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">No. Telepon</p>
      <div class="mt-1 flex flex-wrap items-center gap-2">
        <p class="text-sm text-gray-900 dark:text-gray-100">{{ user?.phone || '—' }}</p>
        <UBadge v-if="user?.phone" :color="user?.is_phone_verified ? 'success' : 'warning'" variant="subtle" size="sm">
          {{ user?.is_phone_verified ? 'Terverifikasi' : 'Belum Verifikasi' }}
        </UBadge>
      </div>
    </div>

    <div>
      <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Status Akun</p>
      <UBadge :color="user?.status === 'ACTIVE' ? 'success' : 'error'" variant="subtle" size="sm" class="mt-1">
        {{ user?.status === 'ACTIVE' ? 'Aktif' : 'Diblokir' }}
      </UBadge>
    </div>

    <div>
      <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Anggota Sejak</p>
      <p class="mt-1 text-sm text-gray-900 dark:text-gray-100">{{ formatDate(user?.created_at) }}</p>
    </div>

    <div>
      <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Kata Sandi</p>
      <UBadge :color="user?.has_password ? 'success' : 'warning'" variant="subtle" size="sm" class="mt-1">
        {{ user?.has_password ? 'Sudah diatur' : 'Belum diatur' }}
      </UBadge>
    </div>
  </div>
</template>
