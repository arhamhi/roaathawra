# Design

## Overview

Roaathawra uses a warm, image-led luxury catalog system: full-bleed room video, restrained gold accents, cream paper surfaces, serif display type, and compact product metadata. The site is a brand surface first and a catalog second.

## Color

- Ink: deep warm brown, used for text and dark sections.
- Gold: saturated furniture-label yellow, used sparingly for announcements, CTAs, labels, and the floating DM button.
- Cream/paper: warm off-white surfaces, never pure white.
- Muted browns: supporting copy, metadata, dividers, and footer text.

Use tokens from `assets/styles.css`. Do not introduce one-off colors for new sections.

## Typography

- Display: Cormorant Garamond, inherited from the existing brand direction.
- Body: Hanken Grotesk.
- Labels use tracked uppercase sparingly.
- Body copy should stay under roughly 75 characters per line.

## Layout

- Hero and footer film are full-bleed media moments.
- Featured products use a horizontal rail to feel curated rather than exhaustive.
- Full catalog uses masonry columns for varied furniture proportions.
- Cards are used only for individual products; page sections remain unframed.

## Components

- Product card: responsive image, title, price, category, short description, DM and WhatsApp actions.
- Filter chips: tokenized outline pills with clear active state.
- Media frame: fixed aspect/height containers to prevent layout shift.
- CTA buttons: gold primary, outlined or restrained secondary.

## Motion

- Use scroll reveals, image zoom on hover, and page transition curtain.
- Respect `prefers-reduced-motion`.
- Animate transforms and opacity, not layout dimensions.

## Accessibility

- Images require descriptive alt text from catalog/title context.
- Videos must be muted, looped, inline, and backed by poster images.
- Focus indicators must remain visible.
- Mobile layouts must avoid horizontal page overflow.
