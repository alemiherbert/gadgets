-- Seed script: run after schema.sql
-- Creates the default admin user and sample products
-- The admin password hash must be generated at runtime via /admin/setup
-- or by running this script with a pre-computed hash.

-- To seed via the setup page, navigate to /admin/setup after deploying.
-- Alternatively, use wrangler:
--   wrangler d1 execute gadgets-db --file=schema.sql
--   Then visit /admin/setup in the browser to create the admin account.

-- Example products (optional - for demo purposes)
INSERT INTO products (name, description, price, stock, image_key, active) VALUES
  ('Wireless Earbuds', 'Premium wireless earbuds with noise cancellation and 24hr battery life.', 4999, 50, NULL, 1),
  ('Smart Watch', 'Fitness tracker with heart rate monitor, GPS, and water resistance.', 12999, 30, NULL, 1),
  ('USB-C Hub', '7-in-1 USB-C hub with HDMI, USB 3.0, SD card reader, and PD charging.', 3499, 100, NULL, 1),
  ('Mechanical Keyboard', 'Compact 75% layout with hot-swappable switches and RGB backlight.', 7999, 25, NULL, 1),
  ('Phone Stand', 'Adjustable aluminum phone and tablet stand. Works with all devices.', 1999, 200, NULL, 1),
  ('Portable Charger', '20000mAh power bank with fast charging. Charges 3 devices simultaneously.', 2999, 75, NULL, 1);
