#!/bin/bash
# scripts/create-icns.sh
#
# Converts a 1024×1024 PNG → macOS .icns bundle
# Usage: ./scripts/create-icns.sh path/to/icon-1024.png
#
# Requires macOS (uses sips and iconutil, both built-in).
# Place the output assets/icon.icns in the assets/ folder before building.

set -e

SOURCE="${1:-assets/icon-source.png}"

if [ ! -f "$SOURCE" ]; then
  echo "Error: source image not found at $SOURCE"
  echo "Usage: $0 path/to/1024x1024.png"
  exit 1
fi

ICONSET="assets/MacTerm.iconset"
mkdir -p "$ICONSET"

sizes=(16 32 64 128 256 512 1024)

for size in "${sizes[@]}"; do
  sips -z $size $size "$SOURCE" --out "$ICONSET/icon_${size}x${size}.png"       > /dev/null
done

# Retina (@2x) sizes
sips -z 32   32   "$SOURCE" --out "$ICONSET/icon_16x16@2x.png"   > /dev/null
sips -z 64   64   "$SOURCE" --out "$ICONSET/icon_32x32@2x.png"   > /dev/null
sips -z 256  256  "$SOURCE" --out "$ICONSET/icon_128x128@2x.png" > /dev/null
sips -z 512  512  "$SOURCE" --out "$ICONSET/icon_256x256@2x.png" > /dev/null
sips -z 1024 1024 "$SOURCE" --out "$ICONSET/icon_512x512@2x.png" > /dev/null

iconutil -c icns "$ICONSET" -o assets/icon.icns
rm -rf "$ICONSET"

echo "✓ Created assets/icon.icns"
