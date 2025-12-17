# P2P Encrypted Messaging App

End-to-end encrypted messaging application with Python backend and Next.js frontend.

## Tech Stack

**Backend:**
- FastAPI (Python)
- Supabase (PostgreSQL)
- RSA encryption (cryptography library)

**Frontend:**
- Next.js 15
- TypeScript
- Tailwind CSS
- Zustand (state management)

## Setup Instructions

### 1. Supabase Setup

Create a new Supabase project and run the SQL script:

```bash
supabase_schema.sql
```

Get your Supabase URL and anon key from project settings.

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `.env` file in backend folder:

```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
JWT_SECRET=your_random_secret_key
FRONTEND_URL=http://localhost:3000
```

Run backend:

```bash
python run.py
```

Backend runs on http://localhost:8000

### 3. Frontend Setup

```bash
npm install
```

Create `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Run frontend:

```bash
npm run dev
```

Frontend runs on http://localhost:3000

## How It Works

1. **Registration**: User registers, backend generates RSA key pair
2. **Key Storage**: Public key stored in database, private key saved in browser localStorage
3. **Messaging**: Messages encrypted with recipient's public key
4. **Decryption**: Only recipient can decrypt with their private key
5. **Security**: Private keys never leave the client, server only handles encrypted data

## API Endpoints

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /messages/send` - Send encrypted message
- `GET /messages/conversation/{user_id}` - Get conversation
- `GET /users` - List all users
- `POST /crypto/encrypt` - Encrypt message
- `POST /crypto/decrypt` - Decrypt message

## Project Structure

```
backend/
├── app/
│   ├── api/          # API routes
│   ├── core/         # Config & database
│   ├── models/       # Data schemas
│   └── services/     # Business logic
src/
├── app/              # Next.js pages
├── components/       # React components
├── hooks/            # Custom hooks
├── lib/              # Utilities & API client
└── types/            # TypeScript types
```
