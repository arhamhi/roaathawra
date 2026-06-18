# Roaathawra

Marketing site for **Roaathawra** — made-to-order furniture, hand-built in Pakistan.
No cart, no checkout: visitors order by DM on Instagram or WhatsApp.

Recreated as a production static site from the Claude Design prototype
(`Roaathawra Home.dc.html` / `Roaathawra About.dc.html`). Plain HTML/CSS/JS,
no build step — deploys as static files.

## Structure

```
index.html        Home (hero, collection, about strip, how-to-order, CTA)
about.html        Brand story, values, team
assets/
  styles.css      All styling + design tokens + responsive rules
  app.js          Scroll reveal, collection filter, page-transition curtain
  favicon.svg     Brand mark
robots.txt
```

## Local preview

It's static, so any static server works:

```bash
npx serve .
# or
python -m http.server 8000
```

Then open http://localhost:8000.

## ⚠️ Add real photos before launch

The design uses image placeholders (`<image-slot>` in the prototype). No product
photography shipped with the bundle, so each slot renders an elegant captioned
placeholder. To drop in a real photo, add a background image to the matching
`.img-slot` (identified by its `data-slot`) and the caption hides automatically:

```html
<div class="img-slot" data-slot="rt-hero"
     style="background-image:url('assets/img/hero.jpg')"> ... </div>
```

Slots to fill:

| `data-slot`       | Page  | What goes here                |
|-------------------|-------|-------------------------------|
| `rt-hero`         | Home  | Hero room photo               |
| `rt-canopy`       | Home  | Arya's Princess Canopy Bed    |
| `rt-blue`         | Home  | Blue Velveteen Two-Seater     |
| `rt-dining`       | Home  | Black Antique Dining Set      |
| `rt-bunk`         | Home  | Cubic Bunk Bed                |
| `rt-floral`       | Home  | Desenli Floral Sofa           |
| `rt-egypt`        | Home  | Egypt Dining Table            |
| `rt-about`        | Home  | Founder / workshop photo      |
| `rt-about-hero`   | About | Founder portrait / workshop   |
| `rt-about-team`   | About | Workshop team photo           |

## Contact / order links

- Instagram: https://instagram.com/roaathawra
- Instagram DM: https://ig.me/m/roaathawra
- WhatsApp: +92 320 8572698
