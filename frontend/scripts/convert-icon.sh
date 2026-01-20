#!/bin/bash
# Convert icon.svg to required PNG sizes
# Install ImageMagick first: sudo apt install imagemagick

# Navigate to public folder
cd "$(dirname "$0")/../public"

# Convert to different sizes
convert icon.svg -resize 256x256 icon.png
convert icon.svg -resize 192x192 icon-192.png
convert icon.svg -resize 512x512 icon-512.png
convert icon.svg -resize 200x200 splash.png

echo "Icon conversion complete!"
echo "Generated:"
ls -la icon*.png splash.png 2>/dev/null
echo ""
echo "Still need to create manually:"
echo "- og-image.png (1200x630) - social preview image"
echo "- hero.png (1200x630) - app store listing image"
echo "- screenshots/screenshot-1.png (1080x1920)"
echo "- screenshots/screenshot-2.png (1080x1920)"
echo "- screenshots/screenshot-3.png (1080x1920)"
