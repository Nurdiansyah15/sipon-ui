<script setup lang="ts">
import type { TableColumn, DropdownMenuItem } from '@nuxt/ui'
import { useRolePermissionStore } from '~/stores/rolePermission'
import { usePermission } from '~/composables/usePermission'
import type { RoleItem } from '#shared/types/RolePermission'

definePageMeta({ layout: 'admin' })

const store = useRolePermissionStore()
const toast = useToast()
const { can, canAny } = usePermission()

const page = ref(1)
const limit = ref(10)
const roleTypeFilter = ref<string>('all')

watch([page, limit, roleTypeFilter], () => load())
onMounted(load)

async function load() {
  try {
    await store.fetchRoles({
      page: page.value,
      limit: limit.value,
      role_type: roleTypeFilter.value && roleTypeFilter.value !== 'all' ? roleTypeFilter.value : undefined,
    })
  } catch (err) {
    // error sudah di-set ke store
  }
}

const createRoleOpen = ref(false)
const scopeManageOpen = ref(false)
const scopeRoleId = ref('')
const scopeRoleName = ref('')

// Update role terpakai oleh CreateRoleModal ketika klik "Edit" (opsional v1 tidak
// dibangun, tetapi disediakan ruangnya).
function rowActions(row: RoleItem): DropdownMenuItem[] {
  const items: DropdownMenuItem[] = []
  if (can('manage_role_permissions')) {
    items.push({
      label: 'Kelola Permission',
      icon: 'i-lucide-list-checks',
      onSelect: () => navigateTo(`/admin/roles/${row.id}/permissions`),
    })
    if (row.role_type === 'custom') {
      items.push({
        label: 'Kelola Scope',
        icon: 'i-lucide-filter',
        onSelect: () => {
          scopeRoleId.value = row.id
          scopeRoleName.value = row.display_name
          scopeManageOpen.value = true
        },
      })
    }
  }
  return items
}

const columns: TableColumn<RoleItem>[] = [
  { accessorKey: 'name', header: 'Nama Role' },
  { accessorKey: 'display_name', header: 'Nama Tampilan' },
  { accessorKey: 'role_type', header: 'Tipe' },
  { accessorKey: 'assignable', header: 'Assign' },
  { id: 'actions', header: 'Aksi' },
]

const totalPages = computed(() => store.rolesMeta?.total_pages ?? 1)
const totalItems = computed(() => store.rolesMeta?.total ?? 0)
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Kelola Role</h1>
        <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">
          Daftar role sistem &amp; custom. Role custom dapat diatur permission-nya per role.
        </p>
      </div>
      <UButton
        v-if="can('manage_roles')"
        icon="i-lucide-plus"
        class="bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400"
        @click="createRoleOpen = true"
      >
        Buat Role
      </UButton>
    </div>

    <div class="mb-4 flex flex-wrap items-center gap-2">
      <USelect
        v-model="roleTypeFilter"
        :items="[
          { label: 'Semua tipe', value: 'all' },
          { label: 'System', value: 'system' },
          { label: 'Custom', value: 'custom' },
        ]"
        class="w-40"
        :ui="{ base: 'bg-gray-50 dark:bg-gray-800', value: 'text-gray-900 dark:text-gray-100' }"
      />
    </div>

    <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700/50 dark:bg-gray-900">
      <UTable :data="store.roles" :columns="columns" :loading="store.isLoading" class="w-full" :ui="{ th: 'text-gray-900 font-bold dark:text-gray-100' }">
        <template #role_type-cell="{ row }">
          <UBadge
            color="neutral"
            :variant="row.original.role_type === 'system' ? 'subtle' : 'solid'"
            size="sm"
          >
            {{ row.original.role_type }}
          </UBadge>
        </template>

        <template #assignable-cell="{ row }">
          <UIcon
            :name="row.original.assignable ? 'i-lucide-check' : 'i-lucide-x'"
            :class="row.original.assignable ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'"
          />
        </template>

        <template #actions-cell="{ row }">
          <AppRowActions :items="rowActions(row.original)" />
        </template>
      </UTable>
    </div>

    <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-gray-700 dark:text-gray-300">
        Total {{ totalItems }} role · hal. {{ page }} / {{ totalPages }}
      </p>
      <UPagination
        v-model:page="page"
        :total="totalItems"
        :items-per-page="limit"
        :sibling-count="1"
        show-edges
      >
        <template #item="{ item, page: curPage }">
          <UButton
            :color="curPage === item.value ? 'teal' : 'neutral'"
            :variant="curPage === item.value ? 'solid' : 'outline'"
            :label="String(item.value)"
            size="sm"
            :class="curPage === item.value ? 'bg-teal-600 text-white dark:bg-teal-500' : ''"
          />
        </template>
      </UPagination>
    </div>

    <AdminCreateRoleModal v-model:open="createRoleOpen" @created="load" />

    <AdminRoleScopeManageModal
      v-model:open="scopeManageOpen"
      :role-id="scopeRoleId"
      :role-name="scopeRoleName"
      @updated="load"
    />
  </div>
</template>