<script setup lang="ts">
import type { TableColumn, DropdownMenuItem } from '@nuxt/ui'
import { useUserManagementStore } from '~/stores/userManagement'
import { useRolePermissionStore } from '~/stores/rolePermission'
import { usePermission } from '~/composables/usePermission'
import type { UserManagementItem } from '#shared/types/UserManagement'

definePageMeta({ layout: 'system-admin' })

const store = useUserManagementStore()
const roleStore = useRolePermissionStore()
const toast = useToast()
const { can, canAny } = usePermission()

const page = ref(1)
const limit = ref(10)
const search = ref('')
const statusFilter = ref<string>('all')

let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    load()
  }, 300)
})
watch([page, limit, statusFilter], () => load())

async function load() {
  try {
    await store.fetchUsers({
      page: page.value,
      limit: limit.value,
      search: search.value || undefined,
      status: statusFilter.value && statusFilter.value !== 'all' ? statusFilter.value : undefined,
    })
  } catch (err) {
    // error sudah di-set ke store
  }
}

onMounted(load)

// ── Modals state ───────────────────────────────────────────────────────────────
const createUserOpen = ref(false)
const resetPasswordOpen = ref(false)
const resetPasswordValue = ref('')
const resetTargetName = ref('')
const assignRoleOpen = ref(false)
const assignTargetId = ref('')
const assignTargetName = ref('')

function openAssignRole(row: UserManagementItem) {
  assignTargetId.value = row.id
  assignTargetName.value = row.fullname || row.username
  assignRoleOpen.value = true
}

async function openResetPassword(row: UserManagementItem) {
  try {
    const res = await store.resetUserPassword(row.id)
    resetPasswordValue.value = res.generated_password
    resetTargetName.value = row.fullname || row.username
    resetPasswordOpen.value = true
  } catch (err) {
    toast.add({
      title: 'Gagal setel ulang kata sandi',
      description: store.error ?? undefined,
      color: 'error',
    })
  }
}

async function toggleStatus(row: UserManagementItem) {
  const activating = row.status !== 'ACTIVE'
  try {
    if (activating) await store.reactivateUser(row.id)
    else await store.deactivateUser(row.id)
    toast.add({
      title: activating ? 'User diaktifkan kembali' : 'User dinonaktifkan',
      color: 'success',
    })
    await load()
  } catch (err) {
    toast.add({
      title: 'Gagal mengubah status user',
      description: store.error ?? undefined,
      color: 'error',
    })
  }
}

// ── Action dropdown per row ─────────────────────────────────────────────────────
function rowActions(row: UserManagementItem): DropdownMenuItem[] {
  const items: DropdownMenuItem[] = []
  if (can('assign_role')) {
    items.push({
      label: 'Kelola Role',
      icon: 'i-lucide-shield',
      onSelect: () => openAssignRole(row),
    })
  }
  if (can('reset_user_password')) {
    items.push({
      label: 'Setel Ulang Kata Sandi',
      icon: 'i-lucide-key-round',
      onSelect: () => openResetPassword(row),
    })
  }
  if (can('deactivate_user')) {
    items.push({
      label: row.status === 'ACTIVE' ? 'Nonaktifkan' : 'Aktifkan Kembali',
      icon: row.status === 'ACTIVE' ? 'i-lucide-ban' : 'i-lucide-circle-check',
      color: row.status === 'ACTIVE' ? 'error' : 'success',
      onSelect: () => toggleStatus(row),
    })
  }
  return items
}

// ── Table columns ──────────────────────────────────────────────────────────────
const columns: TableColumn<UserManagementItem>[] = [
  { accessorKey: 'username', header: 'Username' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'roles', header: 'Roles' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'created_at', header: 'Dibuat' },
  { id: 'actions', header: 'Aksi' },
]

const totalPages = computed(() => store.meta?.total_pages ?? 1)
const totalItems = computed(() => store.meta?.total ?? 0)

function formatDate(value?: string | null) {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

function statusBadgeColor(status: string) {
  return status === 'ACTIVE' ? 'success' : 'error'
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Kelola User</h1>
        <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">Buat user, kelola role, dan status akun.</p>
      </div>
      <UButton
        v-if="can('manage_users')"
        icon="i-lucide-plus"
        class="bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400"
        @click="createUserOpen = true"
      >
        Buat User
      </UButton>
    </div>

    <!-- Filter bar -->
    <div class="mb-4 flex flex-wrap items-center gap-2">
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Cari username, email, atau nama…"
        class="w-full sm:w-80"
        :ui="{ base: 'bg-gray-50 text-gray-900 placeholder:text-gray-400 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500' }"
      />
      <USelect
        v-model="statusFilter"
        :items="[
          { label: 'Semua status', value: 'all' },
          { label: 'Aktif', value: 'ACTIVE' },
          { label: 'Nonaktif', value: 'BANNED' },
        ]"
        class="w-40"
        :ui="{ base: 'bg-gray-50 dark:bg-gray-800', value: 'text-gray-900 dark:text-gray-100' }"
      />
    </div>

    <!-- Table -->
    <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700/50 dark:bg-gray-900">
      <UTable
        :data="store.items"
        :columns="columns"
        :loading="store.isLoading"
        class="w-full"
        :ui="{ th: 'text-gray-900 font-bold' }"
      >
        <template #roles-cell="{ row }">
          <div class="flex flex-wrap gap-1">
            <template v-if="row.original.roles && row.original.roles.length > 0">
              <UBadge v-for="role in row.original.roles" :key="role.id" variant="subtle" color="neutral" size="sm">
                {{ role.role_name }}
              </UBadge>
            </template>
            <span v-else class="text-xs text-gray-400 dark:text-gray-500">-</span>
          </div>
        </template>

        <template #status-cell="{ row }">
          <UBadge :color="statusBadgeColor(row.original.status)" variant="subtle" size="sm">
            {{ row.original.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif' }}
          </UBadge>
        </template>

        <template #created_at-cell="{ row }">
          <span class="text-xs text-gray-700 dark:text-gray-300">{{ formatDate(row.original.created_at) }}</span>
        </template>

        <template #actions-cell="{ row }">
          <AppRowActions :items="rowActions(row.original)" />
        </template>
      </UTable>
    </div>

    <!-- Pagination -->
    <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-gray-700 dark:text-gray-300">
        Total {{ totalItems }} user · hal. {{ page }} / {{ totalPages }}
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

    <!-- Modals -->
    <SystemAdminCreateUserModal
      v-model:open="createUserOpen"
      @created="load"
    />

    <SystemAdminResetPasswordResultModal
      v-model:open="resetPasswordOpen"
      :password="resetPasswordValue"
    />

    <SystemAdminAssignRoleModal
      v-model:open="assignRoleOpen"
      :target-user-id="assignTargetId"
      :target-user-name="assignTargetName"
      @updated="load"
    />
  </div>
</template>