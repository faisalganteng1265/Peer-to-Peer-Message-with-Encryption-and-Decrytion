-- Migration: Add sender_encrypted_content column to messages table
-- This allows senders to decrypt their own messages after refresh or login from another device

ALTER TABLE messages
ADD COLUMN sender_encrypted_content TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN messages.sender_encrypted_content IS 'Message encrypted with sender public key, so sender can read their own messages';
