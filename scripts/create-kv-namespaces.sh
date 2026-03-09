#!/usr/bin/env bash
# Create Cloudflare KV namespaces for the Gadgets Store application
# Run this script after setting up wrangler CLI

set -e

echo "Creating Cloudflare KV namespaces..."

# Create rate limiting KV namespace
echo "Creating RATE_LIMIT_KV namespace..."
RATE_LIMIT_ID=$(npx wrangler kv namespace create "RATE_LIMIT_KV" | grep -oP 'id = "\K[^"]+')
RATE_LIMIT_PREVIEW_ID=$(npx wrangler kv namespace create "RATE_LIMIT_KV" --preview | grep -oP 'id = "\K[^"]+')

echo "RATE_LIMIT_KV created:"
echo "  Production ID: $RATE_LIMIT_ID"
echo "  Preview ID: $RATE_LIMIT_PREVIEW_ID"

# Create security logs KV namespace
echo ""
echo "Creating SECURITY_LOGS_KV namespace..."
SECURITY_LOGS_ID=$(npx wrangler kv namespace create "SECURITY_LOGS_KV" | grep -oP 'id = "\K[^"]+')
SECURITY_LOGS_PREVIEW_ID=$(npx wrangler kv namespace create "SECURITY_LOGS_KV" --preview | grep -oP 'id = "\K[^"]+')

echo "SECURITY_LOGS_KV created:"
echo "  Production ID: $SECURITY_LOGS_ID"
echo "  Preview ID: $SECURITY_LOGS_PREVIEW_ID"

# Update wrangler.toml
echo ""
echo "Updating wrangler.toml..."

# Backup current wrangler.toml
cp wrangler.toml wrangler.toml.backup

# Update the IDs in wrangler.toml
sed -i "s/binding = \"RATE_LIMIT_KV\"\nid = \"placeholder\"/binding = \"RATE_LIMIT_KV\"\nid = \"$RATE_LIMIT_ID\"/" wrangler.toml
sed -i "s/preview_id = \"placeholder\"/preview_id = \"$RATE_LIMIT_PREVIEW_ID\"/" wrangler.toml

# For security logs KV
awk -v rate_done=0 -v sec_id="$SECURITY_LOGS_ID" -v sec_prev_id="$SECURITY_LOGS_PREVIEW_ID" '
/binding = "RATE_LIMIT_KV"/ { rate_done=1 }
rate_done && /binding = "SECURITY_LOGS_KV"/ && /id = "placeholder"/ {
    sub(/id = "placeholder"/, "id = \"" sec_id "\"")
    rate_done=2
}
rate_done==2 && /preview_id = "placeholder"/ {
    sub(/preview_id = "placeholder"/, "preview_id = \"" sec_prev_id "\"")
    rate_done=3
}
{ print }
' wrangler.toml > wrangler.toml.tmp && mv wrangler.toml.tmp wrangler.toml

echo ""
echo "✅ KV namespaces created and wrangler.toml updated!"
echo ""
echo "Please add these bindings to your wrangler.toml manually if the automatic update failed:"
echo ""
echo "[[kv_namespaces]]"
echo "binding = \"RATE_LIMIT_KV\""
echo "id = \"$RATE_LIMIT_ID\""
echo "preview_id = \"$RATE_LIMIT_PREVIEW_ID\""
echo ""
echo "[[kv_namespaces]]"
echo "binding = \"SECURITY_LOGS_KV\""
echo "id = \"$SECURITY_LOGS_ID\""
echo "preview_id = \"$SECURITY_LOGS_PREVIEW_ID\""
echo ""
echo "Original wrangler.toml backed up to wrangler.toml.backup"
