<script setup lang="ts">
import type { SettingResponse } from "#shared/types/Psb";
import { usePsbSettingStore } from "~/stores/psbSetting";
import { parseApiError } from "~/utils/errorParser";

definePageMeta({ layout: "psb" });

const store = usePsbSettingStore();
const router = useRouter();
const toast = useToast();

const formOpen = ref(false);
const editTarget = ref<SettingResponse | null>(null);
const purgeOpen = ref(false);
const purgeTarget = ref<SettingResponse | null>(null);

onMounted(async () => {
  try {
    await store.fetchSettings();
  } catch {
    // error in store
  }
});

function formatDate(v: string) {
  return new Date(v).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function openCreate() {
  editTarget.value = null;
  formOpen.value = true;
}

function openEdit(s: SettingResponse) {
  editTarget.value = s;
  formOpen.value = true;
}

async function handleClose(s: SettingResponse) {
  try {
    await store.updateSetting(s.id, { status: "closed" });
    toast.add({ title: "Periode ditutup", color: "success" });
    await store.fetchSettings();
  } catch (err) {
    toast.add({
      title: "Gagal menutup periode",
      description: parseApiError(err),
      color: "error",
    });
  }
}

function openPurge(s: SettingResponse) {
  purgeTarget.value = s;
  purgeOpen.value = true;
}

async function afterMutate() {
  await store.fetchSettings();
}

const PROGRAM_LABELS: Record<string, string> = {
  tahfidh_pa: "Tahfidz Putra",
  tahfidh_pi: "Tahfidz Putri",
  reguler_pa: "Reguler Putra",
  reguler_pi: "Reguler Putri",
  smp: "SMP",
  mts: "MTs",
  ma: "MA",
}

function quotaSummary(q: Record<string, number> | undefined): string {
  if (!q || Object.keys(q).length === 0) return "—";
  return Object.entries(q)
    .map(([k, v]) => `${PROGRAM_LABELS[k] ?? k}: ${v}`)
    .join(", ");
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Periode PSB
        </h1>
        <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">
          Kelola periode pendaftaran, atur kuota per program, biaya, dan
          rekening bank.
        </p>
      </div>
      <UButton
        icon="i-lucide-plus"
        class="bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400"
        @click="openCreate"
      >
        Buat Periode
      </UButton>
    </div>

    <div v-if="store.isLoading" class="space-y-3">
      <USkeleton v-for="i in 3" :key="i" class="h-24 w-full" />
    </div>

    <div
      v-else-if="store.items.length === 0"
      class="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-900"
    >
      <UIcon
        name="i-lucide-calendar-off"
        class="mx-auto mb-2 h-10 w-10 text-gray-300"
      />
      <p class="text-gray-500">Belum ada periode PSB.</p>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="s in store.items"
        :key="s.id"
        class="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <h3
                class="font-semibold text-gray-900 dark:text-gray-100 truncate"
              >
                {{ s.name }}
              </h3>
              <UBadge
                :color="s.status === 'active' ? 'success' : 'neutral'"
                variant="subtle"
                size="sm"
              >
                {{ s.status === "active" ? "Aktif" : "Ditutup" }}
              </UBadge>
            </div>
            <p class="mt-1 text-sm text-gray-500">
              {{ formatDate(s.start_period) }} — {{ formatDate(s.end_period) }}
            </p>
            <p class="mt-1 text-xs text-gray-400">
              Rp {{ s.reg_fee.toLocaleString("id-ID") }}
              <span
                v-if="s.quota && Object.keys(s.quota).length > 0"
                class="ml-3"
                >· Kuota: {{ quotaSummary(s.quota) }}</span
              >
            </p>
            <p v-if="s.data_purged_at" class="mt-1 text-xs text-amber-600">
              Data dihapus: {{ formatDate(s.data_purged_at) }}
            </p>
          </div>

          <div class="flex flex-wrap gap-1">
            <UButton
              size="xs"
              variant="soft"
              icon="i-lucide-pencil"
              @click="openEdit(s)"
              >Edit</UButton
            >
            <UButton
              v-if="s.status === 'active'"
              size="xs"
              color="warning"
              variant="soft"
              icon="i-lucide-lock"
              @click="handleClose(s)"
            >
              Tutup
            </UButton>
            <UButton
              size="xs"
              color="error"
              variant="ghost"
              :disabled="s.status !== 'closed' || !!s.data_purged_at"
              @click="openPurge(s)"
            >
              Hapus Data
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <AdminPsbSettingFormModal
      v-model:open="formOpen"
      :edit="editTarget"
      @done="afterMutate"
    />

    <AdminPsbPurgeConfirmModal
      v-model:open="purgeOpen"
      :setting-id="purgeTarget?.id ?? ''"
      :setting-name="purgeTarget?.name ?? ''"
      :purged="!!purgeTarget?.data_purged_at"
      @done="afterMutate"
    />
  </div>
</template>
