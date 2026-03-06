import type { PageServerLoad, Actions } from './$types';
import {
	getProductBySlug, getRecommendedProducts, recordProductView,
	getProductReviews, hasCustomerPurchasedProduct, hasCustomerReviewedProduct, createProductReview,
	getProductImages, getAdjacentProducts
} from '$lib/db';
import { error, fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
	const db = locals.db;
	const product = await getProductBySlug(db, params.slug);

	if (!product || !product.active) {
		throw error(404, 'Product not found');
	}

	const productId = product.id;

	// Track product view (only for logged-in customers to avoid unbounded growth from bots/anonymous)
	const customerId = locals.customer?.id ?? null;
	if (customerId) {
		try { await recordProductView(db, productId, customerId); } catch {}
	}

	const [recommendations, reviews, images, adjacent] = await Promise.all([
		getRecommendedProducts(db, productId, 4, customerId),
		getProductReviews(db, productId),
		getProductImages(db, productId),
		getAdjacentProducts(db, productId)
	]);

	let canReview = false;
	let hasReviewed = false;
	if (customerId) {
		const [purchased, reviewed] = await Promise.all([
			hasCustomerPurchasedProduct(db, customerId, productId),
			hasCustomerReviewedProduct(db, customerId, productId)
		]);
		canReview = purchased && !reviewed;
		hasReviewed = reviewed;
	}

	return { product, recommendations, reviews, images, canReview, hasReviewed, adjacent };
};

export const actions: Actions = {
	review: async ({ request, params, locals }) => {
		if (!locals.customer) return fail(401, { error: 'You must be logged in to leave a review.' });

		const db = locals.db;
		const product = await getProductBySlug(db, params.slug);
		if (!product) return fail(404, { error: 'Product not found.' });
		const productId = product.id;
		const customerId = locals.customer.id;

		const [purchased, reviewed] = await Promise.all([
			hasCustomerPurchasedProduct(db, customerId, productId),
			hasCustomerReviewedProduct(db, customerId, productId)
		]);
		if (!purchased) return fail(403, { error: 'You can only review products you have purchased.' });
		if (reviewed) return fail(409, { error: 'You have already reviewed this product.' });

		const data = await request.formData();
		const rating = parseInt(data.get('rating') as string);
		const title = (data.get('title') as string ?? '').trim();
		const body = (data.get('body') as string ?? '').trim();

		if (!rating || rating < 1 || rating > 5) return fail(400, { error: 'Please select a rating.' });
		if (!body) return fail(400, { error: 'Please write a review.' });

		await createProductReview(db, { product_id: productId, customer_id: customerId, rating, title, body });

		return { success: true };
	}
};
