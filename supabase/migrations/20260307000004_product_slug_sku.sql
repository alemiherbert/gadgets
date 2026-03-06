-- Add slug and SKU columns to products

ALTER TABLE products ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT;

-- Generate slugs from existing product names
UPDATE products
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(TRIM(name), '[^a-zA-Z0-9\s-]', '', 'g'),
    '\s+', '-', 'g'
  )
)
WHERE slug IS NULL;

-- Generate 5-digit numeric SKUs for existing products
UPDATE products
SET sku = LPAD((10000 + id * 7 + 31)::TEXT, 5, '0')
WHERE sku IS NULL;

-- Make slug and sku NOT NULL and UNIQUE
ALTER TABLE products ALTER COLUMN slug SET NOT NULL;
ALTER TABLE products ALTER COLUMN sku SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

-- Helper function to generate a random 5-digit SKU
CREATE OR REPLACE FUNCTION generate_product_sku()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_sku TEXT;
BEGIN
  LOOP
    new_sku := LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM products WHERE sku = new_sku);
  END LOOP;
  RETURN new_sku;
END;
$$;

-- Function to generate slug from name
CREATE OR REPLACE FUNCTION generate_product_slug(_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INT := 0;
BEGIN
  base_slug := LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(_name), '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
  final_slug := base_slug;
  LOOP
    EXIT WHEN NOT EXISTS (SELECT 1 FROM products WHERE slug = final_slug);
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  RETURN final_slug;
END;
$$;

-- Function to get adjacent products for prev/next navigation
CREATE OR REPLACE FUNCTION get_adjacent_products(_product_id INT)
RETURNS TABLE(direction TEXT, id INT, name TEXT, slug TEXT, image_key TEXT, price INT)
LANGUAGE sql STABLE
AS $$
  (SELECT 'prev'::TEXT, p.id, p.name, p.slug, p.image_key, p.price
   FROM products p
   WHERE p.active = 1 AND p.id < _product_id
   ORDER BY p.id DESC LIMIT 1)
  UNION ALL
  (SELECT 'next'::TEXT, p.id, p.name, p.slug, p.image_key, p.price
   FROM products p
   WHERE p.active = 1 AND p.id > _product_id
   ORDER BY p.id ASC LIMIT 1);
$$;
