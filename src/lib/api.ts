import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const authApi = {
  register: (data: { username: string; email: string; password: string }) =>
    api.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  generateKeys: () =>
    api.post('/auth/generate-keys'),
}

export const messageApi = {
  send: (data: { receiver_id: string; encrypted_content: string; sender_encrypted_content?: string }, sender_id: string) =>
    api.post(`/messages/send?sender_id=${sender_id}`, data),

  getConversation: (userId: string, currentUserId: string) =>
    api.get(`/messages/conversation/${userId}?current_user_id=${currentUserId}`),

  getInbox: (userId: string) =>
    api.get(`/messages/inbox/${userId}`),

  markAsRead: (messageId: string) =>
    api.put(`/messages/${messageId}/read`),
}

export const cryptoApi = {
  encrypt: (data: { message: string; public_key: string }) =>
    api.post('/crypto/encrypt', data),

  decrypt: (data: { encrypted_message: string; private_key: string }) =>
    api.post('/crypto/decrypt', data),
}

export const userApi = {
  getUsers: (currentUserId?: string) =>
    api.get('/users', { params: { current_user_id: currentUserId } }),

  getUser: (userId: string) =>
    api.get(`/users/${userId}`),

  searchUsers: (query: string, currentUserId?: string) =>
    api.get(`/users/search/${query}`, { params: { current_user_id: currentUserId } }),
}
