# Laporan Project: P2P Encrypted Messaging Application

## 1. Pendahuluan

### 1.1 Deskripsi Project
Project ini adalah aplikasi messaging peer-to-peer dengan enkripsi end-to-end menggunakan algoritma RSA 2048-bit. Aplikasi ini memungkinkan pengguna untuk mengirim dan menerima pesan terenkripsi dengan aman, dimana hanya pengirim dan penerima yang dapat membaca isi pesan.

### 1.2 Tujuan
- Menyediakan platform komunikasi yang aman dengan enkripsi end-to-end
- Implementasi kriptografi asimetrik (RSA) untuk keamanan pesan
- Memastikan private key tidak pernah meninggalkan client untuk keamanan maksimal

---

## 2. Tech Stack

### 2.1 Backend
| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| Python | 3.12 | Bahasa pemrograman utama backend |
| FastAPI | 0.115.6 | Web framework untuk REST API |
| Uvicorn | 0.34.0 | ASGI server untuk menjalankan FastAPI |
| Supabase | 2.10.0 | Database PostgreSQL cloud |
| Cryptography | 44.0.0 | Library untuk enkripsi/dekripsi RSA |
| Bcrypt | 5.0.0 | Hashing password |
| Pydantic | 2.10.4 | Validasi data dan settings |

### 2.2 Frontend
| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| Next.js | 16.0.10 | React framework untuk SSR/SSG |
| React | 19.2.3 | Library UI |
| TypeScript | 5.9.3 | Type-safe JavaScript |
| Tailwind CSS | 3.4.17 | Utility-first CSS framework |
| Zustand | 5.0.9 | State management |
| Axios | 1.13.2 | HTTP client |
| Supabase Client | 2.88.0 | Client library untuk Supabase |

---

## 3. Arsitektur Sistem

### 3.1 Diagram Alur Sistem

```
┌─────────────────┐         ┌──────────────────┐         ┌────────────────┐
│   Next.js       │         │  FastAPI         │         │   Supabase     │
│   Frontend      │◄───────►│  Backend         │◄───────►│   PostgreSQL   │
│                 │  HTTPS  │                  │  HTTPS  │                │
│ - UI/UX         │         │ - REST API       │         │ - users        │
│ - Encryption    │         │ - Encryption     │         │ - messages     │
│ - Private Key   │         │ - Authentication │         │ - public_keys  │
│   Storage       │         │ - Validation     │         │                │
└─────────────────┘         └──────────────────┘         └────────────────┘
```

### 3.2 Flow Komunikasi

#### A. Registrasi User
1. User mengisi form registrasi (username, email, password)
2. Frontend mengirim data ke backend
3. Backend generate RSA key pair (2048-bit)
4. Password di-hash menggunakan bcrypt
5. Public key disimpan di database
6. Private key dikembalikan ke frontend
7. Frontend menyimpan private key di localStorage

#### B. Mengirim Pesan
1. User menulis pesan di chat interface
2. Frontend encrypt pesan dengan public key penerima
3. Encrypted message dikirim ke backend
4. Backend menyimpan encrypted message ke database
5. Pesan plain text disimpan di localStorage cache pengirim

#### C. Menerima Pesan
1. Frontend fetch encrypted messages dari backend
2. Private key diambil dari localStorage
3. Frontend decrypt pesan dengan private key penerima
4. Pesan ditampilkan dalam bentuk plain text

---

## 4. Fungsionalitas

### 4.1 Authentication & Authorization

#### 4.1.1 Register
**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "username": "john_doe",
    "email": "john@example.com",
    "public_key": "-----BEGIN PUBLIC KEY-----..."
  },
  "private_key": "-----BEGIN PRIVATE KEY-----..."
}
```

**Proses:**
- Validasi input data
- Check email sudah terdaftar atau belum
- Hash password dengan bcrypt
- Generate RSA key pair (2048-bit)
- Simpan user + public key ke database
- Return private key ke client

#### 4.1.2 Login
**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "username": "john_doe",
    "email": "john@example.com",
    "public_key": "-----BEGIN PUBLIC KEY-----..."
  }
}
```

**Proses:**
- Cari user berdasarkan email
- Verifikasi password dengan bcrypt
- Return user data tanpa private key

### 4.2 Encryption & Decryption

#### 4.2.1 Generate Key Pair
**Endpoint:** `POST /auth/generate-keys`

**Response:**
```json
{
  "public_key": "-----BEGIN PUBLIC KEY-----...",
  "private_key": "-----BEGIN PRIVATE KEY-----..."
}
```

**Fungsi:**
- Generate pasangan RSA keys baru
- Menggunakan algoritma RSA 2048-bit
- Public exponent: 65537

#### 4.2.2 Encrypt Message
**Endpoint:** `POST /crypto/encrypt`

**Request Body:**
```json
{
  "message": "Hello World",
  "public_key": "-----BEGIN PUBLIC KEY-----..."
}
```

**Response:**
```json
{
  "encrypted_message": "base64_encoded_encrypted_string..."
}
```

**Proses:**
- Load public key dari PEM format
- Encrypt message dengan RSA-OAEP
- Padding: MGF1 dengan SHA-256
- Encode hasil enkripsi dengan base64

#### 4.2.3 Decrypt Message
**Endpoint:** `POST /crypto/decrypt`

**Request Body:**
```json
{
  "encrypted_message": "base64_encoded_encrypted_string...",
  "private_key": "-----BEGIN PRIVATE KEY-----..."
}
```

**Response:**
```json
{
  "message": "Hello World"
}
```

**Proses:**
- Load private key dari PEM format
- Decode base64 encrypted message
- Decrypt dengan RSA-OAEP
- Return plain text message

### 4.3 Messaging

#### 4.3.1 Send Message
**Endpoint:** `POST /messages/send?sender_id={uuid}`

**Request Body:**
```json
{
  "receiver_id": "uuid",
  "encrypted_content": "base64_encoded_string..."
}
```

**Response:**
```json
{
  "id": "uuid",
  "sender_id": "uuid",
  "receiver_id": "uuid",
  "encrypted_content": "base64_encoded_string...",
  "is_read": false,
  "created_at": "2025-12-17T10:30:00Z"
}
```

**Fungsi:**
- Menyimpan pesan terenkripsi ke database
- Logging aktivitas pengiriman pesan

#### 4.3.2 Get Conversation
**Endpoint:** `GET /messages/conversation/{user_id}?current_user_id={uuid}`

**Response:**
```json
[
  {
    "id": "uuid",
    "sender_id": "uuid",
    "receiver_id": "uuid",
    "encrypted_content": "base64_encoded_string...",
    "is_read": false,
    "created_at": "2025-12-17T10:30:00Z"
  }
]
```

**Fungsi:**
- Mengambil semua pesan antara 2 user
- Diurutkan berdasarkan waktu (ascending)
- Return dalam bentuk array

#### 4.3.3 Get Inbox
**Endpoint:** `GET /messages/inbox/{user_id}`

**Response:**
```json
[
  {
    "id": "uuid",
    "sender_id": "uuid",
    "receiver_id": "uuid",
    "encrypted_content": "base64_encoded_string...",
    "is_read": false,
    "created_at": "2025-12-17T10:30:00Z"
  }
]
```

**Fungsi:**
- Mengambil semua pesan masuk untuk user tertentu
- Diurutkan dari yang terbaru

#### 4.3.4 Mark as Read
**Endpoint:** `PUT /messages/{message_id}/read`

**Response:**
```json
{
  "id": "uuid",
  "sender_id": "uuid",
  "receiver_id": "uuid",
  "encrypted_content": "base64_encoded_string...",
  "is_read": true,
  "created_at": "2025-12-17T10:30:00Z"
}
```

**Fungsi:**
- Menandai pesan sudah dibaca
- Update field `is_read` menjadi true

### 4.4 User Management

#### 4.4.1 Get All Users
**Endpoint:** `GET /users?current_user_id={uuid}`

**Response:**
```json
[
  {
    "id": "uuid",
    "username": "john_doe",
    "email": "john@example.com",
    "public_key": "-----BEGIN PUBLIC KEY-----...",
    "created_at": "2025-12-17T10:00:00Z"
  }
]
```

**Fungsi:**
- Menampilkan semua user kecuali current user
- Untuk contact list

#### 4.4.2 Get User by ID
**Endpoint:** `GET /users/{user_id}`

**Response:**
```json
{
  "id": "uuid",
  "username": "john_doe",
  "email": "john@example.com",
  "public_key": "-----BEGIN PUBLIC KEY-----...",
  "created_at": "2025-12-17T10:00:00Z"
}
```

**Fungsi:**
- Mendapatkan detail user tertentu
- Termasuk public key untuk enkripsi

#### 4.4.3 Search Users
**Endpoint:** `GET /users/search/{query}?current_user_id={uuid}`

**Response:**
```json
[
  {
    "id": "uuid",
    "username": "john_doe",
    "email": "john@example.com",
    "public_key": "-----BEGIN PUBLIC KEY-----..."
  }
]
```

**Fungsi:**
- Mencari user berdasarkan username
- Case-insensitive search

---

## 5. Database Schema

### 5.1 Table: users

| Column | Type | Constraint | Description |
|--------|------|------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| username | TEXT | UNIQUE, NOT NULL | Username user |
| email | TEXT | UNIQUE, NOT NULL | Email user |
| password | TEXT | NOT NULL | Hashed password (bcrypt) |
| public_key | TEXT | NULLABLE | RSA public key (PEM format) |
| created_at | TIMESTAMP | NOT NULL | Waktu registrasi |

### 5.2 Table: messages

| Column | Type | Constraint | Description |
|--------|------|------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| sender_id | UUID | FOREIGN KEY, NOT NULL | ID pengirim |
| receiver_id | UUID | FOREIGN KEY, NOT NULL | ID penerima |
| encrypted_content | TEXT | NOT NULL | Pesan terenkripsi (base64) |
| is_read | BOOLEAN | DEFAULT FALSE | Status baca |
| created_at | TIMESTAMP | NOT NULL | Waktu kirim |

**Indexes:**
- `messages_sender_idx` on `sender_id`
- `messages_receiver_idx` on `receiver_id`
- `messages_created_at_idx` on `created_at DESC`

---

## 6. Security Features

### 6.1 End-to-End Encryption
- **Algoritma:** RSA-2048 dengan OAEP padding
- **Hashing:** SHA-256 untuk MGF1
- **Format:** PEM encoding untuk keys
- **Base64:** Encoding untuk encrypted messages

### 6.2 Password Security
- **Hashing:** Bcrypt dengan salt otomatis
- **Storage:** Hanya hash yang disimpan di database
- **Verification:** Menggunakan bcrypt.checkpw()

### 6.3 Private Key Management
- **Storage:** localStorage di browser client
- **Transmission:** Private key tidak pernah dikirim ke server setelah registrasi
- **Persistence:** Disimpan per user ID

### 6.4 Message Security
- Pesan dienkripsi di client sebelum dikirim
- Server hanya menyimpan ciphertext
- Hanya penerima dengan private key yang dapat dekripsi
- Pengirim menyimpan plain text di localStorage cache

---

## 7. Frontend Features

### 7.1 Authentication Pages
- Login form dengan email & password
- Register form dengan username, email & password
- Error handling dan loading states
- Auto-redirect setelah login/register

### 7.2 Chat Interface
- User list (contact list) di sidebar
- Chat window dengan history messages
- Real-time message updates (polling setiap 3 detik)
- Send message dengan encryption otomatis
- Auto-scroll ke message terbaru

### 7.3 State Management
- Zustand untuk global auth state
- Persist auth data ke localStorage
- Cache sent messages di localStorage
- Optimistic UI updates saat kirim pesan

### 7.4 UI/UX
- Responsive design dengan Tailwind CSS
- Loading indicators
- Error messages
- Message status (sent, encrypted, failed)
- Timestamp pada setiap pesan

---

## 8. Backend Logging

### 8.1 Encryption Logs
```
INFO: app.services.crypto_service - Encrypting message (length: 11 chars)
INFO: app.services.crypto_service - Encryption successful (encrypted size: 344 chars)
```

### 8.2 Decryption Logs
```
INFO: app.services.crypto_service - Decrypting message (encrypted size: 344 chars)
INFO: app.services.crypto_service - Decryption successful (decrypted length: 11 chars)
```

### 8.3 Message Logs
```
INFO: app.api.messages - Sending encrypted message from {sender_id} to {receiver_id}
INFO: app.api.messages - Message sent successfully (ID: {message_id})
INFO: app.api.messages - Fetching conversation between {user1} and {user2}
INFO: app.api.messages - Retrieved 5 messages
```

### 8.4 Error Logs
```
ERROR: app.services.crypto_service - Decryption failed: Invalid padding
ERROR: app.api.crypto - API: Decrypt request failed - {error_message}
```

---

## 9. Cara Menjalankan Aplikasi

### 9.1 Persiapan

#### Setup Supabase
1. Buat project di https://supabase.com
2. Jalankan SQL schema dari `supabase_schema.sql`
3. Copy Project URL dan anon key

#### Setup Backend
```bash
cd backend
pip install -r requirements.txt
```

Buat file `backend/.env`:
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
JWT_SECRET=your_random_secret
FRONTEND_URL=http://localhost:3000
```

#### Setup Frontend
```bash
npm install
```

Buat file `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 9.2 Menjalankan

**Terminal 1 - Backend:**
```bash
cd backend
python run.py
```
Backend running di http://localhost:8000

**Terminal 2 - Frontend:**
```bash
npm run dev
```
Frontend running di http://localhost:3000

### 9.3 Testing

#### 9.3.1 Testing Authentication

**A. Test Registrasi User**

1. **Persiapan:**
   - Pastikan backend sudah running di http://localhost:8000
   - Pastikan frontend sudah running di http://localhost:3000
   - Buka browser dan akses http://localhost:3000

2. **Langkah Testing:**
   - Klik tab "Register" pada halaman auth
   - Isi form registrasi:
     - Username: `testuser1`
     - Email: `testuser1@example.com`
     - Password: `password123`
   - Klik tombol "Create Account"

3. **Expected Result:**
   - Loading indicator muncul saat proses registrasi
   - Backend generate RSA key pair (2048-bit)
   - Password di-hash dengan bcrypt
   - Public key disimpan di database Supabase
   - Private key dikembalikan ke client
   - Private key disimpan di localStorage dengan key `private_key_{user_id}`
   - User otomatis diarahkan ke `/chat`
   - Log backend menampilkan: "Generating RSA key pair (2048-bit)"

4. **Verifikasi:**
   - Buka DevTools > Application > Local Storage
   - Pastikan ada entry `private_key_{user_id}` berisi PEM-encoded private key
   - Pastikan ada entry `auth_user` berisi user data
   - Cek database Supabase table `users`, pastikan user baru tercatat dengan public_key

**B. Test Login User**

1. **Persiapan:**
   - Gunakan akun yang sudah terdaftar (dari test registrasi)
   - Logout jika sedang login (clear localStorage)

2. **Langkah Testing:**
   - Klik tab "Login" pada halaman auth
   - Isi form login:
     - Email: `testuser1@example.com`
     - Password: `password123`
   - Klik tombol "Login"

3. **Expected Result:**
   - Loading indicator muncul saat proses login
   - Backend verifikasi email dan password menggunakan bcrypt
   - User data dikembalikan (tanpa private key)
   - User otomatis diarahkan ke `/chat`
   - Auth state tersimpan di Zustand store dan localStorage

4. **Verifikasi:**
   - Buka DevTools > Application > Local Storage
   - Pastikan ada entry `auth_user` berisi user data
   - Pastikan private key dari registrasi sebelumnya masih ada
   - User berhasil masuk ke halaman chat

**C. Test Error Handling**

1. **Test Login dengan Email Salah:**
   - Input email yang tidak terdaftar
   - Expected: Error message "Login failed" muncul dengan styling red

2. **Test Login dengan Password Salah:**
   - Input email benar tapi password salah
   - Expected: Error message muncul, form tidak submit

3. **Test Register dengan Email Duplikat:**
   - Daftar dengan email yang sudah ada
   - Expected: Error message "Registration failed" atau "Email already exists"

4. **Test Form Validation:**
   - Submit form kosong
   - Expected: Browser validation muncul (required fields)

**Teknologi Testing:**
- **Manual Testing**: Browser-based testing dengan Chrome DevTools
- **Browser DevTools**: Untuk inspect localStorage, network requests, console logs
- **Backend Logging**: Python logging module untuk track encryption/decryption
- **Database Verification**: Supabase dashboard untuk cek data tersimpan

#### 9.3.2 Testing Messaging Flow

1. **Setup:**
   - Register 2 akun berbeda (`user1` dan `user2`)
   - Login dengan akun pertama di tab/window pertama
   - Login dengan akun kedua di tab/window kedua

2. **Test Kirim Pesan:**
   - User1 pilih User2 dari contact list
   - User1 ketik pesan: "Hello from User1"
   - Klik tombol "Send"

3. **Expected Result:**
   - Pesan di-encrypt dengan public key User2
   - Encrypted message dikirim ke backend
   - Backend simpan encrypted content ke database
   - User1 melihat pesan plain text (dari localStorage cache)
   - User2 otomatis menerima pesan dalam 3 detik (polling)
   - User2 decrypt dengan private key miliknya
   - User2 melihat pesan plain text: "Hello from User1"

4. **Verifikasi Enkripsi:**
   - Buka Supabase dashboard > Table `messages`
   - Lihat kolom `encrypted_content`, pastikan berisi base64 string
   - Tidak ada plain text tersimpan di database
   - Copy encrypted content, coba decrypt manual dengan private key yang salah
   - Expected: Decrypt gagal, membuktikan enkripsi bekerja

5. **Test Real-time Updates:**
   - Kirim beberapa pesan dari User1 ke User2
   - Pastikan User2 menerima pesan dalam waktu maksimal 3 detik
   - Verifikasi polling bekerja dengan baik

**Teknologi Testing:**
- **Multi-tab Testing**: Browser tabs untuk simulasi multiple users
- **Network Inspection**: Chrome DevTools Network tab untuk track API calls
- **Database Inspection**: Supabase dashboard untuk verify encrypted storage
- **Console Logging**: Browser console untuk track encryption/decryption process

#### 9.3.3 Testing Security

1. **Test Private Key Security:**
   - Verifikasi private key tidak pernah dikirim ke server setelah registrasi
   - Check Network tab, pastikan tidak ada request body berisi private key
   - Pastikan private key hanya ada di localStorage client

2. **Test Password Hashing:**
   - Check database Supabase table `users`
   - Pastikan kolom `password` berisi bcrypt hash (bukan plain text)
   - Hash harus dimulai dengan `$2b$`

3. **Test End-to-End Encryption:**
   - Kirim pesan dari User1 ke User2
   - Check database, pastikan `encrypted_content` tidak readable
   - Pastikan hanya User2 yang bisa decrypt (dengan private key miliknya)
   - User1 tidak bisa decrypt pesan yang dia kirim (karena encrypted dengan public key User2)

**Tools Testing:**
- Chrome DevTools (Network, Application, Console)
- Supabase Dashboard
- Python Backend Logs (uvicorn console)
- Postman (optional, untuk test API endpoints langsung)

---

## 10. Keamanan dan Limitasi

### 10.1 Kelebihan
- End-to-end encryption dengan RSA
- Private key tidak pernah tersimpan di server
- Password di-hash dengan bcrypt
- Logging lengkap untuk monitoring
- Type-safe dengan TypeScript

### 10.2 Limitasi
- RSA 2048-bit memiliki limit ukuran pesan (~245 bytes)
- Polling setiap 3 detik (bukan real-time WebSocket)
- Private key di localStorage rentan jika device compromised
- Tidak ada session management yang robust
- Belum ada encryption untuk metadata (sender, receiver, timestamp)

### 10.3 Potensi Improvement
- Hybrid encryption (RSA + AES) untuk pesan panjang
- WebSocket untuk real-time messaging
- Encrypt private key di localStorage dengan password
- JWT untuk session management
- Multi-device sync untuk private keys
- Message delivery confirmation
- File/image attachment support

---

## 11. Kesimpulan

Project P2P Encrypted Messaging Application berhasil mengimplementasikan sistem messaging dengan end-to-end encryption menggunakan RSA 2048-bit. Aplikasi ini mendemonstrasikan penggunaan kriptografi asimetrik dalam praktik, dimana keamanan pesan dijaga dengan memastikan private key tidak pernah meninggalkan client.

Tech stack yang dipilih (FastAPI untuk backend dan Next.js untuk frontend) memberikan performa yang baik dan development experience yang modern. Integrasi dengan Supabase memudahkan pengelolaan database tanpa perlu setup server database sendiri.

Meskipun masih ada beberapa limitasi, aplikasi ini sudah cukup untuk mendemonstrasikan konsep secure messaging dengan enkripsi end-to-end.

---

**Dibuat oleh:** [Nama Anda]
**Tanggal:** 17 Desember 2024
**Versi:** 1.0
