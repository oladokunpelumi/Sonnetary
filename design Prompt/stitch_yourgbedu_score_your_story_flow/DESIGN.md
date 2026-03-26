# Design System Strategy: The Sun-Drenched Gallery

## 1. Overview & Creative North Star

The Creative North Star for this design system is **"The Digital Curator."**

We are moving away from the utilitarian, boxy structures of standard SaaS and toward the felt experience of a high-end royal invitation or a sun-drenched art gallery. The "Solemn" aspect is found in our generous use of white space and heavy editorial type; the "Playful" emerges through vibrant Terracotta and Cyan accents; the "Royal" is cemented by our Ember Gold canvas.

To break the "template" look, designers must embrace **intentional asymmetry**. Hero sections should not be perfectly centered; instead, use overlapping elements where typography bleeds over image containers, and utilize the spacing scale to create rhythmic, non-linear layouts that feel "composed" rather than "gridded."

---

## 2. Colors: Tonal Majesty

Our palette is anchored by the warmth of Ember Gold, but its premium feel is maintained through high-contrast Obsidian and sophisticated nesting.

### Primary Palette & Roles

- **Canvas (Surface):** `#fff8f0` (A creamy, sun-bleached gold). This is your primary stage.
- **The Obsidian Contrast:** Use `on-surface` (`#241a00`) and `primary` (`#5e5e63`) for text. This ensures the "Solemn" authority of the brand.
- **Royal Accents:** Use `secondary` (Terracotta `#9f402d`) for soulful warmth and `tertiary` (Cyan `#006a6a`) for sharp, playful highlights.

### The "No-Line" Rule

**Explicit Instruction:** Do not use 1px solid borders to section content. Boundaries must be defined solely through background color shifts.

- Use `surface-container-low` (`#fff2d8`) to define a soft section change.
- Use `surface-container-highest` (`#ffe088`) for high-priority callouts.

### Glass & Gradient Strategy

Flat color is the enemy of premium design.

- **CTAs:** Use a subtle linear gradient from `primary` to `primary-container` to give buttons a "weighted" feel.
- **Floating Elements:** Use `surface-bright` at 80% opacity with a `backdrop-blur` of 12px. This allows the Ember Gold canvas to glow through the UI, creating an ethereal, gallery-like depth.

---

## 3. Typography: Editorial Authority

The typography is the "Voice" of the system. We pair the intellectual weight of a Serif with the modern efficiency of a Sans-Serif.

- **Display & Headlines (Newsreader):** Use large scales (`display-lg` at 3.5rem) with tighter letter-spacing (-0.02em). These should feel like headers in a luxury magazine. Use `headline-md` for storytelling moments.
- **Body & UI (Manrope/Plus Jakarta Sans):** These sans-serifs provide the "Playful" counter-balance. They are clean, highly legible, and should be used with generous line-height (1.6) to ensure the layout "breathes."
- **Hierarchy Note:** High-contrast color (Obsidian) is reserved for Display and Headline levels to anchor the eye.

---

## 4. Elevation & Depth: Tonal Layering

Traditional drop shadows are too "software-heavy" for this aesthetic. We use **Tonal Layering**.

- **The Layering Principle:** Stack `surface-container-lowest` cards on top of a `surface-container-low` background. This creates a natural "lift" based on color value rather than artificial shadows.
- **Ambient Shadows:** If an element must float (e.g., a modal), use a shadow tinted with the `on-surface` color: `rgba(36, 26, 0, 0.06)` with a 40px blur and 10px offset. It should look like a soft glow, not a dark smudge.
- **The Ghost Border:** If accessibility requires a stroke, use `outline-variant` at 15% opacity. If it's 100% opaque, it’s wrong.

---

## 5. Components: The Curated Set

### Buttons (The Royal Seal)

- **Primary:** `primary` background with `on-primary` text. Use `xl` (0.75rem) roundedness. No borders.
- **Secondary:** `surface-container-highest` background. This feels like a subtle indentation in the page.
- **Tertiary:** Text-only in `secondary` (Terracotta), using `label-md` for a sophisticated, small-caps feel.

### Cards & Lists

- **The "No Divider" Rule:** Never use a horizontal line to separate list items. Use `spacing-5` (1.7rem) of vertical white space or a subtle shift to `surface-container-low`.
- **Card Styling:** Use `md` (0.375rem) roundedness. Cards should feel like heavy cardstock, not plastic.

### Input Fields

- **Text Inputs:** Use a `surface-container-lowest` fill. The "label" should always use `label-sm` in `on-surface-variant` for a minimalist, architectural look.
- **State:** On focus, transition the background to `surface-bright` and add a "Ghost Border" of `tertiary`.

### Signature Component: The "Editorial Plinth"

A bespoke component for this system: A `surface-container-highest` block that sits asymmetrically behind an image or text block, creating a "layered paper" effect that mimics a physical gallery display.

---

## 6. Do’s and Don’ts

### Do:

- **Use Asymmetry:** Place images off-center. Let a headline hang over the edge of a container.
- **Embrace the Gold:** Treat `#fff8f0` as your white. Pure `#ffffff` should only be used for the most elevated surfaces (`surface-container-lowest`).
- **Vary Type Weights:** Mix `display-lg` (Newsreader) with `label-md` (Plus Jakarta Sans) in close proximity to create visual tension.

### Don't:

- **Don't Use Heavy Borders:** Solid borders break the "Invitation" feel. Let color and space do the work.
- **Don't Overuse Cyan:** The Cyan (`tertiary`) is a "spark." Use it for small icons, active states, or tiny data points—never for large backgrounds.
- **Don't Crowd the Canvas:** If it feels full, add more space. A "Royal" experience is never rushed or cramped.
