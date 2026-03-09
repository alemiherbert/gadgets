#!/bin/bash
# Upload images to R2 in parallel using wrangler CLI
# Usage: bash upload_r2.sh [WORKERS]
set -euo pipefail

WORKERS=${1:-6}
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
UPLOAD_LIST="$SCRIPT_DIR/abanista/upload_list.txt"
LOG="$SCRIPT_DIR/abanista/upload_progress.log"

if [ ! -f "$UPLOAD_LIST" ]; then
    echo "ERROR: $UPLOAD_LIST not found"
    exit 1
fi

TOTAL=$(wc -l < "$UPLOAD_LIST")
echo "Uploading $TOTAL images with $WORKERS parallel workers..."
echo "Log: $LOG"
echo "0" > "$LOG"

upload_one() {
    local local_file="$1"
    local r2_path="$2"
    local attempt=0
    local max_retries=3
    
    while [ $attempt -lt $max_retries ]; do
        if npx wrangler r2 object put "$r2_path" -f "$local_file" --ct "image/webp" \
            --cwd "$PROJECT_DIR" >/dev/null 2>&1; then
            # Atomically increment counter
            COUNT=$(cat "$LOG")
            echo $((COUNT + 1)) > "$LOG"
            NEW_COUNT=$((COUNT + 1))
            if [ $((NEW_COUNT % 100)) -eq 0 ]; then
                echo "  [$NEW_COUNT/$TOTAL] uploaded"
            fi
            return 0
        fi
        attempt=$((attempt + 1))
        sleep $((attempt * 2))
    done
    echo "FAILED: $r2_path" >&2
    return 1
}

export -f upload_one
export PROJECT_DIR LOG TOTAL

# Run parallel uploads using xargs
cat "$UPLOAD_LIST" | xargs -P "$WORKERS" -L 1 bash -c 'upload_one "$1" "$2"' _

FINAL=$(cat "$LOG")
echo "Done: $FINAL/$TOTAL uploaded"
