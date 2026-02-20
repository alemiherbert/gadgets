import type { Product, Customer, Order, OrderItem, OrderItemWithProduct, Admin, AdminSession, Session } from './types';

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

export async function createProduct(db: D1Database, product: {
	name: string; description: string; price: number; stock: number; image_key: string | null;
}): Promise<number> {
	const result = await db.prepare(
		'INSERT INTO products (name, description, price, stock, image_key) VALUES (?, ?, ?, ?, ?)'
	).bind(product.name, product.description, product.price, product.stock, product.image_key).run();
	return result.meta.last_row_id as number;
}

export async function updateProduct(db: D1Database, id: number, product: {
	name: string; description: string; price: number; stock: number; image_key: string | null; active: number;
}): Promise<void> {
	await db.prepare(
		'UPDATE products SET name = ?, description = ?, price = ?, stock = ?, image_key = ?, active = ? WHERE id = ?'
	).bind(product.name, product.description, product.price, product.stock, product.image_key, product.active, id).run();
}

export async function deleteProduct(db: D1Database, id: number): Promise<void> {
	await db.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
}

export async function decrementStock(db: D1Database, productId: number, quantity: number): Promise<void> {
	await db.prepare('UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?')
		.bind(quantity, productId, quantity).run();
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
