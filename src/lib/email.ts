// Mailchannels email helpers (native to Cloudflare Workers)

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

async function sendEmail(to: string, toName: string, subject: string, html: string): Promise<void> {
	try {
		await fetch('https://api.mailchannels.net/tx/v1/send', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				personalizations: [{ to: [{ email: to, name: toName }] }],
				from: { email: FROM_EMAIL, name: FROM_NAME },
				subject,
				content: [{ type: 'text/html', value: html }]
			})
		});
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
			<h2 style="color:#333">Order Confirmation #${orderId}</h2>
			<p>Hi ${customerName},</p>
			<p>Thank you for your order! Here's a summary:</p>
			${buildItemsTable(items)}
			<p style="font-size:18px;font-weight:bold">Total: ${formatPrice(total)}</p>
			<h3>Delivery Address</h3>
			<p>${address.street}<br>${address.city}, ${address.state}</p>
			<p style="color:#666;margin-top:24px">
				We will contact you to arrange delivery. Payment is collected on delivery.
			</p>
			<hr style="border:none;border-top:1px solid #eee;margin:24px 0">
			<p style="color:#999;font-size:12px">Gadgets Store</p>
		</div>
	`;
	await sendEmail(customerEmail, customerName, `Order Confirmation #${orderId}`, html);
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
			<h2 style="color:#333">New Order #${orderId}</h2>
			<h3>Customer Info</h3>
			<p>
				<strong>Name:</strong> ${customerName}<br>
				<strong>Email:</strong> ${customerEmail}<br>
				<strong>Phone:</strong> ${customerPhone}
			</p>
			${buildItemsTable(items)}
			<p style="font-size:18px;font-weight:bold">Total: ${formatPrice(total)}</p>
			<h3>Delivery Address</h3>
			<p>${address.street}<br>${address.city}, ${address.state}</p>
		</div>
	`;
	await sendEmail(ADMIN_EMAIL, 'Admin', `New Order #${orderId} from ${customerName}`, html);
}
