# SEO Implementation Guide

## Overview
This document outlines the SEO (Search Engine Optimization) strategy and implementation for Gadgets Store Uganda.

## Technical SEO

### Site Structure
```
https://gadgets.co.ug/
├── /shop (category listings)
│   ├── ?category=audio
│   ├── ?category=wearables
│   └── ?subcategory=earbuds
├── /products/[slug] (product pages)
├── /sitemap.xml
└── /robots.txt
```

### URL Structure
- **Clean URLs**: Descriptive slugs for products
- **No URL parameters for content**: Filters use query strings
- **Canonical URLs**: Implemented on all pages
- **Trailing Slash**: Consistent (no trailing slash)

### Performance
- **CDN**: Cloudflare global CDN
- **Image Optimization**: Cloudflare R2 with caching
- **Font Loading**: display=swap for web fonts
- **Preconnect**: DNS prefetch and preconnect for external resources
- **Code Splitting**: Automatic with SvelteKit

## On-Page SEO

### Title Tags
**Format**: `Primary Keyword | Secondary | Brand`

**Implementation**:
- Homepage: "Gadgets Store Uganda | Premium Electronics, Audio & Wearables | Fast Delivery"
- Product: "[Product Name] — Gadgets Store"
- Shop: "[Category/Subcategory] | Shop | Gadgets Store Uganda"
- Max length: 50-60 characters

### Meta Descriptions
**Guidelines**:
- 150-160 characters optimal
- Include primary keyword
- Call-to-action when appropriate
- Unique per page

**Examples**:
```html
<!-- Homepage -->
<meta name="description" content="Shop the latest smartphones, wireless earbuds, smartwatches, and tech accessories in Uganda. Premium quality, competitive prices, and fast delivery nationwide. Free shipping on orders over UGX 200,000." />

<!-- Product -->
<meta name="description" content="[Product description snippet]. Buy [Product Name] at the best price in Uganda with fast delivery. In stock now at Gadgets Store." />

<!-- Shop -->
<meta name="description" content="Browse [X] [category] products. Premium quality electronics with fast delivery across Uganda. Shop now!" />
```

### Heading Structure
**Best Practices**:
- One H1 per page (product name, page title)
- H2 for major sections
- H3 for subsections
- Semantic hierarchy maintained

### Content Optimization
- **Product Descriptions**: Detailed, unique descriptions
- **Keyword Placement**: Natural inclusion in content
- **Alt Text**: All images have descriptive alt attributes
- **Internal Linking**: Cross-link related products

## Structured Data (Schema.org)

### Organization Schema
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Gadgets Store Uganda",
  "url": "https://gadgets.co.ug",
  "logo": "https://gadgets.co.ug/img/logo.png",
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "Customer Service",
    "email": "support@gadgets.co.ug"
  }
}
```
**Location**: `src/routes/+layout.svelte`

### Product Schema
```json
{
  "@type": "Product",
  "name": "Product Name",
  "description": "Product description",
  "image": ["image1.jpg", "image2.jpg"],
  "sku": "SKU",
  "offers": {
    "@type": "Offer",
    "price": "99.99",
    "priceCurrency": "UGX",
    "availability": "https://schema.org/InStock"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.5",
    "reviewCount": "24"
  }
}
```
**Location**: `src/routes/products/[slug]/+page.svelte`

### Breadcrumb Schema
```json
{
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "/"
    }
  ]
}
```
**Location**: Product pages with breadcrumb navigation

### WebSite Search Schema
```json
{
  "@type": "WebSite",
  "url": "https://gadgets.co.ug",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://gadgets.co.ug/shop?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```
**Location**: `src/routes/+layout.svelte`

### Review Schema
Included in Product schema when reviews exist:
```json
"review": [{
  "@type": "Review",
  "author": {"@type": "Person", "name": "Customer Name"},
  "reviewRating": {"@type": "Rating", "ratingValue": "5"},
  "reviewBody": "Review text"
}]
```

## Sitemap

### Dynamic Sitemap Generation
**File**: `src/routes/sitemap.xml/+server.ts`

**Includes**:
- Static pages (homepage, shop, cart, checkout)
- Category pages (all active categories)
- Product pages (all active products)

**Features**:
- `<lastmod>` dates from database
- Priority values assigned
- Change frequency hints
- Cache-Control: 1 hour

**URL**: `https://gadgets.co.ug/sitemap.xml`

### Submission
- Google Search Console
- Bing Webmaster Tools
- robots.txt reference

## Robots.txt

**File**: `static/robots.txt`

**Configuration**:
```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /account/
Disallow: /checkout/
Disallow: /cart/
Disallow: /api/
Disallow: /auth/
Disallow: /*?*sort=*
Disallow: /*?*page=*

Sitemap: https://gadgets.co.ug/sitemap.xml
```

## Open Graph (Social Media)

### Implementation
Every page includes Open Graph tags for social sharing:

```html
<meta property="og:type" content="product" />
<meta property="og:title" content="Product Name" />
<meta property="og:description" content="Description" />
<meta property="og:image" content="image-url" />
<meta property="og:url" content="canonical-url" />
<meta property="og:site_name" content="Gadgets Store Uganda" />
<meta property="og:locale" content="en_UG" />
```

### Image Requirements
- **Size**: 1200x630px recommended
- **Format**: JPG or PNG
- **Max Size**: < 8MB
- **Ratio**: 1.91:1

### Twitter Cards
```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="@gadgetsug" />
<meta name="twitter:title" content="Title" />
<meta name="twitter:description" content="Description" />
<meta name="twitter:image" content="image-url" />
```

## Mobile Optimization

### Responsive Design
- Mobile-first approach
- Viewport meta tag configured
- Touch-friendly UI elements
- No horizontal scrolling

### Mobile-Specific Tags
```html
<meta name="theme-color" content="#ea580c" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
```

### Web App Manifest
**File**: `static/site.webmanifest`
- App name and short name
- Icons (multiple sizes)
- Theme color
- Display mode

## Local SEO (Uganda Focus)

### Geographic Targeting
- **Language**: en-UG
- **Currency**: UGX (Ugandan Shilling)
- **Location**: Kampala, Uganda
- **Shipping**: Uganda-focused

### Local Keywords
- "Uganda" in key locations
- "Kampala" for local searches
- "buy [product] in Uganda"
- "[product] Uganda price"

### Address Markup
```json
"address": {
  "@type": "PostalAddress",
  "addressCountry": "UG",
  "addressLocality": "Kampala"
}
```

## Content Strategy

### Product Content
- **Unique Descriptions**: No duplicate content
- **Detailed Specs**: Comprehensive specifications
- **Use Cases**: How customers use products
- **Comparisons**: Related product comparisons
- **FAQ**: Common questions answered

### Category Content
- Category overviews
- Buying guides
- Feature comparisons
- Trend articles

### Blog/Content Marketing (Future)
- Tech news and reviews
- Buying guides
- How-to articles
- Product comparisons
- Industry trends

## Link Building

### Internal Linking
- Related products on product pages
- Category navigation
- Breadcrumb navigation
- Cross-sells and up-sells
- Footer links to important pages

### External Linking
- Guest posts on tech blogs
- Local business directories
- Social media profiles
- Partner websites
- Press releases

## Page Speed Optimization

### Current Optimizations
- **CDN**: Cloudflare caching
- **Image Optimization**: R2 with immutable caching
- **Font Loading**: Preconnect + display=swap
- **Code Splitting**: SvelteKit automatic
- **Lazy Loading**: Images lazy-loaded
- **Compression**: Brotli/Gzip enabled

### Performance Metrics Targets
- **Largest Contentful Paint (LCP)**: < 2.5s
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Time to First Byte (TTFB)**: < 600ms

### Tools
- Google PageSpeed Insights
- Lighthouse CI
- WebPageTest
- Chrome DevTools

## Analytics & Tracking

### Recommended Setup
1. **Google Analytics 4**
   - E-commerce tracking
   - User behavior
   - Conversion goals

2. **Google Search Console**
   - Search performance
   - Index coverage
   - Mobile usability
   - Core Web Vitals

3. **Cloudflare Analytics**
   - Traffic sources
   - Bot detection
   - Attack prevention

### Key Metrics to Track
- Organic traffic
- Conversion rate
- Bounce rate
- Average session duration
- Pages per session
- Top landing pages
- Top exit pages
- Search queries
- Click-through rate (CTR)

## Canonical URLs

### Implementation
Every page has a canonical URL to prevent duplicate content:

```html
<link rel="canonical" href="https://gadgets.co.ug/page-url" />
```

### Pagination
Shop pages include prev/next links:
```html
<link rel="prev" href="url?page=1" />
<link rel="next" href="url?page=3" />
```

## Common SEO Issues & Solutions

### Duplicate Content
**Problem**: Multiple URLs for same content
**Solution**: Canonical URLs + robots.txt exclusions

### Thin Content
**Problem**: Product pages with minimal description
**Solution**: Rich, unique descriptions + specs + reviews

### Broken Links
**Problem**: 404 errors hurt SEO
**Solution**: Regular link audits, 301 redirects

### Slow Load Times
**Problem**: High bounce rate
**Solution**: CDN, image optimization, code splitting

### Missing Alt Text
**Problem**: Images not indexed
**Solution**: Descriptive alt text on all images

## SEO Checklist

### Pre-Launch
- [ ] Sitemap generated and submitted
- [ ] Robots.txt configured
- [ ] Canonical URLs on all pages
- [ ] All images have alt text
- [ ] Page titles unique and optimized
- [ ] Meta descriptions on all pages
- [ ] Structured data implemented
- [ ] Open Graph tags configured
- [ ] Mobile-responsive verified
- [ ] Page speed optimized
- [ ] HTTPS enabled
- [ ] Analytics setup

### Ongoing
- [ ] Weekly: Check for 404 errors
- [ ] Weekly: Monitor search rankings
- [ ] Monthly: Review analytics
- [ ] Monthly: Update content
- [ ] Quarterly: Technical SEO audit
- [ ] Quarterly: Competitor analysis

## Content Guidelines

### Writing for SEO
1. **Keyword Research**: Identify target keywords
2. **Natural Integration**: Use keywords naturally
3. **Semantic Variations**: Related terms and synonyms
4. **User Intent**: Match content to search intent
5. **Readability**: Short paragraphs, bullet points
6. **Value**: Provide genuine value to readers

### Keyword Targeting

**Primary Keywords**:
- Gadgets Uganda
- Electronics Kampala
- Buy [product] Uganda
- [Product] price Uganda

**Secondary Keywords**:
- Tech accessories Uganda
- Online electronics store Uganda
- Fast delivery electronics
- Premium gadgets

**Long-tail Keywords**:
- "Where to buy wireless earbuds in Kampala"
- "Best smartphone deals Uganda"
- "Affordable smartwatch Uganda"

## Tools & Resources

### SEO Tools
- Google Search Console
- Google Analytics
- Semrush / Ahrefs
- Screaming Frog
- GTmetrix / PageSpeed Insights

### Schema Validators
- Google Rich Results Test
- Schema.org Validator
- JSON-LD Playground

### Testing Tools
- Mobile-Friendly Test
- PageSpeed Insights
- WebPageTest
- Lighthouse

---

**Last Updated**: March 9, 2026
**Version**: 1.0
**Maintained By**: Marketing & Development Team
