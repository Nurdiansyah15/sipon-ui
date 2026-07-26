<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'default' })

const authStore = useAuthStore()

const displayName = computed(() => authStore.user?.fullname || authStore.user?.username || '')
</script>

<template>
  <UDashboardPanel id="dashboard">
    <template #header>
      <UDashboardNavbar title="Dashboard">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <UCard>
          <h2 class="text-lg font-semibold">
            Selamat datang, {{ displayName }} 👋
          </h2>
          <p class="mt-1 text-sm text-muted">
            Ini adalah halaman dashboard awal Sipon. Fitur manajemen role & permission akan menyusul di sini.
          </p>
        </UCard>

        <div class="grid gap-6 sm:grid-cols-2">
          <UCard>
            <template #header>
              <h3 class="text-sm font-semibold">Profil</h3>
            </template>
            <dl class="space-y-2 text-sm">
              <div class="flex justify-between gap-4">
                <dt class="text-muted">Username</dt>
                <dd class="font-medium">{{ authStore.user?.username }}</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-muted">Email</dt>
                <dd class="font-medium">{{ authStore.user?.email }}</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-muted">Status</dt>
                <dd class="font-medium">{{ authStore.user?.status }}</dd>
              </div>
            </dl>
          </UCard>

          <UCard>
            <template #header>
              <h3 class="text-sm font-semibold">Role</h3>
            </template>
            <div v-if="authStore.roleNames.length" class="flex flex-wrap gap-2">
              <UBadge
                v-for="role in authStore.roleNames"
                :key="role"
                :label="role"
                variant="subtle"
              />
            </div>
            <p v-else class="text-sm text-muted">
              Belum ada role yang di-assign.
            </p>
          </UCard>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
