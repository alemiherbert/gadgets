-- Seed script: run after schema.sql
-- Creates the default admin user and sample products
-- The admin password hash must be generated at runtime via /admin/setup
-- or by running this script with a pre-computed hash.

-- To seed via the setup page, navigate to /admin/setup after deploying.
-- Alternatively, use wrangler:
--   wrangler d1 execute gadgets-db --file=schema.sql
--   Then visit /admin/setup in the browser to create the admin account.

-- ─── Categories ──────────────────────────────────────────
-- ─── Brands ───────────────────────────────────────────────
INSERT INTO brands (name, slug, logo_key, sort_order) VALUES
  ('Apple', 'apple', NULL, 1),
  ('Samsung', 'samsung', NULL, 2),
  ('Sony', 'sony', NULL, 3),
  ('HP', 'hp', NULL, 4),
  ('Dell', 'dell', NULL, 5),
  ('Anker', 'anker', NULL, 6),
  ('Logitech', 'logitech', NULL, 7),
  ('Xiaomi', 'xiaomi', NULL, 8);
INSERT INTO categories (name, slug, description, icon, sort_order) VALUES
  ('Computing & Laptops', 'computing-laptops', 'MacBooks, Windows Laptops, Desktops & Monitors', '/img/categories/computing.avif', 1),
  ('Phones & Tablets', 'phones-tablets', 'iPhones, Android devices, iPads & Samsung Tabs', '/img/categories/phones.avif', 2),
  ('Audio & Entertainment', 'audio-entertainment', 'Headphones, Bluetooth Speakers, Gaming Consoles & Home Theater', '/img/categories/audio.avif', 3),
  ('Smart Home & Security', 'smart-home-security', 'Security Cameras, Smart Bulbs, Sensors & Wi-Fi Routers', '/img/categories/smart-home.avif', 4),
  ('Power & Storage', 'power-storage', 'Power Banks, UPS/Inverters, Hard Drives & SSDs', '/img/categories/power.avif', 5),
  ('Accessories', 'accessories', 'Keyboards, Mice, Cables, Chargers & Laptop Bags', '/img/categories/accessories.avif', 6);

-- ─── Subcategories ───────────────────────────────────────
-- Computing & Laptops (category_id=1)
INSERT INTO subcategories (name, slug, category_id, sort_order) VALUES
  ('MacBooks', 'macbooks', 1, 1),
  ('Windows Laptops', 'windows-laptops', 1, 2),
  ('Desktops', 'desktops', 1, 3),
  ('Monitors', 'monitors', 1, 4),
  ('Chromebooks', 'chromebooks', 1, 5);

-- Phones & Tablets (category_id=2)
INSERT INTO subcategories (name, slug, category_id, sort_order) VALUES
  ('iPhones', 'iphones', 2, 1),
  ('Android Phones', 'android-phones', 2, 2),
  ('iPads', 'ipads', 2, 3),
  ('Samsung Tabs', 'samsung-tabs', 2, 4),
  ('Phone Cases', 'phone-cases', 2, 5);

-- Audio & Entertainment (category_id=3)
INSERT INTO subcategories (name, slug, category_id, sort_order) VALUES
  ('Headphones', 'headphones', 3, 1),
  ('Bluetooth Speakers', 'bluetooth-speakers', 3, 2),
  ('Gaming Consoles', 'gaming-consoles', 3, 3),
  ('Home Theater', 'home-theater', 3, 4),
  ('Earbuds', 'earbuds', 3, 5);

-- Smart Home & Security (category_id=4)
INSERT INTO subcategories (name, slug, category_id, sort_order) VALUES
  ('Security Cameras', 'security-cameras', 4, 1),
  ('Smart Bulbs', 'smart-bulbs', 4, 2),
  ('Sensors', 'sensors', 4, 3),
  ('Wi-Fi Routers', 'wi-fi-routers', 4, 4),
  ('Smart Plugs', 'smart-plugs', 4, 5);

-- Power & Storage (category_id=5)
INSERT INTO subcategories (name, slug, category_id, sort_order) VALUES
  ('Power Banks', 'power-banks', 5, 1),
  ('UPS / Inverters', 'ups-inverters', 5, 2),
  ('Hard Drives', 'hard-drives', 5, 3),
  ('SSDs', 'ssds', 5, 4),
  ('Surge Protectors', 'surge-protectors', 5, 5);

-- Accessories (category_id=6)
INSERT INTO subcategories (name, slug, category_id, sort_order) VALUES
  ('Keyboards', 'keyboards', 6, 1),
  ('Mice', 'mice', 6, 2),
  ('Cables & Chargers', 'cables-chargers', 6, 3),
  ('Laptop Bags', 'laptop-bags', 6, 4),
  ('Webcams', 'webcams', 6, 5);

-- Example products (optional - for demo purposes)
-- subcategory_id references: 15=earbuds, 2=windows-laptops, 3=desktops, 1=macbooks,
-- 6=iphones, 21=power-banks, 12=bluetooth-speakers, 29=laptop-bags, 30=webcams, 27=mice, 26=keyboards
INSERT INTO products (name, description, price, compare_at_price, stock, image_key, active, featured, sales_count, specs, subcategory_id, brand_id) VALUES
  ('Wireless Earbuds', 'Premium wireless earbuds with noise cancellation and 24hr battery life.', 399900, 499900, 50, NULL, 1, 1, 120, '{"Connectivity":"Bluetooth 5.3","Battery":"24 hours","Noise Cancellation":"Active (ANC)","Driver Size":"12mm","Water Resistance":"IPX5"}', 15, 3),
  ('Smart Watch', 'Fitness tracker with heart rate monitor, GPS, and water resistance.', 999900, 1299900, 30, NULL, 1, 1, 85, '{"Display":"1.4\" AMOLED","Battery":"7 days","Water Resistance":"5 ATM","Connectivity":"Bluetooth 5.0","Sensors":"Heart Rate, SpO2, GPS"}', NULL, 8),
  ('USB-C Hub', '7-in-1 USB-C hub with HDMI, USB 3.0, SD card reader, and PD charging.', 249900, 349900, 100, NULL, 1, 0, 200, '{"Ports":"7-in-1","HDMI":"4K@60Hz","USB":"2x USB 3.0","Card Reader":"SD/microSD","Power Delivery":"100W"}', 28, 6),
  ('Mechanical Keyboard', 'Compact 75% layout with hot-swappable switches and RGB backlight.', 599900, 799900, 25, NULL, 1, 1, 60, '{"Layout":"75% Compact","Switches":"Hot-Swappable","Backlight":"RGB","Connectivity":"USB-C / Bluetooth","Battery":"4000mAh"}', 26, 7),
  ('Phone Stand', 'Adjustable aluminum phone and tablet stand. Works with all devices.', 199900, NULL, 200, NULL, 1, 0, 150, '{"Material":"Aluminum","Adjustable":"Yes","Compatibility":"4-13 inch devices","Weight":"280g","Color":"Silver"}', 28, 6),
  ('Portable Charger', '20000mAh power bank with fast charging. Charges 3 devices simultaneously.', 249900, 299900, 75, NULL, 1, 0, 300, '{"Capacity":"20000mAh","Ports":"USB-C, 2x USB-A","Fast Charging":"PD 20W + QC 3.0","Weight":"350g","Charges":"3 devices"}', 21, 6),
  ('Bluetooth Speaker', 'Waterproof portable speaker with 360-degree sound and 12hr battery.', 349900, 449900, 40, NULL, 1, 1, 95, '{"Power":"20W","Battery":"12 hours","Water Resistance":"IPX7","Connectivity":"Bluetooth 5.0","Driver":"Full-range 360°"}', 12, 3),
  ('Laptop Sleeve', 'Premium neoprene laptop sleeve fits 13-15 inch laptops. Shock-resistant.', 149900, 199900, 150, NULL, 1, 0, 180, '{"Material":"Neoprene","Size":"13-15 inch","Protection":"Shock-resistant","Pockets":"1 accessory pocket","Weight":"180g"}', 29, 6),
  ('Webcam HD', '1080p HD webcam with built-in microphone and auto-focus.', 449900, 599900, 35, NULL, 1, 0, 70, '{"Resolution":"1080p Full HD","Frame Rate":"30fps","Microphone":"Built-in Stereo","Focus":"Auto-focus","Connectivity":"USB 2.0"}', 30, 4),
  ('Wireless Mouse', 'Ergonomic wireless mouse with silent clicks and USB-C charging.', 199900, 249900, 90, NULL, 1, 0, 110, '{"Connectivity":"2.4GHz + Bluetooth","DPI":"800-4000","Buttons":"6","Battery":"Rechargeable (USB-C)","Weight":"75g"}', 27, 7);

-- Product-Category mappings
INSERT INTO product_categories (product_id, category_id) VALUES
  (1, 3),  -- Wireless Earbuds -> Audio & Entertainment
  (2, 6),  -- Smart Watch -> Accessories
  (3, 6),  -- USB-C Hub -> Accessories
  (4, 6),  -- Mechanical Keyboard -> Accessories
  (5, 6),  -- Phone Stand -> Accessories
  (6, 5),  -- Portable Charger -> Power & Storage
  (7, 3),  -- Bluetooth Speaker -> Audio & Entertainment
  (8, 6),  -- Laptop Sleeve -> Accessories
  (9, 1),  -- Webcam HD -> Computing & Laptops
  (10, 6); -- Wireless Mouse -> Accessories

-- Featured carousel slides
INSERT INTO featured_slides (title, subtitle, cta_text, cta_link, bg_color, text_color, sort_order, active) VALUES
  ('Computing & Laptops', 'MacBooks, Windows Laptops, Desktops and Monitors for every need.', 'Shop Computing', '/shop?category=computing-laptops', '#2563eb', '#ffffff', 1, 1),
  ('Phones & Tablets', 'iPhones, Android devices, iPads and Samsung Tabs — the latest models.', 'Explore Phones', '/shop?category=phones-tablets', '#0891b2', '#ffffff', 2, 1),
  ('Audio & Entertainment', 'Headphones, Speakers, Gaming Consoles and Home Theater systems.', 'Browse Audio', '/shop?category=audio-entertainment', '#7c3aed', '#ffffff', 3, 1);
