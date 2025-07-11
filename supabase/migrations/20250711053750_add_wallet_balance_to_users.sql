-- Add wallet_balance column to users table for individual users
ALTER TABLE users ADD COLUMN wallet_balance DECIMAL(10,2) DEFAULT 0;