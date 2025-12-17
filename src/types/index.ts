export interface User {
  id: string
  username: string
  email: string
  public_key?: string
  created_at?: string
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  encrypted_content: string
  is_read: boolean
  created_at: string
}

export interface DecryptedMessage extends Omit<Message, 'encrypted_content'> {
  content: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
}
