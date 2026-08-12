<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { z } from 'zod'
import type { FingerprintScanLog, SimulateScanRequest } from '#shared/types/Akademik'
import { useFingerprintStore } from '~/stores/fingerprint'
import { usePermission } from '~/composables/usePermission'

definePageMeta({ layout: 'akademik' })

const store = useFingerprintStore()
const toast = useToast()
const { can } = usePermission()

// ── Simulasi scan (sandbox) ─────────────────────────────────────────────────

const schema = z.object({
  pin: z.string().min(1, 'PIN/NIS wajib diisi'),
  sn: z.string().optional(),
  scan_date: z.string().optional(),
  verifymode: z.string().optional(),
  inoutmode: z.string().optional(),
  deviceip: z.string().optional(),
})
type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  pin: '',
  sn: '',
  scan_date: '',
  verifymode: '',
  inoutmode: '',
  deviceip: '',
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  const payload: SimulateScanRequest = {
    pin: event.data.pin.trim(),
    sn: event.data.sn?.trim() || undefined,
    scan_date: event.data.scan_date?.trim() || undefined,
    deviceip: event.data.deviceip?.trim() || undefined,
    verifymode: event.data.verifymode ? Number(event.data.verifymode) : undefined,
    inoutmode: event.data.inoutmode ? Number(event.data.inoutmode) : undefined,
  }
  try {
    const scan = await store.simulateScan(payload)
    toast.add({
      title: `Scan simulasi dicatat untuk PIN ${scan.pin}`,
      color: 'success',
    })
    state.pin = ''
    state.scan_date = ''
    await store.fetchScans(fromFilter.value || undefined, toFilter.value || undefined)
  } catch {
    toast.add({ title: store.error ?? 'Gagal mencatat scan simulasi', color: 'error' })
  }
}

// ── Log scan (debug) ─────────────────────────────────────────────────────────

const fromFilter = ref('')
const toFilter = ref('')

async function loadScans() {
  try {
    await store.fetchScans(fromFilter.value || undefined, toFilter.value || undefined)
  } catch {
    toast.add({ title: store.error ?? 'Gagal memuat daftar scan', color: 'error' })
  }
}

onMounted(loadScans)

const columns: TableColumn<FingerprintScanLog>[] = [
  { accessorKey: 'scan_date', header: 'Waktu Scan' },
  { accessorKey: 'pin', header: 'PIN/NIS' },
  { accessorKey: 'sn', header: 'Mesin (SN)' },
  { accessorKey: 'verifymode', header: 'Verify' },
  { accessorKey: 'inoutmode', header: 'In/Out' },
  { accessorKey: 'deviceip', header: 'IP' },
]

function fmtDateTime(v: string) {
  return new Date(v).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function modeLabel(v: number) {
  return v === 0 ? 'Masuk' : v === 1 ? 'Keluar' : String(v)
}
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-8">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Fingerprint</h1>
        <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">
          Integrasi absensi mesin fingerprint — sandbox simulasi &amp; inspeksi log scan mentah.
        </p>
      </div>
      <UButton
        to="/admin/akademik"
        icon="i-lucide-arrow-left"
        color="neutral"
        variant="outline"
      >
        Kembali
      </UButton>
    </div>

    <template v-if="can('manage_akademik')">
      <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
        <div class="mb-4 flex items-center gap-2">
          <UIcon name="i-lucide-flask-conical" class="h-5 w-5 text-teal-600" />
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Simulasi Scan (Sandbox)</h2>
        </div>
        <p class="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Menulis scan palsu dengan skema yang sama dengan mesin fingerprint asli. Hanya aktif saat
          <code class="rounded bg-gray-100 px-1 py-0.5 font-mono text-xs dark:bg-gray-800">FINGERPRINT_SANDBOX_ENABLED=true</code>.
          <code class="rounded bg-gray-100 px-1 py-0.5 font-mono text-xs dark:bg-gray-800">pin</code> berisi NIS santri.
        </p>

        <UForm :schema="schema" :state="state" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" @submit="onSubmit">
          <UFormField label="PIN / NIS" name="pin" required class="w-full">
            <UInput v-model="state.pin" placeholder="1000101001" class="w-full" />
          </UFormField>

          <UFormField label="SN Mesin" name="sn" class="w-full">
            <UInput v-model="state.sn" placeholder="SANDBOX-DEVICE-01" class="w-full" />
          </UFormField>

          <UFormField label="Waktu Scan" name="scan_date" class="w-full">
            <UInput
              v-model="state.scan_date"
              placeholder="2026-08-13T08:30:00+07:00"
              hint="RFC3339 — kosong = sekarang"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Verify Mode" name="verifymode" class="w-full">
            <UInput v-model="state.verifymode" placeholder="1" type="number" class="w-full" />
          </UFormField>

          <UFormField label="In/Out Mode" name="inoutmode" class="w-full">
            <UInput v-model="state.inoutmode" placeholder="0" type="number" class="w-full" />
          </UFormField>

          <UFormField label="IP Mesin" name="deviceip" class="w-full">
            <UInput v-model="state.deviceip" placeholder="192.168.1.50" class="w-full" />
          </UFormField>

          <div class="flex items-end sm:col-span-2 lg:col-span-3">
            <UButton type="submit" :loading="store.isSubmitting" color="primary" icon="i-lucide-fingerprint-pattern">
              Simulasikan Scan
            </UButton>
          </div>
        </UForm>
      </div>

      <div class="mt-6 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Log Scan</h2>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Scan mentah dalam rentang waktu (debug).</p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <UInput v-model="fromFilter" placeholder="Dari (RFC3339)" size="sm" class="w-48" />
            <UInput v-model="toFilter" placeholder="Sampai (RFC3339)" size="sm" class="w-48" />
            <UButton
              size="sm"
              color="neutral"
              variant="outline"
              icon="i-lucide-refresh-cw"
              :loading="store.isLoading"
              @click="loadScans"
            >
              Muat Ulang
            </UButton>
          </div>
        </div>

        <div class="overflow-x-auto">
          <UTable
            :data="store.scans"
            :columns="columns"
            :loading="store.isLoading"
            class="w-full"
            :ui="{ th: 'text-gray-900 font-bold dark:text-gray-100' }"
          >
            <template #scan_date-cell="{ row }">
              <span class="text-sm text-gray-700 dark:text-gray-300">{{ fmtDateTime(row.original.scan_date) }}</span>
            </template>

            <template #pin-cell="{ row }">
              <span class="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">{{ row.original.pin }}</span>
            </template>

            <template #sn-cell="{ row }">
              <span class="font-mono text-sm text-gray-700 dark:text-gray-300">{{ row.original.sn }}</span>
            </template>

            <template #verifymode-cell="{ row }">
              <span class="text-sm text-gray-700 dark:text-gray-300">{{ row.original.verifymode }}</span>
            </template>

            <template #inoutmode-cell="{ row }">
              <span class="text-sm text-gray-700 dark:text-gray-300">{{ modeLabel(row.original.inoutmode) }}</span>
            </template>

            <template #deviceip-cell="{ row }">
              <span class="font-mono text-sm text-gray-700 dark:text-gray-300">{{ row.original.deviceip || '-' }}</span>
            </template>
          </UTable>
        </div>

        <div v-if="store.scans.length === 0 && !store.isLoading" class="mt-3 rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
          Belum ada scan pada rentang ini.
        </div>
      </div>
    </template>

    <div v-else class="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500 dark:border-gray-600 dark:text-gray-400">
      Anda tidak memiliki akses ke menu ini.
    </div>
  </div>
</template>
