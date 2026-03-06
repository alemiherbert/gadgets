import type { PageServerLoad } from './$types';
import { getShopProducts, getAllCategories, getAvailableSpecs, getPriceRange, getSubcategoriesByCategory, getShopBrands } from '$lib/db';

export const load: PageServerLoad = async ({ url, locals }) => {
	const db = locals.db;

	const category = url.searchParams.get('category') ?? undefined;
	const subcategory = url.searchParams.get('subcategory') ?? undefined;
	const brand = url.searchParams.get('brand') ?? undefined;
	const sort = url.searchParams.get('sort') ?? 'newest';
	const search = url.searchParams.get('q') ?? undefined;
	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));
	const limit = 48;
	const offset = (page - 1) * limit;

	// Price range from query params (in minor units)
	const minPriceParam = url.searchParams.get('minPrice');
	const maxPriceParam = url.searchParams.get('maxPrice');
	const minPrice = minPriceParam ? parseInt(minPriceParam) : undefined;
	const maxPrice = maxPriceParam ? parseInt(maxPriceParam) : undefined;

	// Parse spec filters from URL: spec_RAM=8GB&spec_RAM=16GB&spec_Storage=256GB
	const specFilters: Record<string, string[]> = {};
	for (const [key, value] of url.searchParams.entries()) {
		if (key.startsWith('spec_')) {
			const specKey = key.slice(5); // remove 'spec_' prefix
			if (!specFilters[specKey]) specFilters[specKey] = [];
			if (!specFilters[specKey].includes(value)) {
				specFilters[specKey].push(value);
			}
		}
	}

	const hasSpecFilters = Object.keys(specFilters).length > 0;

	const [{ products, total }, categories, availableSpecs, priceRange, subcategories, brands] = await Promise.all([
		getShopProducts(db, {
			categorySlug: category,
			subcategorySlug: subcategory,
			brandSlug: brand,
			search,
			minPrice,
			maxPrice,
			specFilters: hasSpecFilters ? specFilters : undefined,
			sort,
			limit,
			offset,
		}),
		getAllCategories(db),
		getAvailableSpecs(db, subcategory),
		getPriceRange(db, category),
		category ? getSubcategoriesByCategory(db, category) : Promise.resolve([]),
		getShopBrands(db, { categorySlug: category, subcategorySlug: subcategory }),
	]);

	const totalPages = Math.ceil(total / limit);

	return {
		products,
		categories,
		subcategories,
		brands,
		total,
		page,
		totalPages,
		activeCategory: category ?? null,
		activeSubcategory: subcategory ?? null,
		activeBrand: brand ?? null,
		activeSort: sort,
		activeSearch: search ?? '',
		activeMinPrice: minPrice ?? null,
		activeMaxPrice: maxPrice ?? null,
		activeSpecFilters: hasSpecFilters ? specFilters : {},
		availableSpecs,
		priceRange,
	};
};
