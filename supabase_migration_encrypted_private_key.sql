-- Add encrypted_private_key column to users table
ALTER TABLE users ADD COLUMN encrypted_private_key TEXT;
