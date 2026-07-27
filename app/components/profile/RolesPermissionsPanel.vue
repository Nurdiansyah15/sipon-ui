<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()

const roles = computed(() => authStore.roles)
const permissions = computed(() => authStore.permissions)

function scopeLabel(scopeType: string, scopeId: string | null) {
  if (scopeType === 'global') return 'Global'
  return scopeId ? `${scopeType} · ${scopeId}` : scopeType
}
</script>

<template>
  <div class="space-y-8">
    <div>
      <h3 class="text-sm font-semibold text-gray-900">Roles yang dimiliki</h3>

      <p v-if="!roles.length" class="mt-2 text-sm text-gray-500">
        Anda tidak memiliki roles.
      </p>

      <div v-else class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="role in roles"
          :key="`${role.name}-${role.scope_type}-${role.scope_id ?? 'global'}`"
          class="rounded-lg border border-gray-200 bg-white p-4"
        >
          <div class="flex items-center justify-between gap-2">
            <p class="text-sm font-medium text-gray-900">{{ role.name }}</p>
            <UBadge :color="role.role_type === 'system' ? 'neutral' : 'primary'" variant="subtle" size="sm">
              {{ role.role_type === 'system' ? 'System' : 'Custom' }}
            </UBadge>
          </div>
          <p class="mt-1 text-xs text-gray-500">{{ scopeLabel(role.scope_type, role.scope_id) }}</p>
        </div>
      </div>
    </div>

    <div>
      <h3 class="text-sm font-semibold text-gray-900">Permissions efektif</h3>

      <p v-if="!permissions.length" class="mt-2 text-sm text-gray-500">
        Anda tidak memiliki permissions.
      </p>

      <div v-else class="mt-3 overflow-hidden rounded-lg border border-gray-200">
        <table class="w-full divide-y divide-gray-200 text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-2 text-left font-semibold text-gray-900">Permission</th>
              <th class="px-4 py-2 text-left font-semibold text-gray-900">Scope</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white">
            <tr v-for="perm in permissions" :key="`${perm.key}-${perm.scope}`">
              <td class="px-4 py-2 text-gray-900">{{ perm.key }}</td>
              <td class="px-4 py-2 text-gray-500">{{ perm.scope }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
