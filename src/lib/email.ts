// Email service using MailChannels (native to Cloudflare Workers)

import type { OrderItemWithProduct, ShippingAddress } from './types';

const FROM_EMAIL = 'noreply@gadgets.store';
const FROM_NAME = 'Gadgets Store';
const ADMIN_EMAIL = 'admin@store.com';

function formatPrice(cents: number): string {
	return `$${(cents / 100).toFixed(2)}`;
}

function buildItemsTable(items: OrderItemWithProduct[]): string {
	let rows = items.map(item =>
		`<tr>
			<td style="padding:8px;border-bottom:1px solid #eee">${item.product_name}</td>
			<td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
			<td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${formatPrice(item.price_at_purchase)}</td>
			<td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${formatPrice(item.price_at_purchase * item.quantity)}</td>
		</tr>`
	).join('');

	return `<table style="width:100%;border-collapse:collapse;margin:16px 0">
		<thead>
			<tr style="background:#f5f5f5">
				<th style="padding:8px;text-align:left">Item</th>
				<th style="padding:8px;text-align:center">Qty</th>
				<th style="padding:8px;text-align:right">Price</th>
				<th style="padding:8px;text-align:right">Subtotal</th>
			</tr>
		</thead>
		<tbody>${rows}</tbody>
	</table>`;
}

async function sendEmail(
	to: string,
	subject: string,
	html: string
): Promise<void> {
	try {
		await fetch('https://api.mailchannels.net/tx/v1/send', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				personalizations: [{ to: [{ email: to }] }],
				from: { email: FROM_EMAIL, name: FROM_NAME },
				subject,
				content: [{ type: 'text/html', value: html }]
			})
		});
		console.log('Email sent successfully to:', to);
	} catch (e) {
		console.error('Failed to send email:', e);
	}
}

export async function sendOrderConfirmation(
	orderId: number,
	customerName: string,
	customerEmail: string,
	items: OrderItemWithProduct[],
	total: number,
	address: ShippingAddress
): Promise<void> {
	const html = `
		<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
			<div style="text-align:center;margin-bottom:24px">
				<div style="display:inline-block;background:linear-gradient(135deg,#f97316,#ea580c);border-radius:8px;padding:8px 12px">
					<span style="color:#fff;font-weight:bold;font-size:20px">🛍️</span>
				</div>
			</div>
			<h2 style="color:#333;text-align:center">Order Confirmation #${orderId}</h2>
			<p>Hi ${customerName},</p>
			<p>Thank you for your order! We're excited to get your items to you. Here's a summary:</p>
			${buildItemsTable(items)}
			<div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:24px 0">
				<p style="font-size:18px;font-weight:bold;margin:0">Total: ${formatPrice(total)}</p>
			</div>
			<h3 style="color:#333">Delivery Address</h3>
			<div style="background:#fff;border:1px solid #eee;padding:16px;border-radius:8px">
				<p style="margin:0">${address.street}<br>${address.city}, ${address.state}</p>
			</div>
			<div style="background:#fff3cd;border-left:4px solid #ffc107;padding:12px;margin:24px 0;border-radius:4px">
				<p style="margin:0;color:#856404">
					<strong>Payment on Delivery:</strong> We will contact you to arrange delivery. Payment is collected upon delivery.
				</p>
			</div>
			<hr style="border:none;border-top:1px solid #eee;margin:24px 0">
			<p style="color:#999;font-size:12px;text-align:center">Thanks for shopping with Gadgets Store!</p>
		</div>
	`;
	await sendEmail(customerEmail, `Order Confirmation #${orderId}`, html);
}

export async function sendAdminNewOrderNotification(
	orderId: number,
	customerName: string,
	customerEmail: string,
	customerPhone: string,
	items: OrderItemWithProduct[],
	total: number,
	address: ShippingAddress
): Promise<void> {
	const html = `
		<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
			<h2 style="color:#333">🔔 New Order #${orderId}</h2>
			<div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:16px 0">
				<h3 style="margin-top:0">Customer Info</h3>
				<p style="margin:4px 0">
					<strong>Name:</strong> ${customerName}<br>
					<strong>Email:</strong> ${customerEmail}<br>
					<strong>Phone:</strong> ${customerPhone}
				</p>
			</div>
			${buildItemsTable(items)}
			<p style="font-size:18px;font-weight:bold">Total: ${formatPrice(total)}</p>
			<div style="background:#fff;border:1px solid #eee;padding:16px;border-radius:8px;margin:16px 0">
				<h3 style="margin-top:0">Delivery Address</h3>
				<p style="margin:0">${address.street}<br>${address.city}, ${address.state}</p>
			</div>
		</div>
	`;
	await sendEmail(ADMIN_EMAIL, `New Order #${orderId} from ${customerName}`, html);
}

export async function sendPasswordResetEmail(
	customerEmail: string,
	customerName: string,
	resetUrl: string
): Promise<void> {
	const html = `
		<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
			<div style="text-align:center;margin-bottom:24px">
				<div style="display:inline-block;background:linear-gradient(135deg,#f97316,#ea580c);border-radius:8px;padding:8px 12px">
					<span style="color:#fff;font-weight:bold;font-size:16px">G</span>
				</div>
			</div>
			<h2 style="color:#333;text-align:center">Reset Your Password</h2>
			<p>Hi ${customerName},</p>
			<p>We received a request to reset the password for your Gadgets Store account. Click the button below to set a new password:</p>
			<div style="text-align:center;margin:32px 0">
				<a href="${resetUrl}" style="background:#f97316;color:#fff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;display:inline-block">Reset Password</a>
			</div>
			<p style="color:#666;font-size:13px">This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
			<hr style="border:none;border-top:1px solid #eee;margin:24px 0">
			<p style="color:#999;font-size:12px;text-align:center">Gadgets Store</p>
		</div>
	`;
	await sendEmail(customerEmail, 'Reset your password — Gadgets Store', html);
}

export async function sendWelcomeEmail(
	customerEmail: string,
	customerName: string
): Promise<void> {
	const html = `
		<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
			<div style="text-align:center;margin-bottom:24px">
				<div style="display:inline-block;background:linear-gradient(135deg,#f97316,#ea580c);border-radius:8px;padding:16px 20px">
					<span style="color:#fff;font-weight:bold;font-size:24px">🎉</span>
				</div>
			</div>
			<h2 style="color:#333;text-align:center">Welcome to Gadgets Store!</h2>
			<p>Hi ${customerName},</p>
			<p>Thank you for creating an account with us! We're thrilled to have you join our community of tech enthusiasts.</p>
			<div style="background:#f5f5f5;padding:20px;border-radius:8px;margin:24px 0">
				<h3 style="margin-top:0;color:#333">What's next?</h3>
				<ul style="color:#666;line-height:1.8">
					<li>Browse our wide selection of electronics and gadgets</li>
					<li>Add items to your cart</li>
					<li>Enjoy secure checkout with payment on delivery</li>
					<li>Track your orders</li>
				</ul>
			</div>
			<div style="text-align:center;margin:32px 0">
				<a href="https://gadgets.store/shop" style="background:#f97316;color:#fff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;display:inline-block">Start Shopping</a>
			</div>
			<hr style="border:none;border-top:1px solid #eee;margin:24px 0">
			<p style="color:#999;font-size:12px;text-align:center">Thanks for choosing Gadgets Store!</p>
		</div>
	`;
	await sendEmail(customerEmail, 'Welcome to Gadgets Store! 🎉', html);
}

export async function sendLoginNotification(
	customerEmail: string,
	customerName: string,
	ipAddress: string,
	userAgent: string
): Promise<void> {
	const now = new Date().toLocaleString('en-US', {
		dateStyle: 'full',
		timeStyle: 'short'
	});

	const html = `
		<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
			<div style="text-align:center;margin-bottom:24px">
				<div style="display:inline-block;background:linear-gradient(135deg,#f97316,#ea580c);border-radius:8px;padding:8px 12px">
					<span style="color:#fff;font-weight:bold;font-size:16px">🔐</span>
				</div>
			</div>
			<h2 style="color:#333;text-align:center">New Login Detected</h2>
			<p>Hi ${customerName},</p>
			<p>We detected a new login to your Gadgets Store account:</p>
			<div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:24px 0">
				<p style="margin:4px 0"><strong>Time:</strong> ${now}</p>
				<p style="margin:4px 0"><strong>IP Address:</strong> ${ipAddress}</p>
				<p style="margin:4px 0"><strong>Browser:</strong> ${userAgent}</p>
			</div>
			<div style="background:#d1ecf1;border-left:4px solid #0c5460;padding:12px;margin:24px 0;border-radius:4px">
				<p style="margin:0;color:#0c5460">
					If this was you, you can safely ignore this email. If you didn't log in, please reset your password immediately and contact our support team.
				</p>
			</div>
			<hr style="border:none;border-top:1px solid #eee;margin:24px 0">
			<p style="color:#999;font-size:12px;text-align:center">Gadgets Store Security Team</p>
		</div>
	`;
	await sendEmail(customerEmail, 'New login to your Gadgets Store account', html);
}
