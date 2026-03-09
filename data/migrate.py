#!/usr/bin/env python3
"""
Migrate tech products → Supabase + R2.

Steps:
  1. Build image refs from product JSON (no image_map needed)
  2. Upload images to R2 (as-is, no conversion)
  3. Clear old seed data from DB
  4. Insert brands, categories, subcategories, products, product_images, product_categories

Usage:
  cd data && source ../.venv/bin/activate
  python migrate.py                                          # Full migration
  python migrate.py --images-only                            # Upload images only
  python migrate.py --db-only                                # DB only (skip upload)
  python migrate.py --products-file abanista/tech_products.json
"""

import argparse
import glob
import json
import os
import re
import secrets
import string
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

import boto3
import requests
from botocore.config import Config as BotoConfig

# ── Paths ─────────────────────────────────────────────────
SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
ABANISTA_DIR = os.path.join(SCRIPT_DIR, "abanista")

# ── Supabase ──────────────────────────────────────────────
SUPABASE_URL = "https://xplhaaslnrpaqqrpxkbm.supabase.co"
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

# ── R2 ────────────────────────────────────────────────────
R2_BUCKET     = "gadgets-images"
CF_ACCOUNT_ID = "d19907edfc7aa7af1dbb6547cb6adbfe"
R2_ENDPOINT   = f"https://{CF_ACCOUNT_ID}.r2.cloudflarestorage.com"
R2_ACCESS_KEY = os.environ.get("R2_ACCESS_KEY", "efd6192538018c9fd073a54e099ca632")
R2_SECRET_KEY = os.environ.get("R2_SECRET_KEY", "ebf900412af14f148739b7fd378dbd214125ca455163537017b682e1b023709a")

# ── Config ────────────────────────────────────────────────
MAX_IMAGES_PER_PRODUCT = 6
R2_UPLOAD_WORKERS      = 20
DB_BATCH_SIZE          = 200

# ── nanoid ────────────────────────────────────────────────
_NANOID_ALPHABET = string.ascii_lowercase + string.digits
def nanoid(size=8):
    return ''.join(secrets.choice(_NANOID_ALPHABET) for _ in range(size))

def short_slug(name, max_len=50):
    """Turn a product name into a short, readable slug for R2 keys."""
    s = name.lower()
    s = re.sub(r'[^a-z0-9\s-]', '', s)    # strip punctuation
    s = re.sub(r'\s+', '-', s.strip())     # spaces → hyphens
    s = re.sub(r'-+', '-', s)              # collapse hyphens
    # truncate at word boundary
    if len(s) > max_len:
        s = s[:max_len].rsplit('-', 1)[0]
    return s or 'product'


# ═══════════════════════════════════════════════════════════
#  CATEGORIES  (tailored to tech_products.json)
# ═══════════════════════════════════════════════════════════

NEW_CATEGORIES = [
    {
        "name": "Phones & Wearables",
        "slug": "phones-wearables",
        "description": "Smartphones, Smart Watches & Phone Accessories",
        "icon": "/img/categories/phones.avif",
        "sort_order": 1,
    },
    {
        "name": "TVs & Displays",
        "slug": "tvs-displays",
        "description": "Smart TVs, Digital TVs, Projectors & Commercial Displays",
        "icon": "/img/categories/smart-home.avif",
        "sort_order": 2,
    },
    {
        "name": "Audio",
        "slug": "audio",
        "description": "Soundbars, Speakers, Headphones, Earbuds, Home Theatre & Microphones",
        "icon": "/img/categories/audio.avif",
        "sort_order": 3,
    },
    {
        "name": "Computing & Gaming",
        "slug": "computing-gaming",
        "description": "Laptops, Monitors, Printers, Scanners, Gaming Consoles & Accessories",
        "icon": "/img/categories/computing.avif",
        "sort_order": 4,
    },
    {
        "name": "Cameras",
        "slug": "cameras",
        "description": "Digital Cameras, Lenses & Camera Accessories",
        "icon": "/img/categories/smart-home.avif",
        "sort_order": 5,
    },
    {
        "name": "Accessories & Power",
        "slug": "accessories-power",
        "description": "Power Banks, Chargers, Cables, Car Electronics, Health Products & More",
        "icon": "/img/categories/power.avif",
        "sort_order": 6,
    },
]

# ── WC → new category slug ────────────────────────────────
WC_TO_NEW_CATEGORY = {
    # Phones & Wearables
    "phones": "phones-wearables",
    "phone-accessories": "phones-wearables",
    "watches": "phones-wearables",

    # TVs & Displays
    "smart-tvs": "tvs-displays",
    "digital-tvs": "tvs-displays",
    "commercial-displays": "tvs-displays",
    "projectors": "tvs-displays",
    "tv-accessories": "tvs-displays",

    # Audio
    "soundbars": "audio",
    "speakers": "audio",
    "portable-speakers": "audio",
    "party-speakers": "audio",
    "home-theatres": "audio",
    "one-box-systems": "audio",
    "dvd-audio-systems": "audio",
    "dvd": "audio",
    "earbud-headphones": "audio",
    "earbuds": "audio",
    "in-ear": "audio",
    "on-ear": "audio",
    "over-ear": "audio",
    "microphones": "audio",
    "voice-recorders": "audio",

    # Computing & Gaming
    "laptops": "computing-gaming",
    "computers": "computing-gaming",
    "computer-accessories": "computing-gaming",
    "monitors": "computing-gaming",
    "hard-drives": "computing-gaming",
    "printers": "computing-gaming",
    "inkjet-printers": "computing-gaming",
    "laserjet-printers": "computing-gaming",
    "photo-printers": "computing-gaming",
    "scanners": "computing-gaming",
    "consoles": "computing-gaming",

    # Cameras
    "cameras": "cameras",
    "camera-optics": "cameras",

    # Accessories & Power
    "power-banks": "accessories-power",
    "inverters-chargers": "accessories-power",
    "batteries": "accessories-power",
    "power-generators": "accessories-power",
    "petrol-generators": "accessories-power",
    "inverter-generators": "accessories-power",
    "solar-kits-bundles": "accessories-power",
    "solar-lighting": "accessories-power",
    "lighting-accessories": "accessories-power",
    "cables-switches": "accessories-power",
    "car-vehicle-electronics": "accessories-power",
    "health-care-products": "accessories-power",
    "smart-adaptors": "accessories-power",
    "electronics": "accessories-power",
    "electricals": "accessories-power",
}

# ── Subcategories ─────────────────────────────────────────
NEW_SUBCATEGORIES = {
    "phones-wearables": [
        {"name": "Smartphones", "slug": "smartphones",
         "wc_slugs": ["phones", "phone-accessories"]},
        {"name": "Smart Watches", "slug": "smart-watches",
         "wc_slugs": ["watches"]},
    ],
    "tvs-displays": [
        {"name": "Smart TVs", "slug": "smart-tvs",
         "wc_slugs": ["smart-tvs"]},
        {"name": "Digital TVs", "slug": "digital-tvs",
         "wc_slugs": ["digital-tvs"]},
        {"name": "Projectors", "slug": "projectors",
         "wc_slugs": ["projectors"]},
        {"name": "Commercial Displays", "slug": "commercial-displays",
         "wc_slugs": ["commercial-displays"]},
        {"name": "TV Accessories", "slug": "tv-accessories",
         "wc_slugs": ["tv-accessories"]},
    ],
    "audio": [
        {"name": "Soundbars", "slug": "soundbars",
         "wc_slugs": ["soundbars"]},
        {"name": "Portable Speakers", "slug": "portable-speakers",
         "wc_slugs": ["portable-speakers"]},
        {"name": "Party Speakers", "slug": "party-speakers",
         "wc_slugs": ["party-speakers", "speakers"]},
        {"name": "Home Theatre", "slug": "home-theatre",
         "wc_slugs": ["home-theatres", "one-box-systems", "dvd-audio-systems", "dvd"]},
        {"name": "Headphones", "slug": "headphones",
         "wc_slugs": ["on-ear", "over-ear"]},
        {"name": "Earbuds", "slug": "earbuds",
         "wc_slugs": ["earbud-headphones", "earbuds", "in-ear"]},
        {"name": "Microphones", "slug": "microphones",
         "wc_slugs": ["microphones", "voice-recorders"]},
    ],
    "computing-gaming": [
        {"name": "Laptops & Computers", "slug": "laptops-computers",
         "wc_slugs": ["laptops", "computers", "computer-accessories", "hard-drives"]},
        {"name": "Monitors", "slug": "monitors",
         "wc_slugs": ["monitors"]},
        {"name": "Printers & Scanners", "slug": "printers-scanners",
         "wc_slugs": ["printers", "inkjet-printers", "laserjet-printers",
                      "photo-printers", "scanners"]},
        {"name": "Gaming", "slug": "gaming",
         "wc_slugs": ["consoles"]},
    ],
    "cameras": [
        {"name": "Digital Cameras", "slug": "digital-cameras",
         "wc_slugs": ["cameras"]},
        {"name": "Lenses & Accessories", "slug": "lenses-accessories",
         "wc_slugs": ["camera-optics"]},
    ],
    "accessories-power": [
        {"name": "Power Banks", "slug": "power-banks",
         "wc_slugs": ["power-banks"]},
        {"name": "Chargers & Inverters", "slug": "chargers-inverters",
         "wc_slugs": ["inverters-chargers", "batteries"]},
        {"name": "Generators", "slug": "generators",
         "wc_slugs": ["power-generators", "petrol-generators", "inverter-generators"]},
        {"name": "Solar & Lighting", "slug": "solar-lighting",
         "wc_slugs": ["solar-kits-bundles", "solar-lighting", "lighting-accessories"]},
        {"name": "Cables & Adapters", "slug": "cables-adapters",
         "wc_slugs": ["cables-switches", "smart-adaptors", "electronics", "electricals"]},
        {"name": "Car Accessories", "slug": "car-accessories",
         "wc_slugs": ["car-vehicle-electronics"]},
        {"name": "Health & Wellness", "slug": "health-wellness",
         "wc_slugs": ["health-care-products"]},
    ],
}


def _build_wc_to_subcat():
    mapping = {}
    for subcats in NEW_SUBCATEGORIES.values():
        for sub in subcats:
            for wc_slug in sub["wc_slugs"]:
                mapping[wc_slug] = sub["slug"]
    return mapping

WC_TO_SUBCATEGORY = _build_wc_to_subcat()


# ═══════════════════════════════════════════════════════════
#  IMAGE MAPPING (from product JSON, no conversion)
# ═══════════════════════════════════════════════════════════

def _guess_content_type(path):
    ext = os.path.splitext(path)[1].lower()
    return {
        ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
        ".png": "image/png", ".webp": "image/webp",
        ".gif": "image/gif", ".avif": "image/avif",
    }.get(ext, "application/octet-stream")


def _resolve_path(abs_path):
    """Resolve an image path, trying glob if exact match fails (truncated dirs)."""
    if os.path.exists(abs_path):
        return abs_path
    parent = os.path.dirname(abs_path)
    fname = os.path.basename(abs_path)
    matches = glob.glob(parent + '*')
    for m in matches:
        if os.path.isdir(m):
            candidate = os.path.join(m, fname)
            if os.path.exists(candidate):
                return candidate
    return None


def build_image_map(products):
    """
    Build image map directly from product images on disk.
    R2 keys use shortened product names: products/<short-slug>/1.jpg
    Max MAX_IMAGES_PER_PRODUCT per product.
    """
    image_map = {}
    total_found = 0
    total_missing = 0
    used_slugs = set()

    for p in products:
        wc_id = p.get("wc_id")
        if wc_id is None:
            continue

        # Build a unique short slug for this product's R2 folder
        base = short_slug(p.get("name", ""))
        folder = base
        counter = 2
        while folder in used_slugs:
            folder = f"{base}-{counter}"
            counter += 1
        used_slugs.add(folder)

        images = p.get("images", [])[:MAX_IMAGES_PER_PRODUCT]
        mapped = []
        for i, img in enumerate(images):
            local_path = img.get("local_path", "")
            if not local_path:
                total_missing += 1
                continue

            abs_path = os.path.join(ABANISTA_DIR, local_path)
            resolved = _resolve_path(abs_path)
            if not resolved:
                total_missing += 1
                continue

            ext = os.path.splitext(resolved)[1].lower() or ".jpg"
            r2_key = f"products/{folder}/{i + 1}{ext}"

            mapped.append({
                "r2_key": r2_key,
                "local_path": resolved,
                "content_type": _guess_content_type(resolved),
                "sort": i,
            })
            total_found += 1

        image_map[int(wc_id)] = mapped

    print(f"  Images mapped: {total_found} found, {total_missing} missing")
    return image_map


# ═══════════════════════════════════════════════════════════
#  R2 UPLOAD
# ═══════════════════════════════════════════════════════════

def _get_s3_client():
    return boto3.client(
        "s3",
        endpoint_url=R2_ENDPOINT,
        aws_access_key_id=R2_ACCESS_KEY,
        aws_secret_access_key=R2_SECRET_KEY,
        region_name="auto",
        config=BotoConfig(retries={"max_attempts": 3, "mode": "adaptive"}),
    )


def _upload_one(args):
    r2_key, local_path, content_type, client = args
    client.upload_file(
        local_path, R2_BUCKET, r2_key,
        ExtraArgs={"ContentType": content_type},
    )
    return r2_key


def upload_to_r2(image_map):
    """Upload images to R2 (parallel). Skips already-uploaded keys."""
    all_files = []
    for images in image_map.values():
        for img in images:
            if os.path.exists(img["local_path"]):
                all_files.append((img["r2_key"], img["local_path"], img["content_type"]))

    if not all_files:
        print("  [WARN] No image files to upload")
        return 0

    # Check what already exists
    print(f"  Checking existing objects in R2...")
    client = _get_s3_client()
    existing = set()
    try:
        paginator = client.get_paginator("list_objects_v2")
        for page in paginator.paginate(Bucket=R2_BUCKET, Prefix="products/"):
            for obj in page.get("Contents", []):
                existing.add(obj["Key"])
        print(f"  {len(existing)} already in R2")
    except Exception as e:
        print(f"  [WARN] Could not list R2 objects: {e}")

    pending = [(k, p, ct) for k, p, ct in all_files if k not in existing]
    if not pending:
        print("  All images already uploaded!")
        return len(all_files)

    print(f"  Uploading {len(pending)} images ({R2_UPLOAD_WORKERS} workers)...")
    uploaded = 0
    failed = 0
    start = time.time()

    with ThreadPoolExecutor(max_workers=R2_UPLOAD_WORKERS) as pool:
        futures = {
            pool.submit(_upload_one, (r2_key, path, ct, _get_s3_client())): r2_key
            for r2_key, path, ct in pending
        }
        for future in as_completed(futures):
            r2_key = futures[future]
            try:
                future.result()
                uploaded += 1
            except Exception as e:
                print(f"  [R2 ERR] {r2_key}: {e}", file=sys.stderr)
                failed += 1
            done = uploaded + failed
            if done % 100 == 0 or done == len(pending):
                elapsed = time.time() - start
                rate = done / elapsed if elapsed > 0 else 0
                eta = (len(pending) - done) / rate if rate > 0 else 0
                print(f"  [{done}/{len(pending)}] {rate:.0f} img/s, ETA {eta:.0f}s")

    elapsed = time.time() - start
    print(f"  R2 upload: {uploaded} ok, {failed} failed ({elapsed:.0f}s)")
    return uploaded + len(existing)


# ═══════════════════════════════════════════════════════════
#  DATABASE OPERATIONS
# ═══════════════════════════════════════════════════════════

def supabase_request(method, table, data=None, params=None):
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }
    if params:
        url += "?" + "&".join(f"{k}={v}" for k, v in params.items())

    resp = requests.request(method, url, headers=headers, json=data, timeout=30)
    if resp.status_code >= 400:
        raise Exception(f"Supabase {method} {table}: {resp.status_code} {resp.text[:200]}")
    try:
        return resp.json()
    except Exception:
        return None


def clear_old_data():
    print("  Clearing old data...")
    composite_key_tables = {"product_categories": "product_id", "product_views": "id"}
    for table in ["product_images", "product_categories", "product_views",
                  "search_history", "order_items", "orders",
                  "featured_slides", "products", "subcategories",
                  "categories", "brands"]:
        try:
            col = composite_key_tables.get(table, "id")
            supabase_request("DELETE", table, params={col: "gt.0"})
            print(f"    Cleared {table}")
        except Exception as e:
            print(f"    [WARN] {table}: {e}")


def insert_brands(products):
    seen = {}
    for p in products:
        b = p.get("brand")
        if b and b.get("slug") and b["slug"] not in seen:
            seen[b["slug"]] = b["name"]

    brands = [{"name": name, "slug": slug, "sort_order": i + 1}
              for i, (slug, name) in enumerate(sorted(seen.items(), key=lambda x: x[1]))]

    print(f"  Inserting {len(brands)} brands...")
    result = supabase_request("POST", "brands", data=brands)
    return {r["slug"]: r["id"] for r in result}


def insert_categories():
    cats = [{k: v for k, v in c.items()} for c in NEW_CATEGORIES]
    print(f"  Inserting {len(cats)} categories...")
    result = supabase_request("POST", "categories", data=cats)
    return {r["slug"]: r["id"] for r in result}


def insert_subcategories(category_ids):
    rows = []
    sort = 0
    for cat_slug, subcats in NEW_SUBCATEGORIES.items():
        cat_id = category_ids[cat_slug]
        for sub in subcats:
            sort += 1
            rows.append({
                "name": sub["name"],
                "slug": sub["slug"],
                "category_id": cat_id,
                "sort_order": sort,
            })

    print(f"  Inserting {len(rows)} subcategories...")
    result = supabase_request("POST", "subcategories", data=rows)
    return {r["slug"]: r["id"] for r in result}


def determine_product_mapping(product, category_ids, subcat_ids, brand_ids):
    wc_cat_slugs = [c["slug"] for c in product.get("categories", [])]

    new_cat_slug = None
    new_subcat_slug = None
    for wc_slug in wc_cat_slugs:
        if wc_slug in WC_TO_NEW_CATEGORY:
            new_cat_slug = WC_TO_NEW_CATEGORY[wc_slug]
            break

    for wc_slug in wc_cat_slugs:
        if wc_slug in WC_TO_SUBCATEGORY:
            new_subcat_slug = WC_TO_SUBCATEGORY[wc_slug]
            break

    # Fallback
    if not new_cat_slug:
        new_cat_slug = "accessories-power"

    cat_id = category_ids.get(new_cat_slug)
    subcat_id = subcat_ids.get(new_subcat_slug) if new_subcat_slug else None

    brand = product.get("brand")
    brand_id = brand_ids.get(brand["slug"]) if brand else None

    return cat_id, subcat_id, brand_id


def insert_products(products, image_map, category_ids, subcat_ids, brand_ids):
    print(f"  Inserting {len(products)} products...")

    used_skus = set()
    def gen_sku():
        while True:
            sku = "G" + ''.join(secrets.choice(string.digits) for _ in range(5))
            if sku not in used_skus:
                used_skus.add(sku)
                return sku

    used_slugs = set()
    def unique_slug(base_slug, wc_id):
        slug = base_slug[:120] or f"product-{wc_id}"
        if slug not in used_slugs:
            used_slugs.add(slug)
            return slug
        counter = 2
        while f"{slug}-{counter}" in used_slugs:
            counter += 1
        final = f"{slug}-{counter}"
        used_slugs.add(final)
        return final

    total_images = 0
    total_cat_links = 0
    start_time = time.time()

    for start in range(0, len(products), DB_BATCH_SIZE):
        batch = products[start:start + DB_BATCH_SIZE]
        product_rows = []

        for p in batch:
            cat_id, subcat_id, brand_id = determine_product_mapping(
                p, category_ids, subcat_ids, brand_ids)

            wc_id = p["wc_id"]
            images = image_map.get(wc_id, [])
            main_image_key = images[0]["r2_key"] if images else None

            product_rows.append({
                "name": p["name"][:255],
                "slug": unique_slug(p.get("slug", ""), wc_id),
                "sku": gen_sku(),
                "description": p.get("description", "")[:5000],
                "price": p.get("price", 0),
                "compare_at_price": p.get("compare_at_price"),
                "stock": 10,
                "image_key": main_image_key,
                "active": 1,
                "featured": 0,
                "specs": json.dumps(p.get("specs", {})),
                "subcategory_id": subcat_id,
                "brand_id": brand_id,
                "_wc_id": wc_id,
                "_cat_id": cat_id,
            })

        insert_data = [{k: v for k, v in r.items() if not k.startswith("_")}
                       for r in product_rows]
        try:
            result = supabase_request("POST", "products", data=insert_data)
        except Exception as e:
            print(f"  [ERR] batch {start}: {e}")
            continue

        cat_rows = []
        img_rows = []
        for i, row in enumerate(result):
            pid = row["id"]
            pr = product_rows[i]
            if pr["_cat_id"]:
                cat_rows.append({"product_id": pid, "category_id": pr["_cat_id"]})
            images = image_map.get(pr["_wc_id"], [])
            for img in images[1:]:
                img_rows.append({"product_id": pid, "image_key": img["r2_key"],
                                 "sort_order": img["sort"]})

        if cat_rows:
            try:
                supabase_request("POST", "product_categories", data=cat_rows)
                total_cat_links += len(cat_rows)
            except Exception as e:
                print(f"  [WARN] product_categories: {e}")

        if img_rows:
            try:
                supabase_request("POST", "product_images", data=img_rows)
                total_images += len(img_rows)
            except Exception as e:
                print(f"  [WARN] product_images: {e}")

        done = min(start + DB_BATCH_SIZE, len(products))
        elapsed = time.time() - start_time
        rate = done / elapsed if elapsed > 0 else 0
        print(f"  [{done}/{len(products)}] {rate:.1f} products/s")

    print(f"  Total: {len(products)} products, {total_images} extra images, {total_cat_links} category links")


# ═══════════════════════════════════════════════════════════
#  MAIN
# ═══════════════════════════════════════════════════════════

def load_products(products_file):
    path = products_file if os.path.isabs(products_file) else os.path.join(SCRIPT_DIR, products_file)
    with open(path) as f:
        return json.load(f)


def main():
    parser = argparse.ArgumentParser(description="Migrate tech products to Supabase + R2")
    parser.add_argument("--images-only", action="store_true", help="Upload images only (no DB)")
    parser.add_argument("--db-only", action="store_true", help="DB migration only (skip upload)")
    parser.add_argument(
        "--products-file",
        default="abanista/tech_products.json",
        help="Path to input products JSON (relative to data/ or absolute)",
    )
    args = parser.parse_args()

    if not SUPABASE_KEY and not args.images_only:
        print("ERROR: Set SUPABASE_SERVICE_ROLE_KEY env var")
        print("  export SUPABASE_SERVICE_ROLE_KEY='eyJ...'")
        sys.exit(1)

    products = load_products(args.products_file)
    print(f"Loaded {len(products)} products\n")

    # ── Phase 1: Build image refs + Upload ────────────────
    print("Phase 1: Building image map from products...")
    image_map = build_image_map(products)
    total_imgs = sum(len(v) for v in image_map.values())
    print(f"  {total_imgs} images mapped\n")

    if not args.db_only:
        print("Phase 2: Uploading to R2...")
        upload_to_r2(image_map)
        print()

    if args.images_only:
        print("Done (images only)")
        return

    # ── Phase 3: Database ────────────────────────────────
    print("Phase 3: Database migration...")
    clear_old_data()

    brand_ids = insert_brands(products)
    category_ids = insert_categories()
    subcat_ids = insert_subcategories(category_ids)

    print(f"  Brands: {len(brand_ids)}, Categories: {len(category_ids)}, Subcategories: {len(subcat_ids)}")

    insert_products(products, image_map, category_ids, subcat_ids, brand_ids)

    print("\nMigration complete!")


if __name__ == "__main__":
    main()
