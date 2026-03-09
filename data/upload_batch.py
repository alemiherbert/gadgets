#!/usr/bin/env python3
"""
Upload cleaned product batch to Supabase + R2.

Usage:
  python upload_batch.py <cleaned_products.json>
  python upload_batch.py abanista/cleaned_chunks/tech_productstxt

Features:
  - Uploads images to R2 with short readable slugs
  - Inserts brands, categories, subcategories, products
  - Handles image path resolution (fuzzy matching for truncated dirs)
  - Parallel image uploads
"""

import argparse
import glob
import json
import os
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import boto3
import requests
from botocore.config import Config as BotoConfig

# ══════════════════════════════════════════════════════════
#  CONFIG
# ══════════════════════════════════════════════════════════

SCRIPT_DIR = Path(__file__).parent.resolve()
ABANISTA_DIR = SCRIPT_DIR / "abanista"

# Supabase
SUPABASE_URL = "https://xplhaaslnrpaqqrpxkbm.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwbGhhYXNsbnJwYXFxcnB4a2JtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjgzMDg5MSwiZXhwIjoyMDg4NDA2ODkxfQ.K6t6kBglOWVahqDORgLPB2Ik9Q_dpFpAOpGHEbThAQE"

# R2
CF_ACCOUNT_ID = "d19907edfc7aa7af1dbb6547cb6adbfe"
R2_BUCKET = "gadgets-images"
R2_ENDPOINT = f"https://{CF_ACCOUNT_ID}.r2.cloudflarestorage.com"
R2_ACCESS_KEY = "efd6192538018c9fd073a54e099ca632"
R2_SECRET_KEY = "ebf900412af14f148739b7fd378dbd214125ca455163537017b682e1b023709a"

MAX_IMAGES_PER_PRODUCT = 6
R2_UPLOAD_WORKERS = 20

# ══════════════════════════════════════════════════════════
#  HELPERS
# ══════════════════════════════════════════════════════════

def short_slug(name, max_len=50):
    """Turn a product name into a short, readable slug for R2 keys."""
    s = name.lower()
    s = re.sub(r'[^a-z0-9]+', '-', s).strip('-')
    if len(s) > max_len:
        s = s[:max_len].rsplit('-', 1)[0]
    return s


def _resolve_path(abs_path):
    """Resolve a path, with glob fallback for truncated directory names."""
    if os.path.exists(abs_path):
        return abs_path
    parent = os.path.dirname(abs_path)
    fname = os.path.basename(abs_path)
    if not os.path.exists(parent):
        pattern = parent + '*'
        matches = glob.glob(pattern)
        if matches:
            candidate = os.path.join(matches[0], fname)
            if os.path.exists(candidate):
                return candidate
    return None


def _guess_content_type(path):
    ext = os.path.splitext(path)[1].lower()
    return {
        '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
        '.png': 'image/png', '.gif': 'image/gif',
        '.webp': 'image/webp', '.avif': 'image/avif'
    }.get(ext, 'application/octet-stream')


# ══════════════════════════════════════════════════════════
#  CATEGORY MAPPING (from migrate.py)
# ══════════════════════════════════════════════════════════

NEW_CATEGORIES = [
    {"name": "Phones & Wearables", "slug": "phones-wearables",
     "description": "Smartphones, Smart Watches & Wearable Technology",
     "icon": "/img/categories/phones.avif"},
    {"name": "TVs & Displays", "slug": "tvs-displays",
     "description": "Smart TVs, Commercial Displays, Projectors & Accessories",
     "icon": "/img/categories/smart-home.avif"},
    {"name": "Audio", "slug": "audio",
     "description": "Soundbars, Speakers, Headphones, Earbuds & Audio Equipment",
     "icon": "/img/categories/audio.avif"},
    {"name": "Computing & Gaming", "slug": "computing-gaming",
     "description": "Laptops, Monitors, Printers, Gaming Gear & Accessories",
     "icon": "/img/categories/computing.avif"},
    {"name": "Cameras", "slug": "cameras",
     "description": "Digital Cameras, Lenses, Tripods & Photography Accessories",
     "icon": "/img/categories/smart-home.avif"},
    {"name": "Accessories & Power", "slug": "accessories-power",
     "description": "Power Banks, Chargers, Cables, Car Electronics, Health Products & More",
     "icon": "/img/categories/power.avif"},
]

NEW_SUBCATEGORIES = {
    "phones-wearables": [
        {"name": "Smartphones", "slug": "smartphones"},
        {"name": "Smart Watches", "slug": "smart-watches"},
    ],
    "tvs-displays": [
        {"name": "Smart TVs", "slug": "smart-tvs"},
        {"name": "Digital TVs", "slug": "digital-tvs"},
        {"name": "Projectors", "slug": "projectors"},
        {"name": "Commercial Displays", "slug": "commercial-displays"},
        {"name": "TV Accessories", "slug": "tv-accessories"},
    ],
    "audio": [
        {"name": "Soundbars", "slug": "soundbars"},
        {"name": "Portable Speakers", "slug": "portable-speakers"},
        {"name": "Party Speakers", "slug": "party-speakers"},
        {"name": "Home Theatre", "slug": "home-theatre"},
        {"name": "Headphones", "slug": "headphones"},
        {"name": "Earbuds", "slug": "earbuds"},
        {"name": "Microphones", "slug": "microphones"},
    ],
    "computing-gaming": [
        {"name": "Laptops & Computers", "slug": "laptops-computers"},
        {"name": "Monitors", "slug": "monitors"},
        {"name": "Printers & Scanners", "slug": "printers-scanners"},
        {"name": "Gaming", "slug": "gaming"},
    ],
    "cameras": [
        {"name": "Digital Cameras", "slug": "digital-cameras"},
        {"name": "Lenses & Accessories", "slug": "lenses-accessories"},
    ],
    "accessories-power": [
        {"name": "Power Banks", "slug": "power-banks"},
        {"name": "Chargers & Inverters", "slug": "chargers-inverters"},
        {"name": "Generators", "slug": "generators"},
        {"name": "Solar & Lighting", "slug": "solar-lighting"},
        {"name": "Cables & Adapters", "slug": "cables-adapters"},
        {"name": "Car Accessories", "slug": "car-accessories"},
        {"name": "Health & Wellness", "slug": "health-wellness"},
    ],
}

WC_TO_NEW_CATEGORY = {
    "mobile-phones-smartphones": "phones-wearables",
    "smart-watches": "phones-wearables",
    "smart-tvs": "tvs-displays",
    "digital-tvs": "tvs-displays",
    "projectors": "tvs-displays",
    "commercial-displays": "tvs-displays",
    "tv-accessories": "tvs-displays",
    "soundbars": "audio",
    "portable-speakers": "audio",
    "party-speakers-trolleys": "audio",
    "home-theatre-systems": "audio",
    "headphones-earphones": "audio",
    "microphones": "audio",
    "laptops-computers": "computing-gaming",
    "monitors": "computing-gaming",
    "printers-scanners": "computing-gaming",
    "gaming": "computing-gaming",
    "cameras": "cameras",
    "lenses-tripods-accessories": "cameras",
    "power-banks": "accessories-power",
    "chargers-inverters": "accessories-power",
    "generators": "accessories-power",
    "solar-lighting": "accessories-power",
    "cables-adapters": "accessories-power",
    "car-accessories": "accessories-power",
    "health-care-products": "accessories-power",
}

WC_TO_NEW_SUBCATEGORY = {
    "mobile-phones-smartphones": ("phones-wearables", "smartphones"),
    "smart-watches": ("phones-wearables", "smart-watches"),
    "smart-tvs": ("tvs-displays", "smart-tvs"),
    "digital-tvs": ("tvs-displays", "digital-tvs"),
    "projectors": ("tvs-displays", "projectors"),
    "commercial-displays": ("tvs-displays", "commercial-displays"),
    "tv-accessories": ("tvs-displays", "tv-accessories"),
    "soundbars": ("audio", "soundbars"),
    "portable-speakers": ("audio", "portable-speakers"),
    "party-speakers-trolleys": ("audio", "party-speakers"),
    "home-theatre-systems": ("audio", "home-theatre"),
    "headphones-earphones": ("audio", "headphones"),
    "microphones": ("audio", "microphones"),
    "laptops-computers": ("computing-gaming", "laptops-computers"),
    "monitors": ("computing-gaming", "monitors"),
    "printers-scanners": ("computing-gaming", "printers-scanners"),
    "gaming": ("computing-gaming", "gaming"),
    "cameras": ("cameras", "digital-cameras"),
    "lenses-tripods-accessories": ("cameras", "lenses-accessories"),
    "power-banks": ("accessories-power", "power-banks"),
    "chargers-inverters": ("accessories-power", "chargers-inverters"),
    "generators": ("accessories-power", "generators"),
    "solar-lighting": ("accessories-power", "solar-lighting"),
    "cables-adapters": ("accessories-power", "cables-adapters"),
    "car-accessories": ("accessories-power", "car-accessories"),
    "health-care-products": ("accessories-power", "health-wellness"),
}

# ══════════════════════════════════════════════════════════
#  SUPABASE
# ══════════════════════════════════════════════════════════

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


def get_or_create_brands(products):
    """Get existing brands and create missing ones."""
    print("  Fetching/creating brands...")
    existing = supabase_request("GET", "brands") or []
    existing_map = {b["slug"]: b["id"] for b in existing}

    seen = {}
    for p in products:
        b = p.get("brand")
        if b and b.get("slug") and b["slug"] not in seen:
            seen[b["slug"]] = b["name"]

    to_create = []
    for slug, name in seen.items():
        if slug not in existing_map:
            to_create.append({"name": name, "slug": slug, "sort_order": 0})

    if to_create:
        result = supabase_request("POST", "brands", data=to_create)
        for r in result:
            existing_map[r["slug"]] = r["id"]
        print(f"    Created {len(to_create)} new brands")

    return existing_map


def get_or_create_categories():
    """Get existing categories and create missing ones."""
    print("  Fetching/creating categories...")
    existing = supabase_request("GET", "categories") or []
    existing_map = {c["slug"]: c["id"] for c in existing}

    to_create = [c for c in NEW_CATEGORIES if c["slug"] not in existing_map]
    if to_create:
        cats = [{k: v for k, v in c.items()} for c in to_create]
        result = supabase_request("POST", "categories", data=cats)
        for r in result:
            existing_map[r["slug"]] = r["id"]
        print(f"    Created {len(to_create)} new categories")

    return existing_map


def get_or_create_subcategories(category_ids):
    """Get existing subcategories and create missing ones."""
    print("  Fetching/creating subcategories...")
    existing = supabase_request("GET", "subcategories") or []
    existing_map = {s["slug"]: s["id"] for s in existing}

    rows = []
    sort = 0
    for cat_slug, subcats in NEW_SUBCATEGORIES.items():
        cat_id = category_ids.get(cat_slug)
        if not cat_id:
            continue
        for sub in subcats:
            if sub["slug"] not in existing_map:
                sort += 1
                rows.append({
                    "name": sub["name"],
                    "slug": sub["slug"],
                    "category_id": cat_id,
                    "sort_order": sort,
                })

    if rows:
        result = supabase_request("POST", "subcategories", data=rows)
        for r in result:
            existing_map[r["slug"]] = r["id"]
        print(f"    Created {len(rows)} new subcategories")

    return existing_map


def determine_product_mapping(product, category_ids, subcat_ids):
    """Map WC categories to new category/subcategory."""
    wc_cat_slugs = [c["slug"] for c in product.get("categories", [])]

    new_cat_slug = None
    new_subcat_slug = None

    for wc_slug in wc_cat_slugs:
        if wc_slug in WC_TO_NEW_CATEGORY:
            new_cat_slug = WC_TO_NEW_CATEGORY[wc_slug]
            break

    for wc_slug in wc_cat_slugs:
        if wc_slug in WC_TO_NEW_SUBCATEGORY:
            _, new_subcat_slug = WC_TO_NEW_SUBCATEGORY[wc_slug]
            break

    if not new_cat_slug:
        new_cat_slug = "accessories-power"

    cat_id = category_ids.get(new_cat_slug)
    subcat_id = subcat_ids.get(new_subcat_slug) if new_subcat_slug else None

    return cat_id, subcat_id


# ══════════════════════════════════════════════════════════
#  R2 UPLOAD
# ══════════════════════════════════════════════════════════

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


def build_image_map(products):
    """Build R2 key → local path mapping with short slugs."""
    print("  Building image map...")
    image_map = {}
    total_found = 0
    total_missing = 0
    used_slugs = set()

    for p in products:
        wc_id = p.get("wc_id")
        if wc_id is None:
            continue

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

            abs_path = ABANISTA_DIR / local_path
            resolved = _resolve_path(str(abs_path))
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

    print(f"    Images mapped: {total_found} found, {total_missing} missing")
    return image_map


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

    print(f"  Checking existing objects in R2...")
    client = _get_s3_client()
    existing = set()
    try:
        paginator = client.get_paginator("list_objects_v2")
        for page in paginator.paginate(Bucket=R2_BUCKET, Prefix="products/"):
            for obj in page.get("Contents", []):
                existing.add(obj["Key"])
        print(f"    {len(existing)} already in R2")
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
                print(f"    [{done}/{len(pending)}] {rate:.0f} img/s, ETA {eta:.0f}s")

    elapsed = time.time() - start
    print(f"  R2 upload: {uploaded} ok, {failed} failed ({elapsed:.0f}s)")
    return uploaded + len(existing)


# ══════════════════════════════════════════════════════════
#  PRODUCT INSERTION
# ══════════════════════════════════════════════════════════

def insert_products(products, image_map, brand_ids, category_ids, subcat_ids):
    """Insert products, product_images, and product_categories."""
    print(f"  Inserting {len(products)} products...")

    product_rows = []
    for p in products:
        wc_id = p.get("wc_id")
        if wc_id is None:
            continue

        cat_id, subcat_id = determine_product_mapping(p, category_ids, subcat_ids)
        brand_slug = p.get("brand", {}).get("slug")
        brand_id = brand_ids.get(brand_slug) if brand_slug else None

        images = image_map.get(wc_id, [])
        main_image_key = images[0]["r2_key"] if images else None

        specs_str = json.dumps(p.get("specs", {})) if isinstance(p.get("specs"), dict) else (p.get("specs") or "{}")

        product_rows.append({
            "name": p.get("name", "Untitled"),
            "slug": short_slug(p.get("name", "untitled")),
            "sku": p.get("sku", ""),
            "description": p.get("description", ""),
            "price": p.get("price", 0),
            "compare_at_price": p.get("compare_at_price"),
            "stock": p.get("stock_quantity", 10),
            "image_key": main_image_key,
            "specs": specs_str,
            "subcategory_id": subcat_id,
            "brand_id": brand_id,
            "active": 1,
            "featured": 0,
        })

    result = supabase_request("POST", "products", data=product_rows)
    product_id_map = {}
    for r in result:
        product_id_map[r["slug"]] = r["id"]

    # Insert product_images
    image_rows = []
    for p in products:
        wc_id = p.get("wc_id")
        slug = short_slug(p.get("name", ""))
        product_id = product_id_map.get(slug)
        if not product_id:
            continue

        images = image_map.get(wc_id, [])
        for img in images[1:]:  # Skip first (main image)
            image_rows.append({
                "product_id": product_id,
                "image_key": img["r2_key"],
                "sort_order": img["sort"],
            })

    if image_rows:
        supabase_request("POST", "product_images", data=image_rows)
        print(f"    Inserted {len(image_rows)} extra images")

    # Insert product_categories
    cat_link_rows = []
    for p in products:
        slug = short_slug(p.get("name", ""))
        product_id = product_id_map.get(slug)
        if not product_id:
            continue

        cat_id, _ = determine_product_mapping(p, category_ids, subcat_ids)
        if cat_id:
            cat_link_rows.append({
                "product_id": product_id,
                "category_id": cat_id,
            })

    if cat_link_rows:
        supabase_request("POST", "product_categories", data=cat_link_rows)
        print(f"    Linked {len(cat_link_rows)} product-category relationships")

    print(f"  ✓ Products inserted: {len(result)}")


# ══════════════════════════════════════════════════════════
#  MAIN
# ══════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(description="Upload cleaned product batch to Supabase + R2")
    parser.add_argument("products_file", help="Path to cleaned products JSON file")
    parser.add_argument("--skip-images", action="store_true", help="Skip R2 image upload")
    parser.add_argument("--skip-db", action="store_true", help="Skip database insertion")
    args = parser.parse_args()

    products_path = Path(args.products_file)
    if not products_path.is_absolute():
        products_path = SCRIPT_DIR / products_path

    if not products_path.exists():
        print(f"❌ File not found: {products_path}")
        sys.exit(1)

    print(f"Loading products from {products_path.name}...")
    with open(products_path) as f:
        products = json.load(f)

    print(f"✓ Loaded {len(products)} products\n")

    # Build image map
    image_map = build_image_map(products)

    # Upload images to R2
    if not args.skip_images:
        print("\n📦 Uploading images to R2...")
        upload_to_r2(image_map)

    # Insert into DB
    if not args.skip_db:
        print("\n💾 Inserting into database...")
        brand_ids = get_or_create_brands(products)
        category_ids = get_or_create_categories()
        subcat_ids = get_or_create_subcategories(category_ids)
        insert_products(products, image_map, brand_ids, category_ids, subcat_ids)

    print("\n✅ Upload complete!")


if __name__ == "__main__":
    main()
