# YourGbedu Brand Asset Guide

This guide is the source of truth for generating a corrected logo set and visual brand assets for the current YourGbedu application.

The current app UI is the anchor. The product should feel like a warm editorial music gallery: personal, crafted, premium, emotional, cultural, and easy to move through. New logo and visual assets must adapt to this system instead of pulling the app into a dark cinematic rebrand.

## Current Status

The files currently in `public/brand/` are provisional implementation placeholders. They are useful for wiring the application surfaces, but they are not canonical brand assets.

Use this document to generate a better production-ready logo set, then replace the placeholder files under `public/brand/` with final exports that preserve the same filenames and intended usage.

## Brand Position

YourGbedu turns personal stories into finished custom songs. The visual identity should make customers feel that real creative work is happening on their behalf.

Brand qualities:

- Personal, not corporate.
- Crafted, not generic.
- Premium, but still warm and approachable.
- Cultural and musical, without becoming decorative noise.
- Emotional and intimate, without becoming sentimental or soft to the point of losing confidence.
- Editorial and gallery-like, not startup SaaS, nightclub, or luxury fashion pastiche.

Recommended short brand line for visual exploration:

> Cinematic sounds. Cultural stories.

Do not let "cinematic" mean black backgrounds, neon glow, lens-flare-heavy marks, or purple-blue sci-fi styling. In this product, cinematic means polished, composed, memorable, and emotionally framed.

## Current Visual System

### Overall Direction

The app currently uses a warm "Sun-Drenched Gallery" direction:

- Ivory and cream backgrounds.
- Deep ink text.
- Terracotta actions and emotional emphasis.
- Mustard/gold as the premium music signal.
- Sage for calm, completion, reassurance, and support states.
- Editorial serif headlines paired with clean sans-serif UI text.
- Generous whitespace, asymmetry, tonal bands, and restrained depth.

The logo should look natural on this warm editorial system.

### Typography

Current application fonts:

- Display/headline: `Cormorant Garamond`, fallback `Georgia`, serif.
- Body/UI/labels: `DM Sans`, fallback `Inter`, sans-serif.

Typography behavior:

- Large display copy uses an editorial serif with refined, expressive rhythm.
- Body copy is clean, direct, and readable.
- Labels use uppercase `DM Sans` with letter spacing.
- Large headline letter spacing should stay `0`.
- Tracked uppercase labels should be used sparingly and intentionally.

Logo typography guidance:

- A wordmark may use an elegant editorial serif, but it should not feel fragile at small sizes.
- Avoid hairline serifs that disappear in the header.
- Avoid overly ornate swashes, decorative ligatures, or wedding-invitation styling.
- If a custom wordmark is made, its weight should hold up at roughly `150-220px` wide.
- The wordmark must remain readable in email clients and mobile headers.

## Color System

Use these values when generating logo and visual assets. They are taken from the current app design notes and implementation tokens.

### Core Surfaces

| Token | Hex | Usage |
| --- | --- | --- |
| Ivory | `#FAF6EE` | Main app canvas and page background |
| Cream | `#FFFDF6` | Bright surface, cards, footer contrast text background alternative |
| Warm surface | `#F5EDE2` | Tonal container and secondary background |
| Elevated warm surface | `#EFE5D6` | Higher-emphasis container |
| Pure white | `#FFFFFF` | Avoid as a dominant brand background; only use when needed for platform export constraints |

Logo implication:

- Primary logo exports should work on `#FAF6EE` and `#FFFDF6`.
- Do not generate primary lockups on pure white if the final app surface is ivory.
- If the generator supports it, use a subtle ivory paper background only for presentation boards, not transparent production assets.

### Text And Ink

| Token | Hex | Usage |
| --- | --- | --- |
| Ink | `#1F1B14` | Main text, primary CTA fill, deep brand anchor |
| Ink soft | `#5A4F3F` | Body copy and secondary text |
| Ink muted | `#8B7F6C` | Muted labels, metadata, quiet captions |

Logo implication:

- The most reliable dark single-color logo should use `#1F1B14`.
- Use `#5A4F3F` only for secondary details, not primary logo strokes.
- Fine icon strokes should not be lighter than `#5A4F3F` on ivory backgrounds.

### Terracotta

| Token | Hex | Usage |
| --- | --- | --- |
| Terracotta | `#943B2F` | Primary emotional accent, active nav, action hover |
| Terracotta dark | `#8B3E22` | Darker emphasis and strong warm contrast |
| Terracotta soft | `#E8B89E` | Soft accent on dark or warm surfaces |
| Terracotta pale | `#F7E5DA` | Selected states and gentle warm containers |

Logo implication:

- Terracotta can support the logo, especially in inner details or subtle wordmark warmth.
- Do not make terracotta the only brand color if the result starts to look like a restaurant, spa, or wedding brand.
- Terracotta should feel emotional and human, not rusty or muddy.

### Mustard And Gold

| Token | Hex | Usage |
| --- | --- | --- |
| Mustard | `#D8B253` | Premium music signal, play buttons, highlight moments |
| Mustard soft | `#F0DCA8` | Soft highlight, dark-surface accent |
| Mustard pale | `#FBF0CF` | Warm highlight container |

Logo implication:

- Gold/mustard is the best primary accent for the musical mark.
- Use warm brushed gold, antique gold, or muted brass behavior.
- Avoid chrome gold, neon yellow, bright orange, or overly metallic 3D rendering.
- Gold should still work when flattened to a single-color mark.

### Sage

| Token | Hex | Usage |
| --- | --- | --- |
| Sage | `#7C8B5C` | Support tone, calm status, secondary brand warmth |
| Sage dark | `#5D6A42` | Completion email header and grounded green state |
| Sage soft | `#C9D2B0` | Soft support accent |
| Sage pale | `#EEF2E2` | Quiet success/support backgrounds |

Logo implication:

- Sage should generally not be part of the main logo.
- It can appear in supporting visual assets, badges, status graphics, or background systems.

### Lines And Borders

| Token | Hex | Usage |
| --- | --- | --- |
| Line | `#E5DDD0` | Subtle borders and separators |
| Line strong | `#C7BDA8` | Stronger borders, quiet outlines |

Logo implication:

- Avoid relying on line colors for logo detail. These are too low-contrast for primary marks.
- Logo details must be stronger than the border colors.

## Logo Direction

### What The Logo Should Feel Like

The logo should feel:

- Premium, but not cold.
- Musical, but not obvious clip art.
- Cultural, but not stereotyped.
- Intimate, but not fragile.
- Editorial, but still practical in an app header.
- Warm and luminous, but not glowing or neon.

Good visual references:

- Vinyl grooves.
- Sound waves.
- Record label seals.
- Warm brass or antique gold.
- Editorial serif wordmarks.
- Subtle rhythmic circular forms.
- Handcrafted music-gallery sensibility.

Risky visual references:

- Black-background luxury logo boards.
- Purple neon audio tunnels.
- Nightclub/DJ identities.
- Heavy 3D rendered gold.
- Thin concentric rings that collapse at favicon size.
- Generic music-note icons.
- Overly literal microphones, headphones, equalizers, or speakers.

### Recommended Color Behavior

Primary logo:

- Icon mark: warm gold/mustard plus deep ink or restrained terracotta.
- Wordmark: deep ink, terracotta-dark, or a controlled ink-to-gold pairing.
- Background: transparent for production assets, previewed on ivory or cream.

Single-color dark logo:

- Use `#1F1B14`.
- Must work on ivory, cream, pale mustard, and pale terracotta surfaces.

Single-color light logo:

- Use `#FFFDF6` or `#F0DCA8`.
- Must work on ink, terracotta, sage-dark, and dark image overlays.

Optional plum:

- Plum is not currently an app token. If used, keep it restrained and close to oxblood/burgundy rather than violet.
- Plum should never become a large surface color.
- Plum should not introduce purple glow, blue-violet lighting, or a dark cinematic palette.

### Mark Construction Guidance

The icon-only mark must be readable at small sizes. This is the main failure mode to watch.

Requirements:

- Readable at `40-44px` in the app header.
- Recognizable at `32px` favicon size.
- Still coherent in a single-color version.
- Not dependent on tiny internal rings, glow, gradients, shadows, or photographic texture.
- Balanced inside a square icon area with comfortable clear space.
- No fine strokes below roughly `2px` in a `128px` SVG viewBox.

If using a circular/music-groove concept:

- Reduce the number of rings.
- Vary stroke weight intentionally.
- Keep the center shape clear.
- Make the outer silhouette distinctive.
- Avoid making every ring equally thin.
- Test the mark at `16px`, `32px`, `44px`, and `96px`.

### Wordmark Guidance

The wordmark should:

- Read as `YourGbedu` with no ambiguity.
- Preserve the capital `Y` and `G`.
- Feel editorial and premium, but clear.
- Have enough weight for small header usage.
- Work beside the icon and independently.

Avoid:

- Thin gold-only wordmarks on ivory.
- Overly tight letter spacing.
- Decorative swashes that reduce readability.
- Split-color wordmarks where the color shift makes the brand name feel like two unrelated words.
- Wordmarks that only work at giant presentation-board scale.

## Required Asset Contract

Final assets should replace the current placeholder files under `public/brand/`.

| File | Required format | Background | Purpose |
| --- | --- | --- | --- |
| `logo-full.svg` | SVG | Transparent | Full horizontal lockup for brand pages, previews, and future layouts |
| `logo-icon.svg` | SVG | Transparent preferred | Primary detailed orb mark for large social, graphics, and video use |
| `logo-icon-small.svg` | SVG | Transparent preferred | Simplified orb mark for favicon, profile, app icon, mobile header, and admin icon use |
| `logo-stacked.svg` | SVG | Transparent | Centered lockup for cover photos, presentations, and video end cards |
| `logo-wordmark.svg` | SVG | Transparent | Wordmark or compact lockup for email/image conversion |
| `logo-mono-dark.svg` | SVG | Transparent | Single-color dark logo for light surfaces |
| `logo-mono-light.svg` | SVG | Transparent | Single-color light logo for dark surfaces |
| `favicon-32.png` | PNG | Opaque or transparent | Browser favicon, must read at `32px` |
| `favicon-192.png` | PNG | Opaque or transparent | Android/PWA icon |
| `favicon-512.png` | PNG | Opaque or transparent | Large app icon source |
| `apple-touch-icon.png` | PNG | Opaque recommended | iOS home screen icon |
| `social-preview.png` | PNG | Opaque | Social share image at `1200x630` |
| `logo-wordmark.png` | PNG | Transparent or dark-safe | Email-safe image, legible at `220px` wide |

Minimum practical sizes:

- Header icon: must read at `40-44px`.
- Favicon: must read at `32px`, with a simplified shape if needed.
- Email logo: must be legible at `220px` wide.
- Social preview: `1200x630`.
- Full lockup SVG: should scale cleanly from roughly `180px` to `900px` wide.

Export requirements:

- SVGs should use real vector shapes or outlined type where licensing permits.
- PNGs should be exported from final SVG/vector masters.
- Avoid embedded raster effects in SVGs.
- Avoid filter-heavy SVGs that render inconsistently in browsers or email tooling.
- Provide transparent production assets, plus separate presentation boards if desired.
- Keep filenames exactly as listed above unless the app implementation is updated intentionally.

## App Placement Requirements

Current brand surfaces:

- Fixed app header.
- Footer on ink background.
- Admin login and workbench.
- Browser favicon and app icons.
- Open Graph and Twitter preview image.
- Email headers.

Responsive behavior:

- Phone and tablet header currently use icon-only branding to protect navigation and CTA spacing.
- Large desktop can use the full lockup.
- Footer should use a light or warm monochrome logo on ink.
- Email should use a logo image plus text fallback.

Design implication:

- The icon-only mark is not secondary. It must be strong enough to represent the brand by itself.
- The full lockup should not be the only polished asset.

## Prompt-Ready Logo Brief

Use this prompt when generating logo directions:

```text
Create a premium logo system for YourGbedu, a service that turns personal stories into finished custom songs. The brand should feel like a warm editorial music gallery: personal, crafted, intimate, cultural, musical, and premium.

Use a warm ivory and cream design context, not a black cinematic background. The logo must work on #FAF6EE and #FFFDF6 surfaces. Use deep ink #1F1B14, warm terracotta #943B2F or #8B3E22, and refined muted gold/mustard #D8B253 as the main palette. Optional restrained burgundy/plum is allowed only as a small detail, not as purple neon or glow.

Explore a refined musical mark inspired by vinyl grooves, sound waves, record-label seals, or circular rhythm. The mark must remain readable at 40px in an app header and at 32px as a favicon. Avoid tiny unreadable rings, generic music notes, microphones, headphones, speakers, heavy 3D gold, neon effects, and black-background luxury-logo styling.

Create a horizontal lockup, icon-only mark, single-color dark version, single-color light version, favicon-safe simplified icon, and social-preview composition. The wordmark should read clearly as YourGbedu, feel editorial and premium, and remain legible at small UI sizes.
```

Negative prompt:

```text
Do not use black-background neon cinematic styling, purple glow, blue-violet lighting, nightclub/DJ aesthetics, generic music note icons, microphones, headphones, speaker icons, overly thin concentric rings, unreadable hairline typography, chrome 3D gold, pure white app backgrounds, or decorative wedding-script typography.
```

## Prompt-Ready Visual Asset Brief

Use this prompt for brand visuals beyond the logo:

```text
Create warm editorial visual assets for YourGbedu, a custom-song service. The app uses ivory #FAF6EE, cream #FFFDF6, deep ink #1F1B14, terracotta #943B2F, mustard gold #D8B253, and sage #7C8B5C. Visuals should feel crafted, personal, premium, cultural, and music-focused.

Prefer warm natural light, tactile paper or album-gallery feeling, subtle music production details, record textures, listening-room cues, and refined portrait/editorial composition. Keep the tone human and intimate. Avoid dark club lighting, neon purple glow, generic stock music imagery, excessive gradients, and overly glossy 3D effects.
```

## Review Checklist For New Logo Assets

Before replacing `public/brand/`, review every candidate against this checklist.

### Brand Fit

- Feels warm, editorial, crafted, and premium.
- Looks native on ivory and cream surfaces.
- Does not force a dark rebrand.
- Does not rely on neon, glow, or heavy 3D effects.
- Feels musical without using generic music symbols.

### Color

- Uses current app colors or close compatible values.
- Works in full color, single-color dark, and single-color light.
- Gold is muted and warm, not bright yellow or chrome.
- Optional plum/burgundy does not become purple-violet.
- Contrast is strong enough on `#FAF6EE`, `#FFFDF6`, and `#1F1B14`.

### Small-Size Legibility

- Icon reads at `44px`.
- Favicon reads at `32px`.
- Wordmark reads at `220px` wide.
- Thin strokes do not disappear.
- The mark remains recognizable without gradients.

### Export Quality

- SVGs are clean vector files.
- PNGs are exported at the required sizes.
- Transparent assets have no unintended background matte.
- Social preview is exactly `1200x630`.
- Email wordmark is clear at `220px` wide.
- File names match the asset contract.

### App Compatibility

- Header icon does not visually overpower the nav.
- Desktop full lockup does not become too wide.
- Footer version works on ink.
- Email version works when images are loaded, with text fallback still acceptable when blocked.
- Social preview looks like the current app, not a separate brand.

## Replacement Workflow

1. Generate or design the full logo system using this guide.
2. Export every required asset using the exact filenames in the asset contract.
3. Replace files under `public/brand/`.
4. Run the app locally and check header, footer, admin, favicon, social preview, and email asset paths.
5. Test at phone, tablet, and desktop widths.
6. Only adjust application layout if the final logo still fails at required sizes after correct exports.

## Implementation Notes For Developers

- Do not treat logo presentation boards as production assets.
- Do not crop a full brand board to create favicons or headers.
- Production logo files should be isolated lockups on transparent backgrounds.
- Keep the app UI warm editorial unless a separate brand refresh is approved.
- If the final logo introduces new colors, add them deliberately as brand tokens instead of hardcoding them only inside SVGs.
