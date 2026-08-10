import { computed, ref } from 'vue'

export interface SnapResult {
  status_code?: string
  transaction_status?: string
  order_id?: string
  [key: string]: unknown
}

export interface SnapHandlers {
  onSuccess?: (result: SnapResult) => void
  onPending?: (result: SnapResult) => void
  onError?: (result: SnapResult) => void
  onClose?: () => void
}

interface SnapPay {
  pay: (token: string, handlers: SnapHandlers) => void
}

declare global {
  interface Window {
    snap?: SnapPay
  }
}

// loadPromise dibagi antar komponen agar script Snap hanya dimuat sekali.
let loadPromise: Promise<void> | null = null

export function useMidtransSnap() {
  const config = useRuntimeConfig()
  const isLoaded = ref(false)

  const snapUrl = computed(() => {
    const env = config.public.midtransEnv === 'production' ? 'production' : 'sandbox'
    return env === 'production'
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js'
  })

  const clientKey = computed(() => {
    return (config.public as Record<string, unknown>).midtransClientKey as string
  })

  async function loadSnap(): Promise<void> {
    if (import.meta.server) return
    if (window.snap) {
      isLoaded.value = true
      return
    }
    if (!clientKey.value) {
      throw new Error('Client key Midtrans belum dikonfigurasi. Hubungi administrator.')
    }
    if (loadPromise) return loadPromise

    loadPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = snapUrl.value
      script.setAttribute('data-client-key', clientKey.value)
      script.async = true
      script.onload = () => {
        isLoaded.value = true
        resolve()
      }
      script.onerror = () => {
        loadPromise = null
        reject(new Error('Gagal memuat layanan pembayaran Midtrans.'))
      }
      document.head.appendChild(script)
    })
    return loadPromise
  }

  function pay(snapToken: string, handlers: SnapHandlers): void {
    if (!window.snap) {
      throw new Error('Layanan pembayaran Snap belum siap.')
    }
    window.snap.pay(snapToken, handlers)
  }

  return { loadSnap, pay, isLoaded }
}
