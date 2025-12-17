"use client"

import { useEffect, useState } from 'react'
import { User } from '@/types'
import { userApi } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'

interface UserListProps {
  onSelectUser: (user: User) => void
  selectedUserId?: string
}

export default function UserList({ onSelectUser, selectedUserId }: UserListProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const { user: currentUser } = useAuth()

  useEffect(() => {
    loadUsers()
  }, [currentUser])

  const loadUsers = async () => {
    try {
      const response = await userApi.getUsers(currentUser?.id)
      setUsers(response.data)
    } catch (error) {
      console.error('Failed to load users:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-4">Loading users...</div>
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold">Contacts</h2>
      </div>
      <div className="divide-y">
        {users.map((user) => (
          <button
            key={user.id}
            onClick={() => onSelectUser(user)}
            className={`w-full p-4 text-left hover:bg-gray-50 transition ${
              selectedUserId === user.id ? 'bg-blue-50' : ''
            }`}
          >
            <div className="font-medium">{user.username}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
