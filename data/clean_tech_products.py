#!/usr/bin/env python3
"""
Clean tech_products.json:
- Decode HTML entities in names and descriptions
- Normalize product names (concise, not a description)
- Fix grammar in descriptions using GPT-4.1
- Output to tech_products_clean.json with incremental progress saving
"""

import json
import os
import sys
import html
import re
import time
from pathlib import Path
from openai import OpenAI

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
if not OPENAI_API_KEY:
    print("ERROR: Set OPENAI_API_KEY environment variable first.")
    print("  export OPENAI_API_KEY=sk-...")
    sys.exit(1)

client = OpenAI(api_key=OPENAI_API_KEY)

INPUT_FILE  = Path(__file__).parent / "abanista/tech_products.json"
OUTPUT_FILE = Path(__file__).parent / "abanista/tech_products_clean.json"
BATCH_SIZE  = 20   # products per API call

SYSTEM_PROMPT = """You are a product data editor for a tech e-commerce store in Uganda.

You will receive a JSON array of products. For each product return a JSON array with ONLY two fields per item (same order):
- "name": A concise, clean product name. Rules:
  * Decode any HTML entities (&#8243; → ", &amp; → &, &#8211; → –, &#215; → ×, etc.)
  * Include: Brand + Model + key spec (capacity, size, or model number) + product type
  * Omit: marketing phrases, compatibility lists ("for iPhone/Samsung"), year labels ("2025 Updated"), parenthetical marketing, "and More", feature lists
  * Keep parenthetical if it is the model name (e.g. "Galaxy S25 (Ultra)")
  * Max ~80 characters. Title case.
  * Examples:
      IN:  "Samsung 65\" QLED 4K Smart TV (2024), with Quantum Processor, for Netflix/YouTube and More"
      OUT: "Samsung 65\" QLED 4K Smart TV"
      IN:  "Anker Zolo Power Bank (2025 Upgraded Version), 20,000mAh 30W High-Speed Portable Charger with Built-in USB-C Cable, Battery Pack for iPhone 17/16 / 15 Series, Galaxy, and More"
      OUT: "Anker Zolo 20000mAh 30W Power Bank"
      IN:  "JBL Tune 510BT &#8211; Wireless On-Ear Headphones with 40H Battery Life, Folding Design"
      OUT: "JBL Tune 510BT Wireless On-Ear Headphones"

- "description": The cleaned, grammar-corrected description. Rules:
  * Decode HTML entities
  * Replace non-breaking spaces (\\u00a0) with regular spaces
  * Remove the product name if it appears verbatim as the first line/paragraph
  * Fix grammar: subject-verb agreement, article usage, punctuation, run-on sentences
  * Do NOT rewrite content — only fix errors and tidy up
  * Preserve paragraph structure and technical details
  * Strip clearly duplicate paragraphs

Return ONLY a valid JSON array with exactly the same number of objects as input. No markdown, no explanation.
"""

def basic_clean(text: str) -> str:
    """HTML decode + whitespace normalisation — no AI needed."""
    if not text:
        return text
    text = html.unescape(text)
    text = text.replace("\u00a0", " ").replace("\u200b", "")
    text = re.sub(r"  +", " ", text)
    text = text.strip()
    return text

def build_user_prompt(products: list) -> str:
    items = [{"name": p["name"], "description": p.get("description", "")} for p in products]
    return json.dumps(items, ensure_ascii=False)

def call_gpt(products: list, retries: int = 3) -> list | None:
    for attempt in range(retries):
        try:
            resp = client.chat.completions.create(
                model="gpt-4.1",
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user",   "content": build_user_prompt(products)},
                ],
                temperature=0.2,
                response_format={"type": "json_object"},
            )
            raw = resp.choices[0].message.content
            # GPT wraps in a key sometimes, try to extract array
            parsed = json.loads(raw)
            if isinstance(parsed, list):
                return parsed
            # look for any list value
            for v in parsed.values():
                if isinstance(v, list):
                    return v
            print(f"  Unexpected response structure: {list(parsed.keys())}")
            return None
        except Exception as e:
            print(f"  Attempt {attempt+1} failed: {e}")
            if attempt < retries - 1:
                time.sleep(5 * (attempt + 1))
    return None

def main():
    products = json.loads(INPUT_FILE.read_text())
    total = len(products)
    print(f"Loaded {total} products from {INPUT_FILE}")

    # Load existing progress if output file exists
    if OUTPUT_FILE.exists():
        done = json.loads(OUTPUT_FILE.read_text())
        print(f"Resuming: {len(done)} already done")
    else:
        done = []

    start_idx = len(done)
    if start_idx >= total:
        print("All products already processed.")
        return

    for i in range(start_idx, total, BATCH_SIZE):
        batch = products[i : i + BATCH_SIZE]
        print(f"Processing {i+1}–{min(i+BATCH_SIZE, total)} / {total} ...", end=" ", flush=True)

        result = call_gpt(batch)

        if result is None or len(result) != len(batch):
            print(f"FAILED (got {len(result) if result else 0} items) — inserting basic-cleaned fallback")
            result = [{"name": basic_clean(p["name"]), "description": basic_clean(p.get("description",""))} for p in batch]

        for orig, cleaned in zip(batch, result):
            merged = dict(orig)
            merged["name"]        = cleaned.get("name", basic_clean(orig["name"]))
            merged["description"] = cleaned.get("description", basic_clean(orig.get("description","")))
            # Also apply basic clean to any remaining HTML entities GPT might have missed:
            merged["name"]        = basic_clean(merged["name"])
            merged["description"] = basic_clean(merged["description"])
            # Sync slug to new name
            merged["slug"] = re.sub(r"[^a-z0-9]+", "-", merged["name"].lower()).strip("-")
            done.append(merged)

        OUTPUT_FILE.write_text(json.dumps(done, ensure_ascii=False, indent=2))
        print(f"saved ({len(done)} total)")

        # Slight pause to be kind to rate limits
        if i + BATCH_SIZE < total:
            time.sleep(0.5)

    print(f"\nDone! {len(done)} products written to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
