-- Migration: Add Offer Fields to Plans
-- Add original_price and offer_price fields to plans table for discount/offer functionality

-- Add original_price column (price before offer)
ALTER TABLE plans ADD COLUMN original_price DECIMAL(18, 8);

-- Add offer_price column (price after offer/discount)
ALTER TABLE plans ADD COLUMN offer_price DECIMAL(18, 8);

-- Set default values: if offer_price is NULL, use price as the current price
-- If original_price is NULL but offer_price exists, set original_price to current price
UPDATE plans SET original_price = price WHERE original_price IS NULL;
UPDATE plans SET offer_price = price WHERE offer_price IS NULL;
