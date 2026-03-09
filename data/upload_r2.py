#!/usr/bin/env python3
"""Upload images to R2 via S3 API. Uses shortened product names as R2 keys."""
import glob, json, os, re, sys, time
from concurrent.futures import ThreadPoolExecutor, as_completed
import boto3
from botocore.config import Config

ABANISTA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "abanista")
BUCKET = "gadgets-images"
WORKERS = 20
MAX_IMAGES = 6

s3_cfg = dict(
    endpoint_url="https://d19907edfc7aa7af1dbb6547cb6adbfe.r2.cloudflarestorage.com",
    aws_access_key_id=os.environ.get("R2_ACCESS_KEY", "efd6192538018c9fd073a54e099ca632"),
    aws_secret_access_key=os.environ.get("R2_SECRET_KEY", "ebf900412af14f148739b7fd378dbd214125ca455163537017b682e1b023709a"),
    region_name="auto",
    config=Config(retries={"max_attempts": 3, "mode": "adaptive"}),
)


def short_slug(name, max_len=50):
    s = name.lower()
    s = re.sub(r'[^a-z0-9\s-]', '', s)
    s = re.sub(r'\s+', '-', s.strip())
    s = re.sub(r'-+', '-', s)
    if len(s) > max_len:
        s = s[:max_len].rsplit('-', 1)[0]
    return s or 'product'


def resolve_path(abs_path):
    if os.path.exists(abs_path):
        return abs_path
    parent = os.path.dirname(abs_path)
    fname = os.path.basename(abs_path)
    for m in glob.glob(parent + '*'):
        if os.path.isdir(m):
            candidate = os.path.join(m, fname)
            if os.path.exists(candidate):
                return candidate
    return None


def guess_content_type(path):
    ext = os.path.splitext(path)[1].lower()
    return {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
            ".webp": "image/webp", ".gif": "image/gif", ".avif": "image/avif"
            }.get(ext, "application/octet-stream")


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Upload product images to R2")
    parser.add_argument("--products-file", default="abanista/tech_products.json",
                        help="Products JSON file (relative to data/ or absolute)")
    args = parser.parse_args()

    script_dir = os.path.dirname(os.path.abspath(__file__))
    pf = args.products_file if os.path.isabs(args.products_file) else os.path.join(script_dir, args.products_file)
    products = json.load(open(pf))
    print(f"Loaded {len(products)} products")

    # Build upload list with short slugs
    all_files = []
    used_slugs = set()
    for p in products:
        base = short_slug(p.get("name", ""))
        folder = base
        counter = 2
        while folder in used_slugs:
            folder = f"{base}-{counter}"
            counter += 1
        used_slugs.add(folder)

        for i, img in enumerate(p.get("images", [])[:MAX_IMAGES]):
            local_path = img.get("local_path", "")
            if not local_path:
                continue
            abs_path = os.path.join(ABANISTA_DIR, local_path)
            resolved = resolve_path(abs_path)
            if not resolved:
                print(f"  [MISS] {local_path}")
                continue
            ext = os.path.splitext(resolved)[1].lower() or ".jpg"
            r2_key = f"products/{folder}/{i + 1}{ext}"
            all_files.append((r2_key, resolved, guess_content_type(resolved)))

    print(f"{len(all_files)} images to process")

    # List existing
    print("Checking existing objects...", flush=True)
    client = boto3.client("s3", **s3_cfg)
    existing = set()
    paginator = client.get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=BUCKET, Prefix="products/"):
        for obj in page.get("Contents", []):
            existing.add(obj["Key"])
    print(f"{len(existing)} already in R2", flush=True)

    pending = [(k, p, ct) for k, p, ct in all_files if k not in existing]
    if not pending:
        print("All images already uploaded!")
        return

    print(f"Uploading {len(pending)} images ({WORKERS} workers)...", flush=True)

    def upload(item):
        r2_key, path, content_type = item
        c = boto3.client("s3", **s3_cfg)
        c.upload_file(path, BUCKET, r2_key, ExtraArgs={"ContentType": content_type})
        return r2_key

    ok = 0
    fail = 0
    start = time.time()

    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        futures = {pool.submit(upload, item): item[0] for item in pending}
        for f in as_completed(futures):
            try:
                f.result()
                ok += 1
            except Exception as e:
                fail += 1
                print(f"ERR {futures[f]}: {e}", file=sys.stderr, flush=True)
            done = ok + fail
            if done % 50 == 0 or done == len(pending):
                elapsed = time.time() - start
                rate = done / elapsed if elapsed > 0 else 0
                eta = (len(pending) - done) / rate if rate > 0 else 0
                print(f"[{done}/{len(pending)}] {rate:.1f}/s ETA {eta:.0f}s", flush=True)

    elapsed = time.time() - start
    print(f"Done: {ok} ok, {fail} failed ({elapsed:.0f}s)", flush=True)

if __name__ == "__main__":
    main()
