# OJ's Online Store — design system

Tokens live in `src/app.css` (`@theme`). Use the token classes below rather than raw hex values, Tailwind palette greys or arbitrary `[...]` values.

## Colour

| Role | Token | Use |
| --- | --- | --- |
| Primary action | `brand` `#007c9e` | Buttons, links, focus rings (AA contrast with white) |
| Logo teal | `brand-bright` `#008cb2` | The logo mark and large accents on dark backgrounds |
| Brand hover / tints | `brand-dark`, `brand-soft`, `brand-tint` | Hover state, soft backgrounds, hover on soft |
| Ink | `ink`, `ink-soft` | Primary text, dark chrome; `ink-soft` for long-form copy |
| Secondary text | `ink-muted` | Descriptions, meta, helper copy (7:1) |
| Tertiary text | `ink-subtle` | Captions, struck-through prices, SKUs, placeholders (4.6:1) |
| Decorative | `ink-faint` | Empty stars, disabled icons — never text |
| Surfaces | `surface`, `line`, `line-strong` | Wells and panels, hairlines, hovered control borders |
| Savings | `deal`, `deal-soft`, `deal-ink` | Discounts, errors |
| Accent | `sun` | Highlights, stars, "New" tags, CTAs on dark |
| Status | `ok*`, `warn*` | Success / stock and warnings |
| WhatsApp | `whatsapp` `#25d366`, `whatsapp-dark` `#0f7a3f` | Ordering happens on WhatsApp: checkout, cart and buy buttons use `cta-whatsapp` (white on `whatsapp-dark`, 5.4:1). The bright `whatsapp` green is for icon-only buttons; white text on it is only 2:1 |

On dark backgrounds: white for primary text, `white/70` secondary, `white/50` labels, `white/10` dividers.

## Shape

| Radius | Value | Use |
| --- | --- | --- |
| `rounded-full` | pill | Buttons, chips, tags, steppers, icon buttons |
| `rounded-lg` | 10px | Icon tiles, thumbnails ≤ 48px |
| `rounded-xl` | 14px | Fields, notices, small cards, thumbnails 64–96px |
| `rounded-2xl` | 20px | Cards, panels, image wells, tiles |
| `rounded-3xl` | 28px | Feature blocks: hero/spotlight cards, empty states, cards wrapping a `2xl` well |

Borders: `border-control` (1.5px) for interactive controls, 1px `border-line` for static surfaces, 2px `brand` for the selected state.

Elevation: none for cards; `shadow-sm` for raised icon tiles; `shadow-md` for floating round buttons; `shadow-float` for drawers, dropdowns, menus and showcase cards.

## Type (Figtree)

| Class | Use |
| --- | --- |
| `h-display` | Hero headlines |
| `h-section` + `eyebrow` | Homepage bands and section headers (eyebrow → heading `mt-2`, header → content `mb-8`) |
| `h-page` | Page titles |
| `h-block` | Sections within a page (Overview, Reviews) — content starts `mt-5` |
| `h-card` | Panel and drawer titles, empty-state titles |
| `label-caps` | Small uppercase labels |
| `text-2xs` | Tags and counters only |

Weights: 400 body, 600 product names and emphasis, 700 labels and buttons, `extrabold` (760) headings and prices.

## Controls

Heights: 32 (`chip-sm`), 36 (`chip`), 40 (`cta-sm`, `icon-btn`, selects, steppers, pagination), 48 (`cta`, `field`, search), 56 (`cta-lg`, product buy box). Inputs and selects use 16px text on mobile so iOS doesn't zoom.

## Layout

- `wrap` for page width and gutters.
- `section-y` for homepage band spacing; `block-sep` for ruled blocks within a page.
- `product-grid` for every product grid (set column counts with `sm:`/`md:` utilities).
- Panels pad `p-5 sm:p-6`; `icon-tile` for 40px icon squares.
