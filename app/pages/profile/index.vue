<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'default' })

const authStore = useAuthStore()
const toast = useToast()

const isLoading = ref(true)

onMounted(async () => {
  try {
    await authStore.fetchProfile()
  } catch {
    toast.add({
      title: 'Gagal memuat profil',
      description: authStore.error ?? undefined,
      color: 'error',
    })
  } finally {
    isLoading.value = false
  }
})

const tabItems: TabsItem[] = [
  { label: 'Informasi Akun', icon: 'i-lucide-user', value: 'account' },
  { label: 'Roles & Permissions', icon: 'i-lucide-shield', value: 'roles' },
  { label: 'Keamanan', icon: 'i-lucide-lock', value: 'security' },
]
const activeTab = ref('account')
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <h1 class="text-2xl font-bold text-gray-900">Profil Saya</h1>

    <div v-if="isLoading" class="mt-8 flex justify-center">
      <UIcon name="i-lucide-loader-2" class="h-6 w-6 animate-spin text-gray-400" />
    </div>

    <UTabs v-else v-model="activeTab" :items="tabItems" class="mt-6" :ui="{ trigger: 'cursor-pointer' }">
      <template #content="{ item }">
        <div class="mt-4 rounded-lg border border-gray-200 bg-white p-6">
          <ProfileAccountInfoPanel v-if="item.value === 'account'" />
          <ProfileRolesPermissionsPanel v-else-if="item.value === 'roles'" />
          <template v-else-if="item.value === 'security'">
            <ProfileSetPasswordForm v-if="!authStore.user?.has_password" />
            <ProfileChangePasswordForm v-else />
          </template>
        </div>
      </template>
    </UTabs>
  </div>
</template>
