"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import UserList from '@/components/chat/UserList'
import ChatWindow from '@/components/chat/ChatWindow'
import { User } from '@/types'

export default function ChatPage() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const { user, isAuthenticated, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-blue-600 text-white p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">P2P Encrypted Chat</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm">{user?.username}</span>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-blue-700 rounded-lg hover:bg-blue-800"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 border-r bg-white">
          <UserList
            onSelectUser={setSelectedUser}
            selectedUserId={selectedUser?.id}
          />
        </div>

        <div className="flex-1 bg-gray-50">
          <ChatWindow selectedUser={selectedUser} />
        </div>
      </div>
    </div>
  )
}
