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
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-b from-blue-50/50 to-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500">Loading contacts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-b from-blue-50/50 to-white">
      <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-500 text-white p-5 shadow-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold">Contacts</h2>
            <p className="text-xs text-blue-100">{users.length} available</p>
          </div>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 px-6 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700">No contacts yet</h3>
          <p className="text-sm text-gray-500 mt-2">Start by adding some contacts to begin chatting</p>
        </div>
      ) : (
        <div className="p-2">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => onSelectUser(user)}
              className={`w-full p-4 mb-2 text-left rounded-xl transition-all duration-200 group ${
                selectedUserId === user.id
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200'
                  : 'bg-white hover:bg-blue-50 border border-blue-100/50 hover:border-blue-200 hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`relative w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                  selectedUserId === user.id
                    ? 'bg-white/20 border-white/40 backdrop-blur-md'
                    : 'bg-gradient-to-br from-blue-400 to-blue-600 border-blue-300 group-hover:scale-110'
                }`}>
                  <span className={`text-lg font-bold ${selectedUserId === user.id ? 'text-white' : 'text-white'}`}>
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 ${
                    selectedUserId === user.id ? 'border-blue-600 bg-green-400' : 'border-white bg-green-400'
                  }`}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold truncate ${selectedUserId === user.id ? 'text-white' : 'text-gray-800'}`}>
                    {user.username}
                  </div>
                  <div className={`text-sm truncate ${selectedUserId === user.id ? 'text-blue-100' : 'text-gray-500'}`}>
                    {user.email}
                  </div>
                </div>
                {selectedUserId === user.id && (
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
