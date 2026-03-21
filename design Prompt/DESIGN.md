# Design System Document

## 1. Overview & Creative North Star: "The Digital Curator"

This design system is built upon the essence of **Afro-Cinematic Minimalism**. Our Creative North Star is **"The Digital Curator"**—a philosophy that treats the screen not as a container for information, but as a high-end digital art gallery. 

We move away from the "busy" modular layouts of traditional music platforms and instead embrace **visual silence**. This is achieved through expansive negative space, intentional asymmetry, and a deep, atmospheric color palette. We reference the functional structure of the provided layout but transform it into a premium, editorial experience where every element has the room to breathe and the gravity of a cinematic masterpiece.

---

## 2. Colors

The palette is rooted in the depth of West African nights and the brilliance of heritage metals. It is designed to create a "glow-in-the-dark" effect where accents feel bioluminescent against a void-like background.

### Core Palette
- **Primary (Midnight Indigo - `#0B0C10`):** The foundation of our "visual silence." Use this for the deepest background layers.
- **Primary Accent (Oro Gold - `#D4AF37`):** To be used for high-importance moments and brand-defining signals.
- **Secondary (Warm Sand - `#F4EFEA` & Deep Plum - `#4A233C`):** Used for sophisticated tonal shifts in typography and background nesting.
- **Functional Accents (Electric Terracotta - `#E05236` & Bioluminescent Cyan - `#2DE2E6`):** Reserved for interactive states, call-to-actions, and sound visualizations.

### The "No-Line" Rule
Standard 1px borders are strictly prohibited for sectioning or card definition. Structural separation must be achieved through:
- **Tonal Shifts:** Placing a `surface-container-low` component against a `surface` background.
- **Generous Spacing:** Utilizing the `16` (5.5rem) and `20` (7rem) spacing tokens to create mental boundaries through distance.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of premium materials.
- **Base Layer:** `surface` (#121317).
- **Secondary Layers:** Use `surface-container-low` (#1a1b20) for large section transitions.
- **Interactive Layers:** Use `surface-container-high` (#292a2e) for cards or floating elements.
- **The Glass Rule:** For floating headers or overlays, use `surface-variant` at 60% opacity with a 20px backdrop blur to create a "frosted glass" depth that allows the deep indigos to bleed through.

---

## 3. Typography

The typographic system creates a tension between the classic and the modern, reflecting the "Afro-Cinematic" brand essence.

- **Display & Headlines (Newsreader/Playfair Style):** These are our "Editorial Voices." They should be used with generous leading and often placed asymmetrically to create a magazine-like feel. Use `display-lg` for hero statements to command authority.
- **UI & Body (Inter/Satoshi Style):** The "Functional Voice." Clean, geometric, and highly legible. Use `body-md` for general content and `label-sm` for metadata.
- **Hierarchy through Contrast:** Always pair a large, expressive serif headline with a much smaller, tracked-out sans-serif label to establish a high-end fashion/gallery aesthetic.

---

## 4. Elevation & Depth

We eschew traditional drop shadows for **Tonal Layering**.

- **The Layering Principle:** Depth is perceived by brightness. An element that is closer to the user should be a slightly lighter surface token (e.g., `surface-container-highest`) than the background beneath it.
- **Ambient Glows:** When a floating state is required, use a diffused shadow with an 8% opacity, tinted with the `primary` Oro Gold. This mimics the warm, natural bounce of light in a cinematic scene rather than a digital "drop shadow."
- **Ghost Borders:** If an edge must be defined for accessibility, use the `outline-variant` token at 15% opacity. It should be felt, not seen.
- **Sound Visualization:** Abandon traditional bars. Use "Fluid Threads"—thin, glowing paths (`tertiary` Bioluminescent Cyan) that undulate using Bezier curves to represent frequency, creating a living, organic presence.

---

## 5. Components

### Buttons
- **Primary:** `primary` (Oro Gold) fill with `on-primary` text. No border. Corners: `md` (0.375rem).
- **Secondary:** `surface-container-high` fill with a `tertiary` (Cyan) glow on hover.
- **Tertiary/Ghost:** No fill. `on-surface` text with an underline that expands from the center on hover.

### Cards & Lists
- **The "No Divider" Rule:** Forbid the use of lines between list items. Use `spacing-5` or `spacing-6` to separate items.
- **Layout:** Reference the "Hearing the Difference" section of the original layout, but remove the card boxes. Use the `surface-container-lowest` background for the entire section and let the items sit on the "void."

### Inputs
- **Style:** Bottom-border only (the "Ghost Border" at 20% opacity). On focus, the border transforms into a subtle `primary` (Gold) gradient glow.
- **Typography:** Labels use `label-md` in `on-surface-variant`.

### Audio Player (Signature Component)
- **Visual:** A full-width `surface-container-lowest` bar.
- **Progress:** Instead of a thick bar, use a single "Bioluminescent Cyan" thread.
- **Controls:** Minimalist icons. The "Play" state should trigger a subtle `surface-bright` ambient glow around the button.

---

## 6. Do's and Don'ts

### Do
- **Embrace Asymmetry:** Align a headline to the left but place the body copy in a narrow column on the right.
- **Use Visual Silence:** If a section feels "empty," leave it. That space is the "premium" feel.
- **Layer with Glass:** Use backdrop blurs to soften the transition between content sections.

### Don't
- **Don't use 100% Black:** Always use `Midnight Indigo` (#0B0C10) to maintain tonal depth.
- **Don't use Grids Rigidity:** Avoid "boxing" everything. Let images and text overlap slightly to create cinematic depth.
- **Don't use Harsh Lines:** Never use a 1px solid divider to separate content. Use a `surface` color shift or whitespace.
- **Don't Crowd the Content:** If a layout looks like the reference image, double the padding. The "YourGbedu" aesthetic requires significantly more breathing room than a standard landing page.

---
*End of Design System Document*