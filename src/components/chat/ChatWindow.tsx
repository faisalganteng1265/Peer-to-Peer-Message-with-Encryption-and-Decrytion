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
    sentMessagesCache.current = new Map()

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
    // Reset messages when switching users
    setMessages([])

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
      console.log('Loading messages for:', { selectedUserId: selectedUser.id, currentUserId: currentUser.id })
      const response = await messageApi.getConversation(selectedUser.id, currentUser.id)
      console.log('API Response:', response.data)
      const encryptedMessages: Message[] = response.data

      const privateKey = CryptoClient.getPrivateKey(currentUser.id)
      console.log('Private key found:', !!privateKey)
      if (!privateKey) return

      const decrypted = await Promise.all(
        encryptedMessages.map(async (msg: any) => {
          console.log('Processing message:', { id: msg.id, sender: msg.sender_id, receiver: msg.receiver_id })

          if (msg.sender_id === currentUser.id) {
            const cached = sentMessagesCache.current.get(msg.id)
            if (cached) {
              console.log('Using cached message:', msg.id)
              return {
                ...msg,
                content: cached,
              }
            }

            if (msg.sender_encrypted_content) {
              try {
                console.log('Decrypting sender_encrypted_content for:', msg.id)
                const content = await CryptoClient.decryptMessage(msg.sender_encrypted_content, privateKey)
                return {
                  ...msg,
                  content,
                }
              } catch (error) {
                console.error('Failed to decrypt sender message:', error)
                return {
                  ...msg,
                  content: '[Failed to decrypt]',
                }
              }
            }

            console.log('No sender_encrypted_content for message:', msg.id)
            return {
              ...msg,
              content: '[Encrypted]',
            }
          }

          try {
            console.log('Decrypting received message:', msg.id)
            const content = await CryptoClient.decryptMessage(msg.encrypted_content, privateKey)
            return {
              ...msg,
              content,
            }
          } catch (error) {
            console.error('Failed to decrypt received message:', error)
            return {
              ...msg,
              content: '[Failed to decrypt]',
            }
          }
        })
      )

      console.log('Decrypted messages:', decrypted)
      setMessages(decrypted)

      const unreadMessages = encryptedMessages.filter(
        (msg: any) => msg.receiver_id === currentUser.id && !msg.is_read
      )

      for (const msg of unreadMessages) {
        try {
          await messageApi.markAsRead(msg.id)
        } catch (error) {
          console.error('Failed to mark message as read:', error)
        }
      }
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
      const encryptedForReceiver = await CryptoClient.encryptMessage(
        messagePlainText,
        selectedUser.public_key!
      )

      const encryptedForSender = await CryptoClient.encryptMessage(
        messagePlainText,
        currentUser.public_key!
      )

      const response = await messageApi.send(
        {
          receiver_id: selectedUser.id,
          encrypted_content: encryptedForReceiver,
          sender_encrypted_content: encryptedForSender,
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
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-blue-50/50 via-white to-blue-50/30">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-200">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-700">No conversation selected</h3>
            <p className="text-gray-500 mt-2">Choose a contact to start secure messaging</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-blue-50/30 via-white to-blue-50/20">
      <div className="relative bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 text-white p-6 shadow-lg">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-white/30 shadow-lg">
            <span className="text-xl font-bold">{selectedUser.username.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold tracking-wide">{selectedUser.username}</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
              <p className="text-sm text-blue-100">{selectedUser.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30">
            <svg className="w-4 h-4 text-green-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-medium">Encrypted</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-transparent to-blue-50/20">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <p className="text-gray-400 text-sm">No messages yet. Start the conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
            >
              <div
                className={`group relative max-w-xs lg:max-w-md px-5 py-3 rounded-2xl shadow-md transition-all hover:shadow-lg ${
                  msg.sender_id === currentUser?.id
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-md'
                    : 'bg-white text-gray-800 border border-blue-100 rounded-bl-md'
                }`}
              >
                <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                <div className={`flex items-center justify-end gap-1.5 mt-2 ${
                  msg.sender_id === currentUser?.id ? 'text-blue-100' : 'text-gray-400'
                }`}>
                  <span className="text-xs">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {msg.sender_id === currentUser?.id && (
                    msg.is_read ? (
                      <svg className="w-4 h-4 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.707 10.293a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414l3-3a1 1 0 011.414 0zM16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                      </svg>
                    )
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-5 bg-white/80 backdrop-blur-lg border-t border-blue-100/50 shadow-lg">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your encrypted message..."
              className="w-full px-5 py-3.5 pr-12 bg-gray-50 border-2 border-blue-100 rounded-2xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all text-gray-800 placeholder-gray-400"
              disabled={sending}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="relative px-6 py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl font-medium shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95 group"
          >
            <span className="flex items-center gap-2">
              {sending ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Sending</span>
                </>
              ) : (
                <>
                  <span>Send</span>
                  <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </>
              )}
            </span>
          </button>
        </div>
        <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
          <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <span>Messages are end-to-end encrypted with RSA-2048</span>
        </div>
      </form>
    </div>
  )
}
