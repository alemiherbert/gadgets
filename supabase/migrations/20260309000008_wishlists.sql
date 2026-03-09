-- Wishlists feature

CREATE TABLE IF NOT EXISTS wishlists (
	id SERIAL PRIMARY KEY,
	customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
	product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	UNIQUE(customer_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlists_customer_created
ON wishlists(customer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wishlists_product
ON wishlists(product_id);
