-- Migration: Add Custom Subscription Pricing Configs
-- Add default config values for custom subscription pricing

INSERT OR IGNORE INTO configs (key, value) VALUES ('custom_subscription_traffic_price', '0.07');
INSERT OR IGNORE INTO configs (key, value) VALUES ('custom_subscription_duration_price', '0.03');
