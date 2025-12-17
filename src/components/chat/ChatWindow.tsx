"use client"

import { useState, useEffect, useRef } from 'react'
import { User, Message } from '@/types'
import { messageApi } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { CryptoClient } from '@/lib/crypto'

interface ChatWindowProps {
  selectedUser: User | null
}

interface DecryptedMessage {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  is_read: boolean
}

export default function ChatWindow({ selectedUser }: ChatWindowProps) {
  const [messages, setMessages] = useState<DecryptedMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const { user: currentUser } = useAuth()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const sentMessagesCache = useRef<Map<string, string>>(new Map())

  useEffect(() => {
    if (currentUser) {
      const cached = localStorage.getItem(`sent_messages_${currentUser.id}`)
      if (cached) {
        try {
          const parsed = JSON.parse(cached)
          sentMessagesCache.current = new Map(Object.entries(parsed))
        } catch (e) {
          console.error('Failed to load sent messages cache:', e)
        }
      }
    }
  }, [currentUser])

  useEffect(() => {
    if (selectedUser && currentUser) {
      loadMessages()
      const interval = setInterval(loadMessages, 3000)
      return () => clearInterval(interval)
    }
  }, [selectedUser, currentUser])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadMessages = async () => {
    if (!selectedUser || !currentUser) return

    setLoading(true)
    try {
      const response = await messageApi.getConversation(selectedUser.id, currentUser.id)
      const encryptedMessages: Message[] = response.data

      const privateKey = CryptoClient.getPrivateKey(currentUser.id)
      if (!privateKey) return

      const decrypted = await Promise.all(
        encryptedMessages.map(async (msg) => {
          if (msg.sender_id === currentUser.id) {
            const cached = sentMessagesCache.current.get(msg.id)
            if (cached) {
              return {
                ...msg,
                content: cached,
              }
            }
            return {
              ...msg,
              content: '[Encrypted]',
            }
          }

          try {
            const content = await CryptoClient.decryptMessage(msg.encrypted_content, privateKey)
            return {
              ...msg,
              content,
            }
          } catch (error) {
            return {
              ...msg,
              content: '[Failed to decrypt]',
            }
          }
        })
      )

      setMessages(decrypted)
    } catch (error) {
      console.error('Failed to load messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedUser || !currentUser) return

    setSending(true)
    const messagePlainText = newMessage

    try {
      const encrypted = await CryptoClient.encryptMessage(
        messagePlainText,
        selectedUser.public_key!
      )

      const response = await messageApi.send(
        {
          receiver_id: selectedUser.id,
          encrypted_content: encrypted,
        },
        currentUser.id
      )

      const newMsg: DecryptedMessage = {
        ...response.data,
        content: messagePlainText,
      }

      sentMessagesCache.current.set(response.data.id, messagePlainText)

      const cacheObj = Object.fromEntries(sentMessagesCache.current)
      localStorage.setItem(`sent_messages_${currentUser.id}`, JSON.stringify(cacheObj))

      setMessages(prev => [...prev, newMsg])
      setNewMessage('')
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSending(false)
    }
  }

  if (!selectedUser) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Select a user to start chatting
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b bg-white">
        <h2 className="text-xl font-bold">{selectedUser.username}</h2>
        <p className="text-sm text-gray-500">{selectedUser.email}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                msg.sender_id === currentUser?.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-900'
              }`}
            >
              <p>{msg.content}</p>
              <p className="text-xs mt-1 opacity-70">
                {new Date(msg.created_at).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}
