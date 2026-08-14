const GSI_SCRIPT_SRC = 'https://accounts.google.com/gsi/client'
const MAX_GSI_WAIT_MS = 10_000
const GSI_POLL_INTERVAL_MS = 100

// Script GSI hanya perlu di-inject sekali per halaman; beberapa komponen
// (login.vue, LinkedAccountsPanel.vue) bisa hidup berdampingan.
let gsiScriptInjected = false

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string, callback: (resp: { credential?: string }) => void }) => void
          renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void
          prompt: () => void
        }
      }
    }
  }
}

interface GoogleIdentityState {
  isReady: boolean
  isTimedOut: boolean
  error: string | null
}

/**
 * Composable untuk Google Identity Services (GSI):
 * - Meng-inject script https://accounts.google.com/gsi/client sekali saja.
 * - Menunggu window.google tersedia dengan polling berbatas (10 detik),
 *   plus cleanup otomatis saat komponen di-unmount.
 *
 * Contoh:
 *   const gsi = useGoogleIdentity()
 *   await gsi.init(clientId, handleCredential)
 *   gsi.renderButton('google-btn-container', { theme: 'outline', size: 'large' })
 */
export function useGoogleIdentity() {
  const isReady = ref(false)
  const isTimedOut = ref(false)
  const error = ref<string | null>(null)

  const config = useRuntimeConfig()
  const clientId = computed(() => config.public.googleClientId || '')

  function injectScript() {
    if (gsiScriptInjected) return
    gsiScriptInjected = true
    const existing = document.querySelector(`script[src="${GSI_SCRIPT_SRC}"]`)
    if (existing) return
    const script = document.createElement('script')
    script.src = GSI_SCRIPT_SRC
    script.async = true
    script.defer = true
    document.head.appendChild(script)
  }

  function init(clientIdValue: string, callback: (resp: { credential?: string }) => void): Promise<boolean> {
    if (!clientIdValue) {
      error.value = 'Google client ID belum dikonfigurasi.'
      return Promise.resolve(false)
    }

    injectScript()

    return new Promise<boolean>((resolve) => {
      const start = Date.now()

      const poll = () => {
        if (typeof window !== 'undefined' && window.google?.accounts?.id) {
          isReady.value = true
          isTimedOut.value = false
          error.value = null
          window.google.accounts.id.initialize({
            client_id: clientIdValue,
            callback,
          })
          resolve(true)
          return
        }

        if (Date.now() - start >= MAX_GSI_WAIT_MS) {
          isTimedOut.value = true
          error.value = 'Google Sign-In tidak dapat dimuat. Periksa koneksi atau aktifkan JavaScript.'
          resolve(false)
          return
        }

        timer = window.setTimeout(poll, GSI_POLL_INTERVAL_MS)
      }

      let timer = window.setTimeout(poll, 0)

      onScopeDispose(() => {
        window.clearTimeout(timer)
      })
    })
  }

  function renderButton(containerId: string, opts: Record<string, unknown> = {}) {
    if (!isReady.value) return
    const container = document.getElementById(containerId)
    if (!container) return
    container.innerHTML = ''
    window.google?.accounts.id.renderButton(container, opts)
  }

  return reactive({
    clientId,
    isReady,
    isTimedOut,
    error,
    init,
    renderButton,
  })
}
