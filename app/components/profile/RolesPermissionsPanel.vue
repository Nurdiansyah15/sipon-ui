<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()

const roles = computed(() => authStore.roles)
const permissions = computed(() => authStore.permissions)
const scopes = computed(() => authStore.scopes)

function scopeLabel(scopeType: string, scopeId: string | null) {
  if (scopeType === 'global') return 'Global'
  return scopeId ? `${scopeType} · ${scopeId}` : scopeType
}

function userScopeLabel(type: string, value: string) {
  if (type === 'gender') return value === 'male' ? 'Putra' : 'Putri'
  return value
}

function userScopeTypeLabel(type: string) {
  if (type === 'gender') return 'Gender'
  return type
}
</script>

<template>
  <div class="space-y-8">
    <div>
      <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Roles yang dimiliki</h3>

      <p v-if="!roles.length" class="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Anda tidak memiliki roles.
      </p>

      <div v-else class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="role in roles"
          :key="`${role.name}-${role.scope_type}-${role.scope_id ?? 'global'}`"
          class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700/50 dark:bg-gray-900"
        >
          <div class="flex items-center justify-between gap-2">
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ role.name }}</p>
            <UBadge :color="role.role_type === 'system' ? 'neutral' : 'primary'" variant="subtle" size="sm">
              {{ role.role_type === 'system' ? 'System' : 'Custom' }}
            </UBadge>
          </div>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ scopeLabel(role.scope_type, role.scope_id) }}</p>
        </div>
      </div>
    </div>

    <div>
      <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Data Scopes</h3>

      <p v-if="!scopes.length" class="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Tidak ada filter scope yang aktif. Anda dapat melihat semua data.
      </p>

      <div v-else class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="(s, idx) in scopes"
          :key="idx"
          class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700/50 dark:bg-gray-900"
        >
          <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {{ userScopeTypeLabel(s.scope_type) }}
          </p>
          <p class="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
            {{ userScopeLabel(s.scope_type, s.scope_value) }}
          </p>
        </div>
      </div>
    </div>

    <div>
      <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Permissions efektif</h3>

      <p v-if="!permissions.length" class="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Anda tidak memiliki permissions.
      </p>

      <div v-else class="mt-3 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700/50">
        <table class="w-full divide-y divide-gray-200 text-sm">
          <thead class="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th class="px-4 py-2 text-left font-semibold text-gray-900 dark:text-gray-100">Permission</th>
              <th class="px-4 py-2 text-left font-semibold text-gray-900 dark:text-gray-100">Scope</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white dark:bg-gray-900">
            <tr v-for="perm in permissions" :key="`${perm.key}-${perm.scope}`">
              <td class="px-4 py-2 text-gray-900 dark:text-gray-100">{{ perm.key }}</td>
              <td class="px-4 py-2 text-gray-500 dark:text-gray-400">{{ perm.scope }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
