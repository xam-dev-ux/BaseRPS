# Required Assets for Base Mini App

Before deploying, you need to create and add the following image assets to this `public/` folder.

## Quick Start

### 1. Convert the icon SVG to PNG (if ImageMagick is installed)

```bash
# Install ImageMagick
sudo apt install imagemagick

# Run conversion script
chmod +x scripts/convert-icon.sh
./scripts/convert-icon.sh
```

### 2. Or create images manually

Use the `icon.svg` as a template and export to PNG using:
- Figma, Sketch, or Adobe Illustrator
- Online tools like svgtopng.com
- GIMP or Inkscape

---

## Required Images

### Icon Images (REQUIRED for indexing)

| File | Size | Description | Status |
|------|------|-------------|--------|
| `icon.png` | 256x256 | Main app icon (square) | **MISSING** |
| `icon-192.png` | 192x192 | PWA icon (square) | **MISSING** |
| `icon-512.png` | 512x512 | Large PWA icon (square) | **MISSING** |

### Splash & Preview Images (REQUIRED for indexing)

| File | Size | Description | Status |
|------|------|-------------|--------|
| `splash.png` | 200x200 | Splash screen image while app loads | **MISSING** |
| `og-image.png` | 1200x630 | Open Graph image for social sharing | **MISSING** |
| `hero.png` | 1200x630 | Hero/promotional image for app listing | **MISSING** |

### Screenshots (RECOMMENDED)

Place in `screenshots/` folder:

| File | Size | Description |
|------|------|-------------|
| `screenshot-1.png` | 1080x1920 (9:16) | Gameplay screenshot |
| `screenshot-2.png` | 1080x1920 (9:16) | Match list screenshot |
| `screenshot-3.png` | 1080x1920 (9:16) | Stats screenshot |

---

## Design Guidelines

### Colors (from app theme)
- **Primary**: `#1e3a8a` (Blue 900)
- **Background**: `#111827` (Gray 900)
- **Accent**: `#3b82f6` (Blue 500)
- **Rock**: `#fbbf24` (Amber)
- **Paper**: `#f0f9ff` (Light blue)
- **Scissors**: `#ef4444` (Red)

### Icon Design
- Features Rock (circle), Paper (rectangle), Scissors
- Clean and recognizable at small sizes
- Uses the blue gradient background
- Reference: `icon.svg` in this folder

### Screenshots Requirements
- Show actual app UI (gameplay, matches, stats)
- Portrait orientation required (9:16)
- Capture key features: gameplay, wallet connection, match creation

---

## Deployment Setup

### Step 1: Create Image Assets

Generate all required PNG files listed above.

### Step 2: Replace YOUR_DOMAIN

Update the domain placeholder in these files:

```bash
# Files that need YOUR_DOMAIN replaced:
# - public/.well-known/farcaster.json
# - minikit.config.ts
# - index.html
```

Use find and replace:
```bash
# Example: replace with your domain
find . -type f \( -name "*.json" -o -name "*.ts" -o -name "*.html" \) \
  -exec sed -i 's/YOUR_DOMAIN/yourapp.vercel.app/g' {} \;
```

### Step 3: Deploy to Public URL

Deploy your app to a hosting service (Vercel, Netlify, etc.):
- Disable deployment protection/authentication
- Note your production URL

### Step 4: Get Account Association

1. Go to https://base.dev
2. Enter your production domain
3. Complete the verification flow
4. Copy the returned values:
   - `header`
   - `payload`
   - `signature`

### Step 5: Update Configuration

Replace placeholders in:

**`public/.well-known/farcaster.json`**:
```json
{
  "accountAssociation": {
    "header": "YOUR_ACTUAL_HEADER",
    "payload": "YOUR_ACTUAL_PAYLOAD",
    "signature": "YOUR_ACTUAL_SIGNATURE"
  },
  ...
}
```

**`minikit.config.ts`**:
```typescript
accountAssociation: {
  header: "YOUR_ACTUAL_HEADER",
  payload: "YOUR_ACTUAL_PAYLOAD",
  signature: "YOUR_ACTUAL_SIGNATURE",
},
```

### Step 6: Validate Configuration

1. Check JSON syntax: https://jsonlint.com
2. Verify manifest URL: `https://YOUR_DOMAIN/.well-known/farcaster.json`
3. Test in preview: https://base.dev/preview

---

## Troubleshooting

### "Mini App not being indexed"

Common causes:
1. **Missing images**: All iconUrl, splashImageUrl, imageUrl must point to existing PNG files
2. **Invalid accountAssociation**: Must be obtained from base.dev verification
3. **CORS issues**: Ensure images are publicly accessible
4. **Invalid JSON**: Validate with JSONLint

### Verify your setup

```bash
# Check farcaster.json is accessible
curl -I https://YOUR_DOMAIN/.well-known/farcaster.json

# Should return:
# HTTP/2 200
# content-type: application/json
```

### Check image accessibility

```bash
# All these URLs must return 200:
curl -I https://YOUR_DOMAIN/icon.png
curl -I https://YOUR_DOMAIN/splash.png
curl -I https://YOUR_DOMAIN/og-image.png
```

---

## Checklist

### Images
- [ ] icon.png (256x256)
- [ ] icon-192.png (192x192)
- [ ] icon-512.png (512x512)
- [ ] splash.png (200x200)
- [ ] og-image.png (1200x630)
- [ ] hero.png (1200x630)
- [ ] screenshots/screenshot-1.png (1080x1920)
- [ ] screenshots/screenshot-2.png (1080x1920)
- [ ] screenshots/screenshot-3.png (1080x1920)

### Configuration
- [ ] Replaced `YOUR_DOMAIN` in `.well-known/farcaster.json`
- [ ] Replaced `YOUR_DOMAIN` in `minikit.config.ts`
- [ ] Replaced `YOUR_DOMAIN` in `index.html`
- [ ] Added real `accountAssociation` values from base.dev

### Validation
- [ ] farcaster.json valid JSON (JSONLint)
- [ ] All image URLs return 200
- [ ] `.well-known/farcaster.json` accessible via HTTPS
- [ ] Tested in base.dev/preview
