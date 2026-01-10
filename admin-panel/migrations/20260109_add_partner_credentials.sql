-- Migration: Add partner credentials and partner_id columns
-- Run this against your backend database (example for PostgreSQL)

BEGIN;

-- 1) Create partners table if it doesn't exist (idempotent example)
CREATE TABLE IF NOT EXISTS partners (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2) Add partner_id to key tables (products/customers/transactions) if not present
ALTER TABLE IF EXISTS products
  ADD COLUMN IF NOT EXISTS partner_id INTEGER REFERENCES partners(id);

ALTER TABLE IF EXISTS customers
  ADD COLUMN IF NOT EXISTS partner_id INTEGER REFERENCES partners(id);

ALTER TABLE IF EXISTS transactions
  ADD COLUMN IF NOT EXISTS partner_id INTEGER REFERENCES partners(id);

-- 3) Create partners_credentials table to store partner panel logins
CREATE TABLE IF NOT EXISTS partners_credentials (
  id SERIAL PRIMARY KEY,
  partner_id INTEGER NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  salt TEXT,
  created_by_admin_id INTEGER, -- optional reference to admin user who created credential
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NULL,
  is_active BOOLEAN DEFAULT TRUE
);

-- 4) Add indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_products_partner_id ON products(partner_id);
CREATE INDEX IF NOT EXISTS idx_customers_partner_id ON customers(partner_id);
CREATE INDEX IF NOT EXISTS idx_transactions_partner_id ON transactions(partner_id);
CREATE INDEX IF NOT EXISTS idx_credentials_partner_id ON partners_credentials(partner_id);

COMMIT;

-- Notes:
-- - Use a secure password hashing function (bcrypt/argon2) in the backend when creating password_hash.
-- - Prefer issuing a one-time token link to the partner for first login instead of sending raw passwords.
-- - After running migration, update backend services to enforce partner_id filtering.


