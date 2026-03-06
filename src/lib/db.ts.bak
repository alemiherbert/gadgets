import type { Product, Customer, Order, OrderItem, OrderItemWithProduct, Admin, AdminSession, Session, Category, Subcategory, Brand, SearchHistoryItem, FeaturedSlide, PasswordResetToken, ProductReview, ProductImage } from './types';

// ─── Products ────────────────────────────────────────────
export async function getActiveProducts(db: D1Database): Promise<Product[]> {
	const result = await db.prepare('SELECT * FROM products WHERE active = 1 ORDER BY created_at DESC').all<Product>();
	return result.results;
}

export async function getAllProducts(db: D1Database): Promise<Product[]> {
	const result = await db.prepare('SELECT * FROM products ORDER BY created_at DESC').all<Product>();
	return result.results;
}

export async function getProductById(db: D1Database, id: number): Promise<Product | null> {
	return db.prepare('SELECT * FROM products WHERE id = ?').bind(id).first<Product>();
}

export async function getNewArrivals(db: D1Database, limit = 8): Promise<Product[]> {
	const result = await db.prepare(
		'SELECT * FROM products WHERE active = 1 ORDER BY created_at DESC LIMIT ?'
	).bind(limit).all<Product>();
	return result.results;
}

export async function getFeaturedProducts(db: D1Database, limit = 6): Promise<Product[]> {
	const result = await db.prepare(
		'SELECT * FROM products WHERE active = 1 AND featured = 1 ORDER BY created_at DESC LIMIT ?'
	).bind(limit).all<Product>();
	return result.results;
}

// Great deals: products with compare_at_price (discount), sorted by discount %
export async function getGreatDeals(db: D1Database, limit = 8, offset = 0): Promise<Product[]> {
	const result = await db.prepare(
		`SELECT *, 
		 CASE WHEN compare_at_price IS NOT NULL AND compare_at_price > price 
		      THEN ROUND(((compare_at_price - price) * 100.0) / compare_at_price) 
		      ELSE 0 END as discount_pct
		 FROM products WHERE active = 1 
		 AND compare_at_price IS NOT NULL AND compare_at_price > price
		 ORDER BY discount_pct DESC, sales_count DESC
		 LIMIT ? OFFSET ?`
	).bind(limit, offset).all<Product>();
	return result.results;
}

// Best sellers: sorted by sales_count
export async function getBestSellers(db: D1Database, limit = 8, offset = 0): Promise<Product[]> {
	const result = await db.prepare(
		'SELECT * FROM products WHERE active = 1 ORDER BY sales_count DESC, created_at DESC LIMIT ? OFFSET ?'
	).bind(limit, offset).all<Product>();
	return result.results;
}

// Paginated products for shop page with optional category/subcategory filter
export async function getShopProducts(db: D1Database, options: {
	categorySlug?: string;
	subcategorySlug?: string;
	brandSlug?: string;
	search?: string;
	minPrice?: number;
	maxPrice?: number;
	specFilters?: Record<string, string[]>;
	sort?: string;
	limit?: number;
	offset?: number;
}): Promise<{ products: Product[]; total: number }> {
	const { categorySlug, subcategorySlug, brandSlug, search, minPrice, maxPrice, specFilters, sort = 'newest', limit = 48, offset = 0 } = options;

	let orderBy = 'p.created_at DESC';
	if (sort === 'price-asc') orderBy = 'p.price ASC';
	else if (sort === 'price-desc') orderBy = 'p.price DESC';
	else if (sort === 'popular') orderBy = 'p.sales_count DESC';
	else if (sort === 'discount') orderBy = 'CASE WHEN p.compare_at_price IS NOT NULL AND p.compare_at_price > p.price THEN ROUND(((p.compare_at_price - p.price) * 100.0) / p.compare_at_price) ELSE 0 END DESC';

	// Build WHERE clauses and bindings dynamically
	const conditions: string[] = ['p.active = 1'];
	const bindings: (string | number)[] = [];

	if (subcategorySlug) {
		conditions.push('s.slug = ?');
		bindings.push(subcategorySlug);
	}

	if (search) {
		// Split search into individual terms for AND matching
		const terms = search.split(/\s+/).filter(t => t.length > 0);
		if (terms.length > 0) {
			const termConditions = terms.map(() =>
				`(p.name LIKE ? OR p.description LIKE ? OR p.specs LIKE ? OR EXISTS (SELECT 1 FROM brands br WHERE br.id = p.brand_id AND br.name LIKE ?) OR EXISTS (SELECT 1 FROM subcategories sc WHERE sc.id = p.subcategory_id AND sc.name LIKE ?))`
			);
			conditions.push(`(${termConditions.join(' AND ')})`);
			for (const term of terms) {
				bindings.push(`%${term}%`, `%${term}%`, `%${term}%`, `%${term}%`, `%${term}%`);
			}
		}
	}

	if (minPrice !== undefined) {
		conditions.push('p.price >= ?');
		bindings.push(minPrice);
	}

	if (maxPrice !== undefined) {
		conditions.push('p.price <= ?');
		bindings.push(maxPrice);
	}

	// Spec filters: use json_extract on the specs column
	if (specFilters) {
		for (const [key, values] of Object.entries(specFilters)) {
			if (values.length > 0) {
				const placeholders = values.map(() => '?').join(', ');
				conditions.push(`json_extract(p.specs, '$."${key}"') IN (${placeholders})`);
				bindings.push(...values);
			}
		}
	}

	// Brand filter
	if (brandSlug) {
		conditions.push('b.slug = ?');
		bindings.push(brandSlug);
	}

	const whereClause = conditions.join(' AND ');
	const brandJoin = brandSlug ? 'JOIN brands b ON p.brand_id = b.id' : '';

	// When filtering by subcategory, join the subcategories table
	if (subcategorySlug) {
		const joinClause = `JOIN subcategories s ON p.subcategory_id = s.id ${brandJoin}`;

		const countSql = `SELECT COUNT(*) as total FROM products p ${joinClause} WHERE ${whereClause}`;
		const querySql = `SELECT p.* FROM products p ${joinClause} WHERE ${whereClause} ORDER BY ${orderBy} LIMIT ? OFFSET ?`;

		const countResult = await db.prepare(countSql).bind(...bindings).first<{ total: number }>();
		const result = await db.prepare(querySql).bind(...bindings, limit, offset).all<Product>();
		return { products: result.results, total: countResult?.total ?? 0 };
	}

	if (categorySlug) {
		const countSql = `SELECT COUNT(*) as total FROM products p
			JOIN product_categories pc ON p.id = pc.product_id
			JOIN categories c ON pc.category_id = c.id
			${brandJoin}
			WHERE ${whereClause} AND c.slug = ?`;

		const querySql = `SELECT p.* FROM products p
			JOIN product_categories pc ON p.id = pc.product_id
			JOIN categories c ON pc.category_id = c.id
			${brandJoin}
			WHERE ${whereClause} AND c.slug = ?
			ORDER BY ${orderBy}
			LIMIT ? OFFSET ?`;

		const countResult = await db.prepare(countSql).bind(...bindings, categorySlug).first<{ total: number }>();
		const result = await db.prepare(querySql).bind(...bindings, categorySlug, limit, offset).all<Product>();
		return { products: result.results, total: countResult?.total ?? 0 };
	}

	const countSql = `SELECT COUNT(*) as total FROM products p ${brandJoin} WHERE ${whereClause}`;
	const querySql = `SELECT p.* FROM products p ${brandJoin} WHERE ${whereClause} ORDER BY ${orderBy} LIMIT ? OFFSET ?`;

	const countResult = await db.prepare(countSql).bind(...bindings).first<{ total: number }>();
	const result = await db.prepare(querySql).bind(...bindings, limit, offset).all<Product>();
	return { products: result.results, total: countResult?.total ?? 0 };
}

// Get available spec keys and their values — only when a subcategory is selected
export async function getAvailableSpecs(db: D1Database, subcategorySlug?: string): Promise<Record<string, string[]>> {
	// Only show spec filters when browsing a specific subcategory
	if (!subcategorySlug) return {};

	const sql = `SELECT p.specs FROM products p
		JOIN subcategories s ON p.subcategory_id = s.id
		WHERE p.active = 1 AND s.slug = ?`;

	const result = await db.prepare(sql).bind(subcategorySlug).all<{ specs: string }>();

	const specMap: Record<string, Set<string>> = {};
	for (const row of result.results) {
		try {
			const specs = JSON.parse(row.specs);
			for (const [key, value] of Object.entries(specs)) {
				if (!specMap[key]) specMap[key] = new Set();
				specMap[key].add(String(value));
			}
		} catch { /* skip invalid JSON */ }
	}

	const sorted: Record<string, string[]> = {};
	for (const [key, values] of Object.entries(specMap)) {
		sorted[key] = [...values].sort();
	}
	return sorted;
}

// Get min/max price range  
export async function getPriceRange(db: D1Database, categorySlug?: string): Promise<{ min: number; max: number }> {
	let sql: string;
	const bindings: string[] = [];

	if (categorySlug) {
		sql = `SELECT MIN(p.price) as min, MAX(p.price) as max FROM products p
			JOIN product_categories pc ON p.id = pc.product_id
			JOIN categories c ON pc.category_id = c.id
			WHERE p.active = 1 AND c.slug = ?`;
		bindings.push(categorySlug);
	} else {
		sql = 'SELECT MIN(price) as min, MAX(price) as max FROM products WHERE active = 1';
	}

	const result = await db.prepare(sql).bind(...bindings).first<{ min: number; max: number }>();
	return { min: result?.min ?? 0, max: result?.max ?? 0 };
}

export async function searchProducts(db: D1Database, query: string, categoryId?: number): Promise<Product[]> {
	// Split into terms for AND matching
	const terms = query.split(/\s+/).filter(t => t.length > 0);
	if (terms.length === 0) return [];

	const termConditions = terms.map(() =>
		`(p.name LIKE ? OR p.description LIKE ? OR p.specs LIKE ? OR EXISTS (SELECT 1 FROM brands br WHERE br.id = p.brand_id AND br.name LIKE ?) OR EXISTS (SELECT 1 FROM subcategories sc WHERE sc.id = p.subcategory_id AND sc.name LIKE ?))`
	);
	const searchWhere = termConditions.join(' AND ');
	const searchBindings: string[] = [];
	for (const term of terms) {
		searchBindings.push(`%${term}%`, `%${term}%`, `%${term}%`, `%${term}%`, `%${term}%`);
	}

	// Relevance: name exact > name contains > brand > description
	const relevanceOrder = `
		CASE
			WHEN LOWER(p.name) = LOWER(?) THEN 1
			WHEN LOWER(p.name) LIKE LOWER(?) THEN 2
			WHEN EXISTS (SELECT 1 FROM brands br WHERE br.id = p.brand_id AND br.name LIKE ?) THEN 3
			ELSE 4
		END, p.sales_count DESC`;
	const relevanceBindings = [query, `%${query}%`, `%${query}%`];

	if (categoryId) {
		const result = await db.prepare(
			`SELECT p.* FROM products p
			 JOIN product_categories pc ON p.id = pc.product_id
			 WHERE p.active = 1 AND pc.category_id = ?
			 AND (${searchWhere})
			 ORDER BY ${relevanceOrder}`
		).bind(categoryId, ...searchBindings, ...relevanceBindings).all<Product>();
		return result.results;
	}
	const result = await db.prepare(
		`SELECT p.* FROM products p WHERE p.active = 1
		 AND (${searchWhere})
		 ORDER BY ${relevanceOrder}`
	).bind(...searchBindings, ...relevanceBindings).all<Product>();
	return result.results;
}

export async function getProductsByCategory(db: D1Database, categoryId: number): Promise<Product[]> {
	const result = await db.prepare(
		`SELECT p.* FROM products p
		 JOIN product_categories pc ON p.id = pc.product_id
		 WHERE p.active = 1 AND pc.category_id = ?
		 ORDER BY p.created_at DESC`
	).bind(categoryId).all<Product>();
	return result.results;
}

export async function getProductsByCategorySlug(db: D1Database, slug: string): Promise<Product[]> {
	const result = await db.prepare(
		`SELECT p.* FROM products p
		 JOIN product_categories pc ON p.id = pc.product_id
		 JOIN categories c ON pc.category_id = c.id
		 WHERE p.active = 1 AND c.slug = ?
		 ORDER BY p.created_at DESC`
	).bind(slug).all<Product>();
	return result.results;
}

export async function getRecommendedProducts(db: D1Database, productId: number, limit = 4, customerId: number | null = null): Promise<Product[]> {
	const seen = new Set<number>([productId]);
	const results: Product[] = [];

	// 1. Products frequently bought together (co-purchased)
	try {
		const coPurchased = await db.prepare(
			`SELECT p.* FROM products p
			 WHERE p.active = 1 AND p.id != ?
			 AND p.id IN (
				SELECT oi2.product_id FROM order_items oi1
				JOIN order_items oi2 ON oi1.order_id = oi2.order_id
				WHERE oi1.product_id = ? AND oi2.product_id != ?
				GROUP BY oi2.product_id
				ORDER BY COUNT(*) DESC
				LIMIT ?
			 )`
		).bind(productId, productId, productId, limit).all<Product>();
		for (const p of coPurchased.results) {
			if (!seen.has(p.id)) { results.push(p); seen.add(p.id); }
		}
	} catch {}

	// 2. Products viewed by customers who also viewed this product (collaborative filtering)
	if (results.length < limit && customerId) {
		try {
			const coViewed = await db.prepare(
				`SELECT p.* FROM products p
				 WHERE p.active = 1 AND p.id != ?
				 AND p.id IN (
					SELECT pv2.product_id FROM product_views pv1
					JOIN product_views pv2 ON pv1.customer_id = pv2.customer_id
					WHERE pv1.product_id = ? AND pv2.product_id != ?
					AND pv1.customer_id IS NOT NULL
					GROUP BY pv2.product_id
					ORDER BY COUNT(*) DESC
					LIMIT ?
				 )
				 ORDER BY p.sales_count DESC
				 LIMIT ?`
			).bind(productId, productId, productId, limit * 2, limit - results.length).all<Product>();
			for (const p of coViewed.results) {
				if (!seen.has(p.id)) { results.push(p); seen.add(p.id); }
			}
		} catch {}
	}

	// 3. Same category products (original logic)
	if (results.length < limit) {
		try {
			const sameCategory = await db.prepare(
				`SELECT DISTINCT p.* FROM products p
				 JOIN product_categories pc ON p.id = pc.product_id
				 WHERE p.active = 1 AND p.id != ?
				 AND pc.category_id IN (
					SELECT category_id FROM product_categories WHERE product_id = ?
				 )
				 ORDER BY p.sales_count DESC, p.featured DESC, p.created_at DESC
				 LIMIT ?`
			).bind(productId, productId, limit * 2).all<Product>();
			for (const p of sameCategory.results) {
				if (!seen.has(p.id)) { results.push(p); seen.add(p.id); }
				if (results.length >= limit) break;
			}
		} catch {}
	}

	// 4. Popular / trending products fallback
	if (results.length < limit) {
		try {
			const popular = await db.prepare(
				`SELECT p.* FROM products p
				 LEFT JOIN product_views pv ON p.id = pv.product_id AND pv.created_at > datetime('now', '-30 days')
				 WHERE p.active = 1 AND p.id != ?
				 GROUP BY p.id
				 ORDER BY COUNT(pv.id) DESC, p.sales_count DESC, p.featured DESC
				 LIMIT ?`
			).bind(productId, limit * 2).all<Product>();
			for (const p of popular.results) {
				if (!seen.has(p.id)) { results.push(p); seen.add(p.id); }
				if (results.length >= limit) break;
			}
		} catch {}
	}

	return results.slice(0, limit);
}

export async function createProduct(db: D1Database, product: {
	name: string; description: string; price: number; stock: number; image_key: string | null;
	compare_at_price?: number | null; featured?: number; subcategory_id?: number | null; brand_id?: number | null; specs?: string;
}): Promise<number> {
	const result = await db.prepare(
		'INSERT INTO products (name, description, price, compare_at_price, stock, image_key, featured, subcategory_id, brand_id, specs) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
	).bind(
		product.name, product.description, product.price, product.compare_at_price ?? null,
		product.stock, product.image_key, product.featured ?? 0,
		product.subcategory_id ?? null, product.brand_id ?? null, product.specs ?? '{}'
	).run();
	return result.meta.last_row_id as number;
}

export async function updateProduct(db: D1Database, id: number, product: {
	name: string; description: string; price: number; stock: number; image_key: string | null; active: number;
	compare_at_price?: number | null; featured?: number; subcategory_id?: number | null; brand_id?: number | null; specs?: string;
}): Promise<void> {
	await db.prepare(
		'UPDATE products SET name = ?, description = ?, price = ?, compare_at_price = ?, stock = ?, image_key = ?, active = ?, featured = ?, subcategory_id = ?, brand_id = ?, specs = ? WHERE id = ?'
	).bind(
		product.name, product.description, product.price, product.compare_at_price ?? null,
		product.stock, product.image_key, product.active, product.featured ?? 0,
		product.subcategory_id ?? null, product.brand_id ?? null, product.specs ?? '{}', id
	).run();
}

export async function deleteProduct(db: D1Database, id: number): Promise<void> {
	await db.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
}

export async function decrementStock(db: D1Database, productId: number, quantity: number): Promise<boolean> {
	const result = await db.prepare('UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?')
		.bind(quantity, productId, quantity).run();
	return (result.meta.changes ?? 0) > 0;
}

export async function incrementStock(db: D1Database, productId: number, quantity: number): Promise<void> {
	await db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?')
		.bind(quantity, productId).run();
}

export async function getLowStockProducts(db: D1Database, threshold = 5): Promise<Product[]> {
	const result = await db.prepare('SELECT * FROM products WHERE active = 1 AND stock < ? ORDER BY stock ASC')
		.bind(threshold).all<Product>();
	return result.results;
}

// ─── Customers ───────────────────────────────────────────
export async function getCustomerByEmail(db: D1Database, email: string): Promise<Customer | null> {
	return db.prepare('SELECT * FROM customers WHERE email = ?').bind(email).first<Customer>();
}

export async function getCustomerById(db: D1Database, id: number): Promise<Customer | null> {
	return db.prepare('SELECT * FROM customers WHERE id = ?').bind(id).first<Customer>();
}

export async function createCustomer(db: D1Database, customer: {
	email: string; password_hash: string; name: string; phone: string;
}): Promise<number> {
	const result = await db.prepare(
		'INSERT INTO customers (email, password_hash, name, phone) VALUES (?, ?, ?, ?)'
	).bind(customer.email, customer.password_hash, customer.name, customer.phone).run();
	return result.meta.last_row_id as number;
}

// ─── Sessions ────────────────────────────────────────────
export async function createSession(db: D1Database, session: Session): Promise<void> {
	await db.prepare('INSERT INTO sessions (id, customer_id, expires_at) VALUES (?, ?, ?)')
		.bind(session.id, session.customer_id, session.expires_at).run();
}

export async function getSession(db: D1Database, sessionId: string): Promise<(Session & { customer_name: string; customer_email: string }) | null> {
	return db.prepare(
		`SELECT sessions.*, customers.name as customer_name, customers.email as customer_email 
		 FROM sessions JOIN customers ON sessions.customer_id = customers.id 
		 WHERE sessions.id = ? AND sessions.expires_at > datetime('now')`
	).bind(sessionId).first();
}

export async function deleteSession(db: D1Database, sessionId: string): Promise<void> {
	await db.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
}

// ─── Password Reset Tokens ──────────────────────────────
export async function createPasswordResetToken(db: D1Database, token: { id: string; customer_id: number; expires_at: string }): Promise<void> {
	// Invalidate any existing unused tokens for this customer
	await db.prepare('DELETE FROM password_reset_tokens WHERE customer_id = ? AND used = 0')
		.bind(token.customer_id).run();
	await db.prepare('INSERT INTO password_reset_tokens (id, customer_id, expires_at) VALUES (?, ?, ?)')
		.bind(token.id, token.customer_id, token.expires_at).run();
}

export async function getPasswordResetToken(db: D1Database, tokenId: string): Promise<(PasswordResetToken & { customer_email: string }) | null> {
	return db.prepare(
		`SELECT password_reset_tokens.*, customers.email as customer_email
		 FROM password_reset_tokens
		 JOIN customers ON password_reset_tokens.customer_id = customers.id
		 WHERE password_reset_tokens.id = ? AND password_reset_tokens.used = 0
		 AND password_reset_tokens.expires_at > datetime('now')`
	).bind(tokenId).first();
}

export async function markResetTokenUsed(db: D1Database, tokenId: string): Promise<void> {
	await db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE id = ?').bind(tokenId).run();
}

export async function updateCustomerPassword(db: D1Database, customerId: number, passwordHash: string): Promise<void> {
	await db.prepare('UPDATE customers SET password_hash = ? WHERE id = ?')
		.bind(passwordHash, customerId).run();
}

// ─── Orders ──────────────────────────────────────────────
export async function createOrder(db: D1Database, order: {
	customer_id: number | null; name: string; email: string; phone: string;
	total: number; shipping_address: string; notes: string;
}): Promise<number> {
	const result = await db.prepare(
		`INSERT INTO orders (customer_id, name, email, phone, total, shipping_address, notes) 
		 VALUES (?, ?, ?, ?, ?, ?, ?)`
	).bind(order.customer_id, order.name, order.email, order.phone, order.total, order.shipping_address, order.notes).run();
	return result.meta.last_row_id as number;
}

export async function createOrderItem(db: D1Database, item: {
	order_id: number; product_id: number; quantity: number; price_at_purchase: number;
}): Promise<void> {
	await db.prepare(
		'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)'
	).bind(item.order_id, item.product_id, item.quantity, item.price_at_purchase).run();
}

export async function getOrderById(db: D1Database, id: number): Promise<Order | null> {
	return db.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first<Order>();
}

export async function getOrderItems(db: D1Database, orderId: number): Promise<OrderItemWithProduct[]> {
	const result = await db.prepare(
		`SELECT order_items.*, products.name as product_name, products.image_key as product_image_key
		 FROM order_items JOIN products ON order_items.product_id = products.id
		 WHERE order_items.order_id = ?`
	).bind(orderId).all<OrderItemWithProduct>();
	return result.results;
}

export async function getOrdersByCustomer(db: D1Database, customerId: number): Promise<Order[]> {
	const result = await db.prepare('SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC')
		.bind(customerId).all<Order>();
	return result.results;
}

export async function getAllOrders(db: D1Database, status?: string): Promise<Order[]> {
	if (status && status !== 'all') {
		const result = await db.prepare('SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC')
			.bind(status).all<Order>();
		return result.results;
	}
	const result = await db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all<Order>();
	return result.results;
}

export async function updateOrderStatus(db: D1Database, orderId: number, status: string): Promise<void> {
	await db.prepare('UPDATE orders SET status = ? WHERE id = ?').bind(status, orderId).run();
}

export async function getOrderCounts(db: D1Database): Promise<{
	total: number; pending: number; confirmed: number; shipped: number; today: number;
}> {
	const total = await db.prepare('SELECT COUNT(*) as c FROM orders').first<{ c: number }>();
	const pending = await db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'pending'").first<{ c: number }>();
	const confirmed = await db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'confirmed'").first<{ c: number }>();
	const shipped = await db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'shipped'").first<{ c: number }>();
	const today = await db.prepare("SELECT COUNT(*) as c FROM orders WHERE date(created_at) = date('now')").first<{ c: number }>();
	return {
		total: total?.c ?? 0,
		pending: pending?.c ?? 0,
		confirmed: confirmed?.c ?? 0,
		shipped: shipped?.c ?? 0,
		today: today?.c ?? 0
	};
}

// ─── Admins ──────────────────────────────────────────────
export async function getAdminByEmail(db: D1Database, email: string): Promise<Admin | null> {
	return db.prepare('SELECT * FROM admins WHERE email = ?').bind(email).first<Admin>();
}

export async function createAdminSession(db: D1Database, session: AdminSession): Promise<void> {
	await db.prepare('INSERT INTO admin_sessions (id, admin_id, expires_at) VALUES (?, ?, ?)')
		.bind(session.id, session.admin_id, session.expires_at).run();
}

export async function getAdminSession(db: D1Database, sessionId: string): Promise<(AdminSession & { admin_email: string }) | null> {
	return db.prepare(
		`SELECT admin_sessions.*, admins.email as admin_email 
		 FROM admin_sessions JOIN admins ON admin_sessions.admin_id = admins.id 
		 WHERE admin_sessions.id = ? AND admin_sessions.expires_at > datetime('now')`
	).bind(sessionId).first();
}

export async function deleteAdminSession(db: D1Database, sessionId: string): Promise<void> {
	await db.prepare('DELETE FROM admin_sessions WHERE id = ?').bind(sessionId).run();
}

export async function getAdminCount(db: D1Database): Promise<number> {
	const result = await db.prepare('SELECT COUNT(*) as c FROM admins').first<{ c: number }>();
	return result?.c ?? 0;
}

export async function createAdmin(db: D1Database, admin: { email: string; password_hash: string }): Promise<void> {
	await db.prepare('INSERT INTO admins (email, password_hash) VALUES (?, ?)')
		.bind(admin.email, admin.password_hash).run();
}

// ─── Categories ──────────────────────────────────────────
export async function getAllCategories(db: D1Database): Promise<Category[]> {
	const result = await db.prepare(
		`SELECT c.*, COUNT(pc.product_id) as product_count
		 FROM categories c
		 LEFT JOIN product_categories pc ON c.id = pc.category_id
		 LEFT JOIN products p ON pc.product_id = p.id AND p.active = 1
		 GROUP BY c.id
		 ORDER BY c.sort_order ASC`
	).all<Category>();
	return result.results;
}

export async function getCategoryBySlug(db: D1Database, slug: string): Promise<Category | null> {
	return db.prepare('SELECT * FROM categories WHERE slug = ?').bind(slug).first<Category>();
}

export async function getCategoryById(db: D1Database, id: number): Promise<Category | null> {
	return db.prepare('SELECT * FROM categories WHERE id = ?').bind(id).first<Category>();
}

export async function getProductCategoryIds(db: D1Database, productId: number): Promise<number[]> {
	const result = await db.prepare(
		'SELECT category_id FROM product_categories WHERE product_id = ?'
	).bind(productId).all<{ category_id: number }>();
	return result.results.map(r => r.category_id);
}

export async function setProductCategories(db: D1Database, productId: number, categoryIds: number[]): Promise<void> {
	await db.prepare('DELETE FROM product_categories WHERE product_id = ?').bind(productId).run();
	for (const catId of categoryIds) {
		await db.prepare(
			'INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)'
		).bind(productId, catId).run();
	}
}

// ─── Subcategories ──────────────────────────────────────
export async function getAllSubcategoriesGrouped(db: D1Database): Promise<Record<string, Subcategory[]>> {
	const result = await db.prepare(
		`SELECT s.*, c.slug as category_slug,
		        (SELECT COUNT(*) FROM products p WHERE p.subcategory_id = s.id AND p.active = 1) as product_count
		 FROM subcategories s
		 JOIN categories c ON s.category_id = c.id
		 ORDER BY s.sort_order ASC`
	).all<Subcategory & { category_slug: string }>();

	const grouped: Record<string, Subcategory[]> = {};
	for (const row of result.results) {
		const catSlug = row.category_slug;
		if (!grouped[catSlug]) grouped[catSlug] = [];
		grouped[catSlug].push({
			id: row.id,
			name: row.name,
			slug: row.slug,
			category_id: row.category_id,
			sort_order: row.sort_order,
			product_count: row.product_count,
			created_at: row.created_at
		});
	}
	return grouped;
}

export async function getSubcategoriesByCategory(db: D1Database, categorySlug: string): Promise<Subcategory[]> {
	const result = await db.prepare(
		`SELECT s.*, (SELECT COUNT(*) FROM products p WHERE p.subcategory_id = s.id AND p.active = 1) as product_count
		 FROM subcategories s
		 JOIN categories c ON s.category_id = c.id
		 WHERE c.slug = ?
		 ORDER BY s.sort_order ASC`
	).bind(categorySlug).all<Subcategory>();
	return result.results;
}

// ─── Search History ─────────────────────────────────────
export async function saveSearchQuery(db: D1Database, customerId: number | null, query: string, resultsCount: number): Promise<void> {
	await db.prepare(
		'INSERT INTO search_history (customer_id, query, results_count) VALUES (?, ?, ?)'
	).bind(customerId, query, resultsCount).run();
}

export async function getRecentSearches(db: D1Database, customerId: number, limit = 5): Promise<SearchHistoryItem[]> {
	const result = await db.prepare(
		`SELECT * FROM search_history WHERE customer_id = ?
		 GROUP BY query ORDER BY MAX(created_at) DESC LIMIT ?`
	).bind(customerId, limit).all<SearchHistoryItem>();
	return result.results;
}

export async function getPopularSearches(db: D1Database, limit = 5): Promise<string[]> {
	const result = await db.prepare(
		`SELECT query, COUNT(*) as cnt FROM search_history
		 GROUP BY query ORDER BY cnt DESC LIMIT ?`
	).bind(limit).all<{ query: string; cnt: number }>();
	return result.results.map(r => r.query);
}

// ─── Product Views ──────────────────────────────────────
export async function recordProductView(db: D1Database, productId: number, customerId: number | null): Promise<void> {
	await db.prepare(
		'INSERT INTO product_views (product_id, customer_id) VALUES (?, ?)'
	).bind(productId, customerId).run();
}

export async function getPopularProducts(db: D1Database, limit = 8): Promise<Product[]> {
	const result = await db.prepare(
		`SELECT p.*, COUNT(pv.id) as view_count FROM products p
		 LEFT JOIN product_views pv ON p.id = pv.product_id
		 WHERE p.active = 1
		 GROUP BY p.id
		 ORDER BY view_count DESC, p.created_at DESC
		 LIMIT ?`
	).bind(limit).all<Product>();
	return result.results;
}

// ─── Featured Slides ────────────────────────────────────
export async function getActiveSlides(db: D1Database): Promise<FeaturedSlide[]> {
	const result = await db.prepare(
		'SELECT * FROM featured_slides WHERE active = 1 ORDER BY sort_order ASC'
	).all<FeaturedSlide>();
	return result.results;
}

export async function getAllSlides(db: D1Database): Promise<FeaturedSlide[]> {
	const result = await db.prepare(
		'SELECT * FROM featured_slides ORDER BY sort_order ASC'
	).all<FeaturedSlide>();
	return result.results;
}

export async function getSlideById(db: D1Database, id: number): Promise<FeaturedSlide | null> {
	return db.prepare('SELECT * FROM featured_slides WHERE id = ?').bind(id).first<FeaturedSlide>();
}

export async function createSlide(db: D1Database, slide: {
	title: string; subtitle: string; cta_text: string; cta_link: string;
	bg_color: string; text_color: string; image_key: string | null;
	bg_image_desktop_key: string | null; bg_image_mobile_key: string | null;
	bg_image_position: string; overlay_opacity: number;
	product_id: number | null; sort_order: number; active: number;
}): Promise<number> {
	const result = await db.prepare(
		`INSERT INTO featured_slides (title, subtitle, cta_text, cta_link, bg_color, text_color, image_key, bg_image_desktop_key, bg_image_mobile_key, bg_image_position, overlay_opacity, product_id, sort_order, active)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
	).bind(
		slide.title, slide.subtitle, slide.cta_text, slide.cta_link,
		slide.bg_color, slide.text_color, slide.image_key,
		slide.bg_image_desktop_key, slide.bg_image_mobile_key,
		slide.bg_image_position, slide.overlay_opacity,
		slide.product_id, slide.sort_order, slide.active
	).run();
	return result.meta.last_row_id as number;
}

export async function updateSlide(db: D1Database, id: number, slide: {
	title: string; subtitle: string; cta_text: string; cta_link: string;
	bg_color: string; text_color: string; image_key: string | null;
	bg_image_desktop_key: string | null; bg_image_mobile_key: string | null;
	bg_image_position: string; overlay_opacity: number;
	product_id: number | null; sort_order: number; active: number;
}): Promise<void> {
	await db.prepare(
		`UPDATE featured_slides SET title=?, subtitle=?, cta_text=?, cta_link=?, bg_color=?, text_color=?, image_key=?, bg_image_desktop_key=?, bg_image_mobile_key=?, bg_image_position=?, overlay_opacity=?, product_id=?, sort_order=?, active=? WHERE id=?`
	).bind(
		slide.title, slide.subtitle, slide.cta_text, slide.cta_link,
		slide.bg_color, slide.text_color, slide.image_key,
		slide.bg_image_desktop_key, slide.bg_image_mobile_key,
		slide.bg_image_position, slide.overlay_opacity,
		slide.product_id, slide.sort_order, slide.active, id
	).run();
}

export async function deleteSlide(db: D1Database, id: number): Promise<void> {
	await db.prepare('DELETE FROM featured_slides WHERE id = ?').bind(id).run();
}

// ─── Product Reviews ─────────────────────────────────────
export async function getProductReviews(db: D1Database, productId: number): Promise<ProductReview[]> {
	const result = await db.prepare(
		`SELECT pr.*, c.name AS customer_name
		 FROM product_reviews pr
		 JOIN customers c ON c.id = pr.customer_id
		 WHERE pr.product_id = ?
		 ORDER BY pr.created_at DESC`
	).bind(productId).all<ProductReview>();
	return result.results;
}

export async function hasCustomerPurchasedProduct(db: D1Database, customerId: number, productId: number): Promise<boolean> {
	const row = await db.prepare(
		`SELECT 1 FROM orders o
		 JOIN order_items oi ON oi.order_id = o.id
		 WHERE o.customer_id = ? AND oi.product_id = ? AND o.status IN ('confirmed','shipped','delivered')
		 LIMIT 1`
	).bind(customerId, productId).first();
	return !!row;
}

export async function hasCustomerReviewedProduct(db: D1Database, customerId: number, productId: number): Promise<boolean> {
	const row = await db.prepare(
		'SELECT 1 FROM product_reviews WHERE customer_id = ? AND product_id = ? LIMIT 1'
	).bind(customerId, productId).first();
	return !!row;
}

export async function createProductReview(db: D1Database, review: {
	product_id: number; customer_id: number; rating: number; title: string; body: string;
}): Promise<void> {
	await db.prepare(
		'INSERT INTO product_reviews (product_id, customer_id, rating, title, body) VALUES (?, ?, ?, ?, ?)'
	).bind(review.product_id, review.customer_id, review.rating, review.title, review.body).run();
}

export async function getProductImages(db: D1Database, productId: number): Promise<ProductImage[]> {
	const result = await db.prepare(
		'SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC'
	).bind(productId).all<ProductImage>();
	return result.results;
}

export async function addProductImage(db: D1Database, productId: number, imageKey: string, sortOrder: number): Promise<number> {
	const result = await db.prepare(
		'INSERT INTO product_images (product_id, image_key, sort_order) VALUES (?, ?, ?)'
	).bind(productId, imageKey, sortOrder).run();
	return result.meta.last_row_id as number;
}

export async function deleteProductImage(db: D1Database, imageId: number): Promise<string | null> {
	const row = await db.prepare('SELECT image_key FROM product_images WHERE id = ?').bind(imageId).first<{ image_key: string }>();
	if (row) {
		await db.prepare('DELETE FROM product_images WHERE id = ?').bind(imageId).run();
		return row.image_key;
	}
	return null;
}

// ─── Admin: Customers ────────────────────────────────────
export async function getAllCustomers(db: D1Database): Promise<(Customer & { order_count: number; total_spent: number })[]> {
	const result = await db.prepare(
		`SELECT c.*, 
		 COUNT(o.id) as order_count,
		 COALESCE(SUM(o.total), 0) as total_spent
		 FROM customers c
		 LEFT JOIN orders o ON c.id = o.customer_id
		 GROUP BY c.id
		 ORDER BY c.created_at DESC`
	).all<Customer & { order_count: number; total_spent: number }>();
	return result.results;
}

// ─── Admin: Reviews ──────────────────────────────────────
export async function getAllReviews(db: D1Database): Promise<(ProductReview & { product_name: string })[]> {
	const result = await db.prepare(
		`SELECT pr.*, c.name AS customer_name, p.name AS product_name
		 FROM product_reviews pr
		 JOIN customers c ON c.id = pr.customer_id
		 JOIN products p ON p.id = pr.product_id
		 ORDER BY pr.created_at DESC`
	).all<ProductReview & { product_name: string }>();
	return result.results;
}

export async function deleteReview(db: D1Database, reviewId: number): Promise<void> {
	await db.prepare('DELETE FROM product_reviews WHERE id = ?').bind(reviewId).run();
}

// ─── Admin: Category CRUD ─────────────────────────────────
export async function createCategory(db: D1Database, data: {
	name: string; slug: string; description?: string; icon?: string; image_key?: string | null; sort_order?: number;
}): Promise<number> {
	const result = await db.prepare(
		`INSERT INTO categories (name, slug, description, icon, image_key, sort_order) VALUES (?, ?, ?, ?, ?, ?)`
	).bind(data.name, data.slug, data.description ?? '', data.icon ?? '', data.image_key ?? null, data.sort_order ?? 0).run();
	return result.meta.last_row_id as number;
}

export async function updateCategory(db: D1Database, id: number, data: {
	name: string; slug: string; description?: string; icon?: string; image_key?: string | null; sort_order?: number;
}): Promise<void> {
	await db.prepare(
		`UPDATE categories SET name = ?, slug = ?, description = ?, icon = ?, image_key = ?, sort_order = ? WHERE id = ?`
	).bind(data.name, data.slug, data.description ?? '', data.icon ?? '', data.image_key ?? null, data.sort_order ?? 0, id).run();
}

export async function deleteCategory(db: D1Database, id: number): Promise<void> {
	await db.prepare('DELETE FROM categories WHERE id = ?').bind(id).run();
}

// ─── Admin: Subcategory CRUD ──────────────────────────────
export async function getAllSubcategories(db: D1Database): Promise<(Subcategory & { category_name: string })[]> {
	const result = await db.prepare(
		`SELECT s.*, c.name as category_name
		 FROM subcategories s
		 JOIN categories c ON s.category_id = c.id
		 ORDER BY c.sort_order ASC, s.sort_order ASC`
	).all<Subcategory & { category_name: string }>();
	return result.results;
}

export async function createSubcategory(db: D1Database, data: {
	name: string; slug: string; category_id: number; sort_order?: number;
}): Promise<number> {
	const result = await db.prepare(
		`INSERT INTO subcategories (name, slug, category_id, sort_order) VALUES (?, ?, ?, ?)`
	).bind(data.name, data.slug, data.category_id, data.sort_order ?? 0).run();
	return result.meta.last_row_id as number;
}

export async function updateSubcategory(db: D1Database, id: number, data: {
	name: string; slug: string; category_id: number; sort_order?: number;
}): Promise<void> {
	await db.prepare(
		`UPDATE subcategories SET name = ?, slug = ?, category_id = ?, sort_order = ? WHERE id = ?`
	).bind(data.name, data.slug, data.category_id, data.sort_order ?? 0, id).run();
}

export async function deleteSubcategory(db: D1Database, id: number): Promise<void> {
	await db.prepare('DELETE FROM subcategories WHERE id = ?').bind(id).run();
}

// ─── Brands ──────────────────────────────────────────────
export async function getAllBrands(db: D1Database): Promise<Brand[]> {
	const result = await db.prepare(
		`SELECT b.*, COUNT(p.id) as product_count
		 FROM brands b
		 LEFT JOIN products p ON b.id = p.brand_id AND p.active = 1
		 GROUP BY b.id
		 ORDER BY b.sort_order ASC`
	).all<Brand>();
	return result.results;
}

export async function getPopularBrands(db: D1Database, limit = 12): Promise<Brand[]> {
	const result = await db.prepare(
		`SELECT b.*, COUNT(p.id) as product_count, COALESCE(SUM(p.sales_count), 0) as total_sales
		 FROM brands b
		 LEFT JOIN products p ON b.id = p.brand_id AND p.active = 1
		 GROUP BY b.id
		 HAVING product_count > 0
		 ORDER BY total_sales DESC
		 LIMIT ?`
	).bind(limit).all<Brand>();
	return result.results;
}

export async function getShopBrands(db: D1Database, options?: {
	categorySlug?: string;
	subcategorySlug?: string;
}): Promise<Brand[]> {
	const categorySlug = options?.categorySlug;
	const subcategorySlug = options?.subcategorySlug;

	if (subcategorySlug) {
		// Brands that have products in this subcategory
		const result = await db.prepare(
			`SELECT b.*, COUNT(p.id) as product_count
			 FROM brands b
			 JOIN products p ON b.id = p.brand_id AND p.active = 1
			 JOIN subcategories s ON p.subcategory_id = s.id
			 WHERE s.slug = ?
			 GROUP BY b.id
			 ORDER BY SUM(p.sales_count) DESC`
		).bind(subcategorySlug).all<Brand>();
		return result.results;
	}

	if (categorySlug) {
		// Brands that have products in this category
		const result = await db.prepare(
			`SELECT b.*, COUNT(p.id) as product_count
			 FROM brands b
			 JOIN products p ON b.id = p.brand_id AND p.active = 1
			 JOIN product_categories pc ON p.id = pc.product_id
			 JOIN categories c ON pc.category_id = c.id
			 WHERE c.slug = ?
			 GROUP BY b.id
			 ORDER BY SUM(p.sales_count) DESC`
		).bind(categorySlug).all<Brand>();
		return result.results;
	}

	// Default: top 6 brands by total sales
	const result = await db.prepare(
		`SELECT b.*, COUNT(p.id) as product_count
		 FROM brands b
		 JOIN products p ON b.id = p.brand_id AND p.active = 1
		 GROUP BY b.id
		 ORDER BY SUM(p.sales_count) DESC
		 LIMIT 6`
	).all<Brand>();
	return result.results;
}

export async function getBrandBySlug(db: D1Database, slug: string): Promise<Brand | null> {
	return db.prepare('SELECT * FROM brands WHERE slug = ?').bind(slug).first<Brand>();
}

export async function getBrandById(db: D1Database, id: number): Promise<Brand | null> {
	return db.prepare('SELECT * FROM brands WHERE id = ?').bind(id).first<Brand>();
}

export async function createBrand(db: D1Database, data: {
	name: string; slug: string; logo_key?: string | null; sort_order?: number;
}): Promise<number> {
	const result = await db.prepare(
		`INSERT INTO brands (name, slug, logo_key, sort_order) VALUES (?, ?, ?, ?)`
	).bind(data.name, data.slug, data.logo_key ?? null, data.sort_order ?? 0).run();
	return result.meta.last_row_id as number;
}

export async function updateBrand(db: D1Database, id: number, data: {
	name: string; slug: string; logo_key?: string | null; sort_order?: number;
}): Promise<void> {
	await db.prepare(
		`UPDATE brands SET name = ?, slug = ?, logo_key = ?, sort_order = ? WHERE id = ?`
	).bind(data.name, data.slug, data.logo_key ?? null, data.sort_order ?? 0, id).run();
}

export async function deleteBrand(db: D1Database, id: number): Promise<void> {
	await db.prepare('DELETE FROM brands WHERE id = ?').bind(id).run();
}
