export interface GoogleLinkedAccount {
  linked: boolean
  email: string | null
  can_unlink: boolean
}

export interface LinkedAccountsResponse {
  google: GoogleLinkedAccount
}
