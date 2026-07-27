<script setup lang="ts">
import { usePermission } from '~/composables/usePermission'

definePageMeta({ layout: 'system-admin' })

const { can, canAny } = usePermission()

const canManageUsers = computed(() => can('manage_users'))
const canManageRoles = computed(() => canAny(['manage_roles', 'manage_role_permissions']))

const shortcuts = computed(() => [
  {
    title: 'Dasbor',
    description: 'Ringkasan aktivitas modul manajemen sistem.',
    icon: 'i-lucide-gauge',
    to: '/system-admin',
    shown: true,
  },
  {
    title: 'Kelola User',
    description: 'Buat user, setel ulang kata sandi, aktifkan/nonaktifkan akun, dan kelola role-nya.',
    icon: 'i-lucide-users',
    to: '/system-admin/users',
    shown: canManageUsers.value,
  },
  {
    title: 'Kelola Role',
    description: 'Buat role dan atur permission role — sumber kebenaran untuk hak akses user.',
    icon: 'i-lucide-shield',
    to: '/system-admin/roles',
    shown: canManageRoles.value,
  },
])
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Manajemen Sistem</h1>
      <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">
        Modul administratif untuk mengelola user, role, dan hak akses platform.
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