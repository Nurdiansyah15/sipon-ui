// Tipe dokumen yang dipakai bersama oleh modul kesantrian (santri) dan PSB
// (pendaftar). Definisi tunggal — jangan duplikasi di file types modul lain
// supaya Nuxt tidak memperingatkan duplicated imports.

export type DokumenKind = 'surat_pernyataan' | 'ktp' | 'kk' | 'mutasi' | 'pembayaran'
export type DokumenStatus = 'pending' | 'verified' | 'rejected'
