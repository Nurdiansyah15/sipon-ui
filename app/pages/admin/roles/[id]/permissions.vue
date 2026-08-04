<script setup lang="ts">
import { useRolePermissionStore } from '~/stores/rolePermission'
import { usePermission } from '~/composables/usePermission'
import type { RoleItem } from '#shared/types/RolePermission'

definePageMeta({ layout: 'admin' })

const route = useRoute()
const store = useRolePermissionStore()
const toast = useToast()
const { can } = usePermission()

const roleId = computed(() => String(route.params.id))
const role = ref<RoleItem | null>(null)
const isLoadingRole = ref(true)
const toggling = ref<Record<string, boolean>>({})

async function loadRole() {
  isLoadingRole.value = true
  try {
    role.value = await store.fetchRole(roleId.value)
    await store.fetchPermissionKeys()
  } catch (err) {
    toast.add({
      title: 'Gagal memuat role',
      description: store.error ?? undefined,
      color: 'error',
    })
  } finally {
    isLoadingRole.value = false
  }
}

onMounted(loadRole)

function isAssigned(key: string): boolean {
  return !!role.value?.permissions?.includes(key)
}

async function togglePermission(key: string) {
  if (!role.value || toggling.value[key]) return
  toggling.value[key] = true
  const wasAssigned = isAssigned(key)
  try {
    let updated: RoleItem
    if (wasAssigned) {
      updated = await store.revokeRolePermission(role.value.id, key)
    } else {
      updated = await store.assignRolePermission(role.value.id, { permission_key: key })
    }
    role.value = updated
    toast.add({
      title: wasAssigned ? 'Permission dicabut' : 'Permission ditetapkan',
      color: 'success',
    })
  } catch (err) {
    toast.add({
      title: 'Gagal mengubah permission',
      description: store.error ?? undefined,
      color: 'error',
    })
  } finally {
    toggling.value[key] = false
  }
}

const isSystem = computed(() => role.value?.role_type === 'system')
const canEdit = computed(() => can('manage_role_permissions') && !isSystem.value)
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-6 flex items-start justify-between gap-4">
      <div>
        <div v-if="isLoadingRole">
          <div class="h-6 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        <div v-else-if="role">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {{ role.display_name }}
            <span class="ml-2 text-sm font-normal text-gray-600 dark:text-gray-400">({{ role.name }})</span>
          </h1>
          <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">{{ role.description }}</p>
          <UBadge
            v-if="isSystem"
            color="warning"
            variant="subtle"
            size="sm"
            class="mt-2"
          >
            Role system — permission fixed di kode, tidak bisa diubah via UI
          </UBadge>
        </div>
      </div>
      <UButton
        color="neutral"
        variant="ghost"
        icon="i-lucide-arrow-left"
        size="sm"
        class="shrink-0"
        @click="navigateTo('/admin/roles')"
      >
        Kembali
      </UButton>
    </div>

    <div v-if="isLoadingRole" class="space-y-2">
      <div v-for="i in 5" :key="i" class="h-16 animate-pulse rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700/50 dark:bg-gray-800" />
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="perm in store.permissionKeys"
        :key="perm.key"
        class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700/50 dark:bg-gray-900"
      >
        <div class="flex-1 pr-3">
          <p class="font-medium text-gray-900 dark:text-gray-100">{{ perm.display_name }}</p>
          <p class="mt-0.5 text-sm text-gray-700 dark:text-gray-300">{{ perm.description || perm.key }}</p>
        </div>
        <div class="flex items-center gap-3">
          <UBadge
            v-if="isAssigned(perm.key)"
            color="neutral"
            variant="subtle"
            size="sm"
          >
            Aktif
          </UBadge>
          <USwitch
            :model-value="isAssigned(perm.key)"
            color="neutral"
            :disabled="!canEdit || toggling[perm.key]"
            @update:model-value="togglePermission(perm.key)"
          />
        </div>
      </div>

      <UAlert
        v-if="!canEdit && role && !isSystem"
        icon="i-lucide-info"
        color="neutral"
        variant="subtle"
        title="Hanya baca"
        description="Anda tidak memiliki permission manage_role_permissions untuk role custom ini."
      />
    </div>
  </div>
</template>