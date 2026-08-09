/**
 * State collapse/expand sidebar desktop modul keuangan.
 * Dibagikan antara AppKeuanganNavbar (sidebar) dan layout keuangan.vue
 * (padding konten) lewat useState global + persist localStorage.
 */
export function useKeuanganSidebar() {
  const collapsed = useState<boolean>('keuangan-sidebar-collapsed', () => {
    if (import.meta.client) {
      return localStorage.getItem('sipon-keuangan-sidebar-collapsed') === '1'
    }
    return false
  })

  function toggleCollapsed() {
    collapsed.value = !collapsed.value
    if (import.meta.client) {
      localStorage.setItem('sipon-keuangan-sidebar-collapsed', collapsed.value ? '1' : '0')
    }
  }

  return { collapsed, toggleCollapsed }
}
