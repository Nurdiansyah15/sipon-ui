<script setup lang="ts">
import { useKesantrianStore } from '~/stores/kesantrian'
import { getErrorStatus } from '~/utils/errorParser'

const kesantrianStore = useKesantrianStore()

const statusMap: Record<string, { label: string; color: string }> = {
  SANTRI: { label: 'Santri Aktif', color: 'success' },
  ALUMNI: { label: 'Alumni', color: 'neutral' },
  DROP_OUT: { label: 'Keluar', color: 'error' },
}

const profile = computed(() => kesantrianStore.myProfile)
const isSantri = computed(() => !!profile.value)
const hasError = computed(() => kesantrianStore.isLoadingMyProfile === false && !profile.value)
</script>

<template>
  <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
    <div class="mb-4 flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Status Kesantrian</h3>
      <NuxtLink v-if="isSantri" to="/profile" class="text-sm text-teal-600 hover:underline dark:text-teal-400">
        Edit Profil
      </NuxtLink>
    </div>

    <div v-if="kesantrianStore.isLoadingMyProfile" class="py-8 text-center">
      <UIcon name="i-lucide-loader-2" class="mx-auto h-6 w-6 animate-spin text-gray-400" />
    </div>

    <div v-else-if="!isSantri" class="py-8 text-center">
      <UIcon name="i-lucide-graduation-cap" class="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
      <p class="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">Belum Terdaftar Sebagai Santri</p>
      <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Ajukan permintaan untuk menjadi santri.</p>
      <UButton to="/psb" class="mt-4" size="sm">Daftar Sekarang</UButton>
    </div>

    <div v-else class="flex items-start gap-4">
      <UAvatar
        :src="profile?.avatar_url"
        :alt="profile?.fullname || profile?.username"
        size="xl"
      />
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <h4 class="truncate text-base font-semibold text-gray-900 dark:text-gray-100">
            {{ profile?.fullname || profile?.username }}
          </h4>
          <UBadge
            v-if="profile?.status && statusMap[profile.status]"
            :color="statusMap[profile.status].color"
            variant="subtle"
            size="xs"
          >
            {{ statusMap[profile.status].label }}
          </UBadge>
        </div>
        <div class="mt-2 space-y-1 text-sm text-gray-500 dark:text-gray-400">
          <p v-if="profile?.nis">
            <span class="font-medium text-gray-700 dark:text-gray-300">NIS:</span>
            {{ profile.nis }}
          </p>
          <p v-if="profile?.program">
            <span class="font-medium text-gray-700 dark:text-gray-300">Program:</span>
            {{ profile.program }}
          </p>
          <p>
            <span class="font-medium text-gray-700 dark:text-gray-300">Email:</span>
            {{ profile?.email }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
