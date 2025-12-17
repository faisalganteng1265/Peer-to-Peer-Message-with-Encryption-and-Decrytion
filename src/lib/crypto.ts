export class CryptoClient {
  static savePrivateKey(userId: string, privateKey: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`private_key_${userId}`, privateKey)
    }
  }

  static getPrivateKey(userId: string): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`private_key_${userId}`)
    }
    return null
  }

  static removePrivateKey(userId: string) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`private_key_${userId}`)
    }
  }

  static async encryptMessage(message: string, publicKey: string): Promise<string> {
    const response = await fetch('http://localhost:8000/crypto/encrypt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, public_key: publicKey }),
    })

    const data = await response.json()
    return data.encrypted_message
  }

  static async decryptMessage(encryptedMessage: string, privateKey: string): Promise<string> {
    const response = await fetch('http://localhost:8000/crypto/decrypt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ encrypted_message: encryptedMessage, private_key: privateKey }),
    })

    const data = await response.json()
    return data.message
  }
}
