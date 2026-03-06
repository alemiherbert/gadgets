#!/usr/bin/env python3
"""
Scrape abanista.com — extracts all pages' text and images into an organized structure.

Output structure:
  data/abanista/
    pages.json            — array of {url, title, meta_description, headings, text_blocks, images}
    products.json         — product-specific data if WooCommerce product pages found
    images/
      <sanitized-filename>

Usage:
  pip install requests beautifulsoup4 lxml
  python data/scrape_abanista.py
"""

import json
import os
import re
import time
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://abanista.com"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "abanista")
IMAGE_DIR = os.path.join(OUTPUT_DIR, "images")
DELAY = 1.5  # seconds between requests — be polite

SESSION = requests.Session()
SESSION.headers.update({
    "User-Agent": "Mozilla/5.0 (compatible; AbanistaMigrationBot/1.0; site-owner)"
})


def ensure_dirs():
    os.makedirs(IMAGE_DIR, exist_ok=True)


def sanitize_filename(url: str) -> str:
    """Create a safe filename from a URL."""
    parsed = urlparse(url)
    name = parsed.path.strip("/").replace("/", "_") or "index"
    # Keep extension if present, otherwise guess from path
    if not os.path.splitext(name)[1]:
        name += ".html"
    # Remove unsafe chars
    name = re.sub(r'[^\w.\-]', '_', name)
    return name[:200]


def sanitize_image_name(url: str) -> str:
    """Create a safe image filename from URL."""
    parsed = urlparse(url)
    name = os.path.basename(parsed.path)
    if not name:
        name = "image"
    name = re.sub(r'[^\w.\-]', '_', name)
    return name[:200]


def fetch(url: str) -> requests.Response | None:
    """Fetch a URL with delay and error handling."""
    try:
        time.sleep(DELAY)
        resp = SESSION.get(url, timeout=30)
        resp.raise_for_status()
        return resp
    except requests.RequestException as e:
        print(f"  [WARN] Failed to fetch {url}: {e}")
        return None


def download_image(url: str) -> str | None:
    """Download an image and return local filename, or None on failure."""
    filename = sanitize_image_name(url)
    filepath = os.path.join(IMAGE_DIR, filename)

    # Skip if already downloaded
    if os.path.exists(filepath):
        return filename

    try:
        time.sleep(0.5)
        resp = SESSION.get(url, timeout=30, stream=True)
        resp.raise_for_status()
        content_type = resp.headers.get("content-type", "")
        if "image" not in content_type and "octet-stream" not in content_type:
            print(f"  [SKIP] Not an image: {url} ({content_type})")
            return None
        with open(filepath, "wb") as f:
            for chunk in resp.iter_content(8192):
                f.write(chunk)
        return filename
    except requests.RequestException as e:
        print(f"  [WARN] Failed to download image {url}: {e}")
        return None


def extract_page_data(url: str, soup: BeautifulSoup) -> dict:
    """Extract structured data from a page."""
    title = soup.title.string.strip() if soup.title and soup.title.string else ""

    meta_desc = ""
    meta_tag = soup.find("meta", attrs={"name": "description"})
    if meta_tag and meta_tag.get("content"):
        meta_desc = meta_tag["content"].strip()

    # Headings
    headings = []
    for level in range(1, 7):
        for h in soup.find_all(f"h{level}"):
            text = h.get_text(strip=True)
            if text:
                headings.append({"level": level, "text": text})

    # Text blocks — paragraphs and list items from main content
    main = soup.find("main") or soup.find("article") or soup.find(id="content") or soup.find(class_="entry-content") or soup.body
    text_blocks = []
    if main:
        for el in main.find_all(["p", "li", "blockquote", "figcaption"]):
            text = el.get_text(strip=True)
            if text and len(text) > 5:
                text_blocks.append(text)

    # Images
    images = []
    for img in soup.find_all("img"):
        src = img.get("src") or img.get("data-src") or img.get("data-lazy-src")
        if not src:
            continue
        abs_url = urljoin(url, src)
        # Only download images from the same domain or CDN
        if "abanista" in abs_url or "wp-content" in abs_url:
            local_file = download_image(abs_url)
            images.append({
                "original_url": abs_url,
                "alt": img.get("alt", ""),
                "local_file": local_file
            })

    return {
        "url": url,
        "title": title,
        "meta_description": meta_desc,
        "headings": headings,
        "text_blocks": text_blocks,
        "images": images
    }


def extract_product_data(url: str, soup: BeautifulSoup) -> dict | None:
    """Extract WooCommerce product data if the page is a product."""
    # Detect WooCommerce product page
    body_classes = soup.body.get("class", []) if soup.body else []
    is_product = "single-product" in body_classes or soup.find(class_="product_title")

    if not is_product:
        return None

    title_el = soup.find(class_="product_title") or soup.find("h1")
    title = title_el.get_text(strip=True) if title_el else ""

    # Price
    price_el = soup.find(class_="price")
    price_text = price_el.get_text(strip=True) if price_el else ""

    # SKU
    sku_el = soup.find(class_="sku")
    sku = sku_el.get_text(strip=True) if sku_el else ""

    # Description — short + full
    short_desc_el = soup.find(class_="woocommerce-product-details__short-description")
    short_description = short_desc_el.get_text(strip=True) if short_desc_el else ""

    full_desc_el = soup.find(id="tab-description") or soup.find(class_="woocommerce-Tabs-panel--description")
    full_description = full_desc_el.get_text(strip=True) if full_desc_el else ""

    # Categories
    categories = []
    cat_el = soup.find(class_="posted_in")
    if cat_el:
        for a in cat_el.find_all("a"):
            categories.append(a.get_text(strip=True))

    # Gallery images
    gallery_images = []
    gallery = soup.find(class_="woocommerce-product-gallery") or soup.find(class_="product-images")
    if gallery:
        for img in gallery.find_all("img"):
            src = img.get("src") or img.get("data-src") or img.get("data-large_image")
            if src:
                abs_url = urljoin(url, src)
                local_file = download_image(abs_url)
                gallery_images.append({
                    "original_url": abs_url,
                    "alt": img.get("alt", ""),
                    "local_file": local_file
                })

    # Specs / additional info
    specs = {}
    spec_table = soup.find(class_="woocommerce-product-attributes") or soup.find(class_="shop_attributes")
    if spec_table:
        for row in spec_table.find_all("tr"):
            label_el = row.find("th")
            value_el = row.find("td")
            if label_el and value_el:
                specs[label_el.get_text(strip=True)] = value_el.get_text(strip=True)

    # Stock status
    stock_el = soup.find(class_="stock")
    stock_status = stock_el.get_text(strip=True) if stock_el else ""

    return {
        "url": url,
        "title": title,
        "price": price_text,
        "sku": sku,
        "short_description": short_description,
        "full_description": full_description,
        "categories": categories,
        "gallery_images": gallery_images,
        "specs": specs,
        "stock_status": stock_status
    }


def discover_urls(soup: BeautifulSoup, base_url: str, visited: set) -> list[str]:
    """Find internal links to crawl."""
    urls = []
    domain = urlparse(base_url).netloc
    for a in soup.find_all("a", href=True):
        href = a["href"]
        abs_url = urljoin(base_url, href)
        parsed = urlparse(abs_url)

        # Only follow same-domain links
        if parsed.netloc != domain:
            continue

        # Clean URL — remove fragment, normalize
        clean = f"{parsed.scheme}://{parsed.netloc}{parsed.path.rstrip('/')}/"
        if clean not in visited and "?" not in clean and "#" not in clean:
            # Skip non-page resources
            ext = os.path.splitext(parsed.path)[1].lower()
            if ext in (".pdf", ".zip", ".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp", ".mp4", ".mp3"):
                continue
            urls.append(clean)
    return urls


def crawl():
    """Main crawl loop."""
    ensure_dirs()

    visited: set[str] = set()
    to_visit: list[str] = [BASE_URL + "/"]
    pages: list[dict] = []
    products: list[dict] = []

    print(f"Starting crawl of {BASE_URL}")
    print(f"Output directory: {OUTPUT_DIR}")
    print()

    while to_visit:
        url = to_visit.pop(0)
        normalized = url.rstrip("/") + "/"

        if normalized in visited:
            continue
        visited.add(normalized)

        print(f"[{len(visited):3d}] Crawling: {url}")
        resp = fetch(url)
        if not resp:
            continue

        content_type = resp.headers.get("content-type", "")
        if "html" not in content_type:
            continue

        soup = BeautifulSoup(resp.text, "lxml")

        # Extract page data
        page_data = extract_page_data(url, soup)
        pages.append(page_data)

        # Check if it's a product page
        product_data = extract_product_data(url, soup)
        if product_data:
            products.append(product_data)
            print(f"  -> Product found: {product_data['title']}")

        # Discover more URLs
        new_urls = discover_urls(soup, url, visited)
        for new_url in new_urls:
            if new_url not in visited:
                to_visit.append(new_url)

        # Save progress periodically
        if len(visited) % 10 == 0:
            save_results(pages, products)

    save_results(pages, products)
    print(f"\nDone! Crawled {len(visited)} pages, found {len(products)} products.")
    print(f"Results saved to {OUTPUT_DIR}")


def save_results(pages: list[dict], products: list[dict]):
    """Write results to JSON files."""
    with open(os.path.join(OUTPUT_DIR, "pages.json"), "w", encoding="utf-8") as f:
        json.dump(pages, f, indent=2, ensure_ascii=False)

    with open(os.path.join(OUTPUT_DIR, "products.json"), "w", encoding="utf-8") as f:
        json.dump(products, f, indent=2, ensure_ascii=False)


if __name__ == "__main__":
    crawl()
