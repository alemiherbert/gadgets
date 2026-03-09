#!/usr/bin/env python3
"""
Scrape abanista.com via the public WooCommerce Store API.

Uses the lightweight /wp-json/wc/store/v1/ endpoints (no auth required)
to pull products, categories, brands, and images into a structure that
maps directly to the gadgets DB schema.

Output (data/abanista/):
  brands.json         — [{name, slug}]
  categories.json     — [{name, slug, parent_id, wc_id, children: [...]}] (full tree)
  subcategories.json  — [{name, slug, category_slug, category_name}] (flattened for DB)
  products.json       — [{name, slug, sku, description, short_description,
                          price, compare_at_price, stock_status, on_sale,
                          brand, categories, tags, attributes, images, specs}]
  images/
    products/         — product gallery images (main + additional)

Politeness:
  • 3 s between paginated product requests (heaviest)
  • 6 concurrent image downloads with 0.3 s per-thread delay
  • Streams images to disk (no big buffers)
  • Resumes if interrupted (skips existing files)

Usage:
  python -m venv data/.venv
  source data/.venv/bin/activate
  pip install requests
  python data/scrape_abanista.py
"""

import json
import os
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urlparse

import requests

# ── Config ────────────────────────────────────────────────
BASE       = "https://www.abanista.com"
API        = f"{BASE}/wp-json/wc/store/v1"
OUT_DIR    = os.path.join(os.path.dirname(os.path.abspath(__file__)), "abanista")
IMG_DIR    = os.path.join(OUT_DIR, "images", "products")
PER_PAGE   = 100         # 3am — server is idle, go fast
DELAY_PAGE = 0.5         # seconds between product pages
DELAY_IMG  = 0.1         # seconds between image downloads (per thread)
IMG_WORKERS = 12         # concurrent image download threads
TIMEOUT    = 30

SESSION = requests.Session()
SESSION.headers.update({
    "User-Agent": "AbanistaMigrationBot/2.0 (site-owner; polite)",
    "Accept": "application/json",
})


def ensure_dirs():
    os.makedirs(IMG_DIR, exist_ok=True)


def safe_filename(url: str) -> str:
    """Derive a filesystem-safe name from an image URL."""
    name = os.path.basename(urlparse(url).path)
    if not name:
        name = "image"
    name = re.sub(r'[^\w.\-]', '_', name)
    return name[:200]


# ── API helpers ───────────────────────────────────────────
def api_get(path: str, params: dict | None = None) -> requests.Response | None:
    url = f"{API}/{path.lstrip('/')}"
    try:
        resp = SESSION.get(url, params=params, timeout=TIMEOUT)
        resp.raise_for_status()
        return resp
    except requests.RequestException as e:
        print(f"  [ERR] {url}: {e}", file=sys.stderr)
        return None


def api_get_json(path: str, params: dict | None = None):
    resp = api_get(path, params)
    return resp.json() if resp else None


def paginate(path: str, per_page: int = PER_PAGE, delay: float = DELAY_PAGE):
    """Yield all items from a paginated Store API endpoint."""
    page = 1
    while True:
        if page > 1:
            time.sleep(delay)
        resp = api_get(path, {"per_page": per_page, "page": page})
        if resp is None:
            break
        items = resp.json()
        if not items:
            break
        yield from items
        total_pages = int(resp.headers.get("X-WP-TotalPages", 1))
        if page >= total_pages:
            break
        page += 1


# ── Image downloader ─────────────────────────────────────
def download_image(url: str, subdir: str = "") -> str | None:
    """Download image to IMG_DIR/subdir/, return local relative path or None."""
    target_dir = os.path.join(IMG_DIR, subdir) if subdir else IMG_DIR
    os.makedirs(target_dir, exist_ok=True)
    filename = safe_filename(url)
    filepath = os.path.join(target_dir, filename)
    rel_path = os.path.join("images", "products", subdir, filename) if subdir else os.path.join("images", "products", filename)

    if os.path.exists(filepath):
        return rel_path  # already downloaded

    time.sleep(DELAY_IMG)
    try:
        resp = SESSION.get(url, timeout=TIMEOUT, stream=True)
        resp.raise_for_status()
        ct = resp.headers.get("content-type", "")
        if "image" not in ct and "octet-stream" not in ct:
            return None
        with open(filepath, "wb") as f:
            for chunk in resp.iter_content(8192):
                f.write(chunk)
        return rel_path
    except requests.RequestException as e:
        print(f"  [IMG] Failed {url}: {e}", file=sys.stderr)
        return None


# ── Extractors ────────────────────────────────────────────
def strip_html(html: str) -> str:
    """Rough HTML-to-text (good enough for descriptions)."""
    text = re.sub(r'<br\s*/?\s*>', '\n', html)
    text = re.sub(r'<[^>]+>', '', text)
    text = re.sub(r'&amp;', '&', text)
    text = re.sub(r'&lt;', '<', text)
    text = re.sub(r'&gt;', '>', text)
    text = re.sub(r'&#8217;', "'", text)
    text = re.sub(r'&#8211;', '–', text)
    text = re.sub(r'&#8220;|&#8221;', '"', text)
    text = re.sub(r'&nbsp;', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


def extract_specs_from_description(desc_html: str) -> dict:
    """Try to pull key:value specs from description bullet lists."""
    specs = {}
    # Match lines like "Brand: Anker" or "• Battery Capacity: 20,000mAh"
    for m in re.finditer(r'(?:^|<li[^>]*>)\s*(?:[•\-]\s*)?([^:<\n]{2,40}):\s*([^<\n]+)', desc_html):
        key = m.group(1).strip()
        val = m.group(2).strip()
        if key and val and len(key) < 40:
            specs[key] = val
    return specs


def parse_product(raw: dict) -> dict:
    """Transform a WC Store API product into our schema shape."""
    prices = raw.get("prices", {})
    price = int(prices.get("sale_price") or prices.get("price") or 0)
    regular = int(prices.get("regular_price") or 0)
    compare_at = regular if regular > price else None

    # Brand
    brands_list = raw.get("brands", [])
    brand = brands_list[0] if brands_list else None

    # Categories (WC allows multiple)
    categories = [
        {"id": c["id"], "name": c["name"], "slug": c["slug"]}
        for c in raw.get("categories", [])
    ]

    # Tags
    tags = [
        {"id": t["id"], "name": t["name"], "slug": t["slug"]}
        for t in raw.get("tags", [])
    ]

    # Attributes → specs
    specs = {}
    for attr in raw.get("attributes", []):
        if not attr.get("has_variations"):
            terms = [t["name"] for t in attr.get("terms", [])]
            if terms:
                specs[attr["name"]] = ", ".join(terms)

    # Also try to pull specs from description HTML
    desc_html = raw.get("description", "")
    desc_specs = extract_specs_from_description(desc_html)
    # Merge — attribute specs take priority
    for k, v in desc_specs.items():
        specs.setdefault(k, v)

    # Images
    images_raw = raw.get("images", [])

    # Stock
    stock_status = "in_stock" if raw.get("is_in_stock") else "out_of_stock"

    return {
        "wc_id": raw["id"],
        "name": raw.get("name", ""),
        "slug": raw.get("slug", ""),
        "sku": raw.get("sku", ""),
        "type": raw.get("type", "simple"),
        "short_description": strip_html(raw.get("short_description", "")),
        "description": strip_html(desc_html),
        "price": price,
        "compare_at_price": compare_at,
        "on_sale": raw.get("on_sale", False),
        "stock_status": stock_status,
        "brand": {"name": brand["name"], "slug": brand["slug"]} if brand else None,
        "categories": categories,
        "tags": tags,
        "specs": specs,
        "images_raw": [
            {"src": img["src"], "alt": img.get("alt", ""), "name": img.get("name", "")}
            for img in images_raw
        ],
        "images": [],      # filled after download
        "permalink": raw.get("permalink", ""),
    }


# ── Main ──────────────────────────────────────────────────
def fetch_categories() -> tuple[list[dict], list[dict], list[dict]]:
    """Fetch and organise categories.

    Returns:
        (cat_tree, all_cats_flat, subcategories_flat)

    cat_tree:           top-level categories with nested children (full depth)
    all_cats_flat:      every category as a flat list
    subcategories_flat: all non-top-level categories flattened with their
                        root ancestor as 'category_slug' — ready for the DB's
                        subcategories table (which has only 2 levels).
    """
    print("Fetching categories...")
    raw = list(paginate("products/categories", per_page=100, delay=1.5))
    print(f"  {len(raw)} categories fetched")

    by_id: dict[int, dict] = {}
    for c in raw:
        by_id[c["id"]] = {
            "wc_id": c["id"],
            "name": c["name"],
            "slug": c["slug"],
            "parent_id": c.get("parent", 0),
            "count": c.get("count", 0),
            "description": strip_html(c.get("description", "")),
            "image": c.get("image", {}).get("src") if c.get("image") else None,
        }

    # Find root ancestor for any category
    def root_ancestor(cat_id: int) -> int:
        visited = set()
        cid = cat_id
        while cid in by_id and by_id[cid]["parent_id"] != 0:
            if cid in visited:
                break
            visited.add(cid)
            cid = by_id[cid]["parent_id"]
        return cid

    # Build recursive tree
    def build_children(parent_id: int) -> list[dict]:
        children = []
        for cat in by_id.values():
            if cat["parent_id"] == parent_id:
                node = {**cat, "children": build_children(cat["wc_id"])}
                children.append(node)
        return sorted(children, key=lambda x: x["name"])

    top = []
    for cat in by_id.values():
        if cat["parent_id"] == 0:
            node = {**cat, "children": build_children(cat["wc_id"])}
            top.append(node)
    top.sort(key=lambda x: x["name"])

    # Flat subcategories: every non-top-level category mapped to its root ancestor
    top_ids = {cat["wc_id"] for cat in by_id.values() if cat["parent_id"] == 0}
    subcats_flat = []
    for cat in by_id.values():
        if cat["wc_id"] not in top_ids:
            root_id = root_ancestor(cat["wc_id"])
            root_cat = by_id.get(root_id)
            subcats_flat.append({
                "wc_id": cat["wc_id"],
                "name": cat["name"],
                "slug": cat["slug"],
                "category_slug": root_cat["slug"] if root_cat else None,
                "category_name": root_cat["name"] if root_cat else None,
                "parent_wc_id": cat["parent_id"],
                "count": cat["count"],
            })
    subcats_flat.sort(key=lambda x: (x["category_name"] or "", x["name"]))

    return top, list(by_id.values()), subcats_flat


def fetch_brands(products: list[dict]) -> list[dict]:
    """Extract unique brands from scraped products."""
    seen = {}
    for p in products:
        b = p.get("brand")
        if b and b["slug"] not in seen:
            seen[b["slug"]] = {"name": b["name"], "slug": b["slug"]}
    brands = sorted(seen.values(), key=lambda x: x["name"])
    return brands


def download_product_images(products: list[dict]):
    """Download all product images concurrently, updating products in-place."""
    # Build list of (product_index, image_index, url, subdir)
    tasks = []
    for pi, p in enumerate(products):
        product_slug = p["slug"][:80] or str(p["wc_id"])
        for ii, img in enumerate(p["images_raw"]):
            if img["src"]:
                tasks.append((pi, ii, img["src"], product_slug, img.get("alt", "")))

    total = len(tasks)
    done = 0
    # Pre-init images lists
    for p in products:
        p["images"] = [None] * len(p["images_raw"])

    def _download_one(task):
        pi, ii, url, subdir, alt = task
        local = download_image(url, subdir=subdir)
        return pi, ii, url, local, alt

    with ThreadPoolExecutor(max_workers=IMG_WORKERS) as executor:
        futures = {executor.submit(_download_one, t): t for t in tasks}
        for future in as_completed(futures):
            done += 1
            pi, ii, url, local, alt = future.result()
            products[pi]["images"][ii] = {
                "original_url": url,
                "local_path": local,
                "alt": alt,
            }
            if done % 50 == 0 or done == total:
                print(f"  [{done}/{total}] images downloaded")

    # Clean up None entries (from images with no src)
    for p in products:
        p["images"] = [img for img in p["images"] if img is not None]


def save_json(data, filename: str):
    path = os.path.join(OUT_DIR, filename)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"  Saved {path} ({len(data)} items)")


def main():
    ensure_dirs()
    print(f"Output: {OUT_DIR}\n")

    # 1. Categories
    cats_path = os.path.join(OUT_DIR, "categories.json")
    subcats_path = os.path.join(OUT_DIR, "subcategories.json")
    if os.path.exists(cats_path) and os.path.exists(subcats_path):
        cat_tree = json.load(open(cats_path))
        subcats_flat = json.load(open(subcats_path))
        print(f"  Categories cached: {len(cat_tree)} top-level, {len(subcats_flat)} subcategories")
    else:
        cat_tree, all_cats, subcats_flat = fetch_categories()
        save_json(cat_tree, "categories.json")
        save_json(subcats_flat, "subcategories.json")
        print(f"  {len(cat_tree)} top-level categories, {len(subcats_flat)} subcategories")

    # 2. Products — resume if already fully fetched
    products_path = os.path.join(OUT_DIR, "products.json")
    products_raw = []
    if os.path.exists(products_path):
        cached = json.load(open(products_path))
        # If products have images_raw, they're ready for image download
        if cached and "images_raw" in cached[0]:
            products_raw = cached
            print(f"\n  Products cached: {len(products_raw)} (resuming images)")

    if not products_raw:
        print(f"\nFetching products (per_page={PER_PAGE}, delay={DELAY_PAGE}s)...")
        page = 0
        for item in paginate("products", per_page=PER_PAGE, delay=DELAY_PAGE):
            products_raw.append(parse_product(item))
            if len(products_raw) % PER_PAGE == 0:
                page += 1
                print(f"  Page {page} done — {len(products_raw)} products so far")
                save_json(products_raw, "products.json")

        print(f"  Total: {len(products_raw)} products")
        save_json(products_raw, "products.json")

    # 3. Brands (extracted from products)
    brands = fetch_brands(products_raw)
    save_json(brands, "brands.json")
    print(f"\n{len(brands)} unique brands extracted")

    # 4. Download images
    print(f"\nDownloading product images...")
    download_product_images(products_raw)
    # Re-save with local image paths
    # Strip images_raw before final save to keep file clean
    for p in products_raw:
        del p["images_raw"]
    save_json(products_raw, "products.json")

    print(f"\nDone! {len(products_raw)} products, {len(brands)} brands, {len(cat_tree)} top-level categories")


if __name__ == "__main__":
    main()
