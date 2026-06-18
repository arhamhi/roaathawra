# Roaathawra

Marketing site for **Roaathawra**, made-to-order furniture, hand-built in Pakistan.
No cart, no checkout: visitors order by DM on Instagram or WhatsApp.

Recreated as a production static site from the Claude Design prototype
(`Roaathawra Home.dc.html` / `Roaathawra About.dc.html`). Plain HTML/CSS/JS,
with a small media import script for regenerating optimized catalog assets.

## Structure

```text
index.html        Home, hero video, featured carousel, full catalog, CTA
about.html        Brand story, values, team
assets/
  styles.css      Styling, design tokens, responsive rules
  app.js          Scroll reveal, catalog rendering, filters, page transition
  catalog.js      Generated product data from the Shopify CSV
  products/       Generated responsive WebP product images
  brand/          Generated responsive WebP brand/about images
  video/          Generated optimized MP4 videos and WebP posters
  favicon.svg     Brand mark
scripts/
  import-catalog.mjs  Parses CSV, downloads missing CSV images, optimizes media
robots.txt
```

## Regenerate product catalog and media

Source files live one directory above this repo:

- `../products_export_1.csv`
- `../Catalogue_Images/Images`

Run:

```bash
npm install
npm run import:catalog
```

This regenerates:

- all 43 product records in `assets/catalog.js`
- responsive WebP product images in `assets/products/`
- brand/about WebP images in `assets/brand/`
- optimized H.264 MP4 hero/footer videos and WebP posters in `assets/video/`

The temporary download cache is stored in `.cache/` and is ignored by git and Vercel.

## Local preview

It's static, so any static server works:

```bash
npm run serve
# or
python -m http.server 8000
```

Then open http://localhost:8000.

## Contact / order links

- Instagram: https://instagram.com/roaathawra
- Instagram DM: https://ig.me/m/roaathawra
- WhatsApp: +92 320 8572698
