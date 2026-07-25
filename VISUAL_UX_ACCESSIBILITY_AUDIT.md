# YourGbedu Visual, UX, and Accessibility Audit

Audit date: 2026-07-12  
Standard: WCAG 2.2 Level AA  
Mode: Brutal, evidence-led review  
Product direction: `DESIGN.md` ("warm editorial music gallery")

## Executive verdict

YourGbedu has a credible visual idea but an undisciplined implementation. The warm ivory, deep ink, terracotta, and editorial serif can feel personal and premium. The strongest moments are the large Cormorant headlines, the restrained photographic palette, the clear primary actions, and the language around craft and delivery. The product does not look generic at first glance.

The system falls apart under repetition. Nearly every section becomes a rounded cream card, nearly every command becomes an uppercase pill, and nearly every secondary fact becomes low-contrast muted text. Mustard, sage, terracotta, ink, red, and translucent cream are used as both semantic colors and decoration. The result is warm, but not consistently editorial; it often reads like a component library wearing an editorial font.

The biggest practical problem is accessibility debt embedded in the tokens and shared components. The default muted text fails normal-text contrast. Interactive borders fail non-text contrast. The global focus color fails on ink controls. Several sign-in fields do not have programmatic labels. SPA route changes are not announced or retitled. The custom waveform is not a keyboard-equivalent seek control. These are system failures, not isolated polish issues.

The conversion experience also fights itself. A fixed player, optional cookie banner, and a modal discount offer can compete for the same viewport. The 50% discount popup appears after ten seconds, which undercuts the premium, crafted positioning before the visitor has had time to understand the product. The interface says "bespoke creative work" while the promotion says "commodity with a huge markup."

### Scores

| Area | Score | Brutal assessment |
| --- | ---: | --- |
| Visual system | 6.5/10 | Strong raw palette and typography; weak token discipline and excessive card/pill repetition. |
| Brand coherence | 7.0/10 | Recognizable and emotionally appropriate, but discounting and UI chrome dilute the premium promise. |
| UX | 5.8/10 | Main journey is understandable; interruption, status, form recovery, and route feedback need structural work. |
| Mobile UX | 5.2/10 | Touch sizes are often reasonable, but fixed layers, dense header actions, and large type create predictable pressure. Fresh viewport verification was blocked. |
| Accessibility | 4.2/10 | Multiple source-confirmed WCAG AA failures in contrast, names, keyboard operation, focus, and status communication. |
| Conversion confidence | 5.5/10 | Strong emotional proposition; trust is weakened by aggressive discounting and competing calls to action. |

No `P0 Blocker` was found in the source review. There are nine accessibility `P1 Critical` issues that should block a claim of WCAG 2.2 AA conformance, plus two `P1` UX/conversion issues.

## Evidence and confidence

### Completed

- Read the complete route and shared-component implementation.
- Checked the current design doctrine in `DESIGN.md` and the Tailwind/CSS tokens.
- Calculated contrast ratios from the exact sRGB token values.
- Reviewed semantic HTML, accessible names, focus logic, keyboard handlers, loading/error states, responsive classes, fixed positioning, and motion handling.
- Ran `npm run build`: passed with 1,780 modules transformed.
- Ran `npm run lint`: failed with 3 errors and 5 warnings. The Track Order modal hook error is relevant to its Escape/focus behavior; the analytics and unused server warnings are not visual-audit findings.

### Not completed

Chrome did not expose its remote-debugging endpoint after two 30-second connection attempts. Therefore this report does **not** claim fresh rendered verification at `360x800`, `768x1024`, `1440x900`, mobile landscape, 200% zoom, reduced motion, or increased text spacing. Findings that depend on layout behavior are marked **source-derived / render verification required**. Interactive admin workbench states were also not authenticated.

This limitation does not weaken source-confirmed contrast, naming, semantics, keyboard logic, or state-announcement findings.

## Severity model

- **P0 Blocker:** prevents task completion, payment, authentication, or access for a broad audience.
- **P1 Critical:** WCAG AA failure, serious conversion damage, or shared-system defect affecting multiple routes.
- **P2 Major:** material usability, hierarchy, consistency, or maintainability problem.
- **P3 Polish:** localized refinement with limited task impact.

## Objective accessibility findings

### P1 A11Y-01: The muted text token fails normal-text contrast across the product

- **Affected:** all routes; labels, metadata, timestamps, filter text, order IDs, progress labels, helper copy, footer-adjacent details.
- **Observed:** `#8B7F6C` is used as `text-ink-muted` on both ivory and cream.
- **Evidence:** contrast is `3.64:1` on `#FAF6EE` and `3.86:1` on `#FFFDF6`. WCAG AA requires `4.5:1` for normal text. Typical uses are 11-12px uppercase labels, making the failure more consequential.
- **Sources:** `index.css:19`; `pages/OrderStatus.tsx:207`, `250`, `270`, `278`, `296`, `339`, `372`; `pages/PaymentSuccess.tsx:213`; `components/EmailCapturePopup.tsx:282`, `299`, `348`; `pages/Admin.tsx:537`, `551`, `572`.
- **Impact:** low-vision users and users on dim, washed-out, or sunlit screens lose supporting information. The small uppercase treatment compounds the problem.
- **Recommendation:** replace body/label use with a new accessible muted token such as `#6F6250` (`5.51:1` on ivory, `5.83:1` on cream). Retain the current muted color only for nonessential decoration.
- **Effort:** medium; token change is quick, but every use must be checked for intended hierarchy.

### P1 A11Y-02: Input and control boundaries fail non-text contrast

- **Affected:** forms, filters, cards acting as controls, player controls, admin controls, modals.
- **Observed:** `line` (`#E5DDD0`) and `line-strong` (`#C7BDA8`) are the default boundaries against ivory/cream.
- **Evidence:** `line` is about `1.25:1` against ivory; `line-strong` is about `1.73:1`. A `line-strong/65` treatment falls to roughly `1.41:1`. WCAG 1.4.11 requires `3:1` for visual information needed to identify controls and states.
- **Sources:** `index.css:20-21`; form classes in `pages/CreateSong.tsx:94`, `pages/Admin.tsx:86`, `components/TrackOrderModal.tsx:216`, `components/EmailCapturePopup.tsx:333`; filters in `pages/Library.tsx:68-82`.
- **Impact:** fields and unselected controls can disappear into their surfaces. This is especially risky for cognitive, low-vision, and touch users scanning long forms.
- **Recommendation:** split decorative and functional borders. Keep `line` for section rhythm; add a `control-border` no lighter than `#8B7F6C` (`3.64:1` on ivory) and use it for inputs, checkable cards, icon buttons, and selected/unselected control states.
- **Effort:** medium.

### P1 A11Y-03: The custom waveform seek control is not keyboard-equivalent

- **Affected:** persistent player on tablet/desktop.
- **Observed:** the waveform is a button whose position is derived from pointer `clientX`. It has no current value, minimum, maximum, or keyboard increment behavior.
- **Evidence:** `components/PersistentPlayer.tsx:141-162`. Enter or Space activation does not provide a meaningful seek position and may calculate from `clientX = 0`. The visual bars are hidden from accessibility APIs.
- **WCAG:** 2.1.1 Keyboard; 4.1.2 Name, Role, Value.
- **Impact:** keyboard and screen-reader users cannot seek with equivalent precision or understand playback position.
- **Recommendation:** use a native `input type="range"` styled as the waveform, or place an invisible semantic range over the visual waveform. Expose elapsed/total time and support arrow-key increments.
- **Effort:** medium.

### P1 A11Y-04: Authentication fields lack programmatic labels

- **Affected:** order-tracking sign-in and admin login.
- **Observed:** the order email input has only a placeholder. Admin visually renders `label` elements, but they are not associated with inputs through `htmlFor`/`id` and do not wrap the inputs.
- **Evidence:** `pages/OrderStatus.tsx:153-161`; `pages/Admin.tsx:537-562`.
- **WCAG:** 1.3.1 Info and Relationships; 3.3.2 Labels or Instructions; 4.1.2 Name, Role, Value.
- **Impact:** a screen reader may announce an unnamed edit field after placeholder behavior changes; voice-control users cannot reliably target the field by label.
- **Recommendation:** add persistent visible labels, matching `htmlFor`/`id`, `autoComplete="email"` where applicable, and retain placeholders only as examples.
- **Effort:** small.

### P1 A11Y-05: SPA navigation does not update page title or move/announce focus

- **Affected:** every hash route.
- **Observed:** the document title is static, route changes only scroll to the top, and the Suspense fallback is an empty visual block.
- **Evidence:** `index.html:6`; `App.tsx:49-62`, `244-286`. No `document.title`, route announcer, or heading focus management exists.
- **WCAG:** 2.4.2 Page Titled; 2.4.3 Focus Order; 4.1.3 Status Messages.
- **Impact:** screen-reader users may not know navigation occurred or which screen opened. Keyboard focus can fall back to the document body after the activating link disappears.
- **Recommendation:** add a route metadata map, update `document.title`, focus the route `h1` or main landmark with `tabIndex={-1}`, and provide a polite route announcement. Give lazy loading a named `role="status"` fallback.
- **Effort:** medium.

### P1 A11Y-06: The mobile navigation behaves visually like a modal but not semantically

- **Affected:** mobile header/menu.
- **Observed:** opening the full-viewport menu locks body scroll and supports Escape, but it does not trap focus, make the rest of the page inert, restore focus explicitly, or declare dialog semantics.
- **Evidence:** `components/Header.tsx:32-48`, `129-180`.
- **WCAG:** 2.4.3 Focus Order; 2.4.11 Focus Not Obscured; 4.1.2 Name, Role, Value.
- **Impact:** keyboard users can tab behind an apparently modal layer into hidden page content. Screen-reader users receive no boundary for the open navigation.
- **Recommendation:** either implement it as a true modal navigation with focus containment, inert background, and focus restoration, or render it as a nonmodal disclosure that does not cover the viewport.
- **Effort:** medium.
- **Confidence:** source-confirmed logic; render verification required for exact tab sequence.

### P1 A11Y-07: The dark-surface focus indicator fails contrast

- **Affected:** ink buttons, player, dark bands, footer links, dark relationship cards.
- **Observed:** global focus uses terracotta, but terracotta against ink is only `2.39:1`. The corrective selector targets descendants of `.bg-ink`/`.text-cream`, not elements that themselves carry those classes.
- **Evidence:** `index.css:128-139`; many CTAs use `bg-ink` on the focused element, for example `components/Header.tsx:93-98` and `components/PersistentPlayer.tsx:35-41`.
- **WCAG:** 1.4.11 Non-text Contrast; 2.4.7 Focus Visible; 2.4.11 Focus Not Obscured.
- **Impact:** keyboard users can lose the active control on the most important dark CTAs.
- **Recommendation:** use `:where(.bg-ink, .text-cream):focus-visible` in addition to descendant selectors, and use cream or mustard-soft on ink (`12.66:1` for mustard-soft).
- **Effort:** small.

### P1 A11Y-08: Form errors are frequently neither announced nor associated with fields

- **Affected:** track-order modal, email offer, order sign-in, admin login; partly create and checkout.
- **Observed:** errors are visually rendered as adjacent red text but often lack `role="alert"`, `aria-live`, `aria-invalid`, and `aria-describedby`. Focus remains on the submit button or current field.
- **Evidence:** `components/TrackOrderModal.tsx:237-239`; `components/EmailCapturePopup.tsx:335`; `pages/OrderStatus.tsx:162-164`; `pages/Admin.tsx:531-535`. Create and checkout use `role="alert"` but do not associate the alert with the invalid field.
- **WCAG:** 3.3.1 Error Identification; 3.3.3 Error Suggestion; 4.1.3 Status Messages.
- **Impact:** screen-reader users may not hear why submission failed. Users must visually search a long form for the problem.
- **Recommendation:** provide stable error IDs, set `aria-invalid`, connect help/error text with `aria-describedby`, announce form-level errors, and focus the first invalid field after submission.
- **Effort:** medium.

### P1 A11Y-09: FAQ disclosure state and visibility are not exposed correctly

- **Affected:** homepage FAQ.
- **Observed:** accordion buttons have no `aria-expanded` or `aria-controls`. Collapsed answers remain in the accessibility tree because they are visually hidden only with max-height and opacity.
- **Evidence:** `components/FAQ.tsx:54-72`.
- **WCAG:** 1.3.1 Info and Relationships; 4.1.2 Name, Role, Value.
- **Impact:** screen-reader users can encounter answers that appear collapsed and cannot determine which question is open.
- **Recommendation:** give each button and panel stable IDs, set `aria-expanded`/`aria-controls`, and apply `hidden` when collapsed. Avoid a heading element inside a button; use a styled span and preserve heading structure outside the control if needed.
- **Effort:** small.

### P2 A11Y-10: Close controls miss the WCAG 2.2 minimum target size

- **Affected:** track-order and email-offer dialogs.
- **Observed:** each close button contains a 20x20 icon and has no padding or minimum dimensions.
- **Evidence:** `components/TrackOrderModal.tsx:162-168`; `components/EmailCapturePopup.tsx:261-267`.
- **WCAG:** 2.5.8 Target Size (Minimum), 24x24 CSS pixels unless an exception applies.
- **Impact:** difficult touch target, especially at the top corner on small phones.
- **Recommendation:** enforce at least 44x44 for comfortable touch use, with the same visual icon size.
- **Effort:** small.

### P2 A11Y-11: Loading, success, and async state changes are inconsistently announced

- **Affected:** order loading/sign-in, payment verification, magic-link verification, player lock, admin actions, email offer.
- **Observed:** many state changes replace text or spinners without a live region. Some screens have `role="status"`, but verification and authentication states do not.
- **Evidence:** `pages/OrderStatus.tsx:116-125`, `pages/Verify.tsx:46-66`, `pages/PaymentSuccess.tsx:157-185`, `components/EmailCapturePopup.tsx:269-343`.
- **WCAG:** 4.1.3 Status Messages.
- **Recommendation:** use restrained `role="status"`/`aria-live="polite"` for progress and success, `role="alert"` for blocking errors, and avoid announcing the countdown every second.
- **Effort:** medium.

### P2 A11Y-12: Filter and selection state is not consistently programmatic

- **Affected:** catalogue filters and some visual card selectors.
- **Observed:** selected filters change classes but lack `aria-pressed`. Create-step choices correctly use `aria-pressed`, showing the codebase already has the right pattern.
- **Evidence:** `pages/Library.tsx:68-82`; compare `pages/CreateSong.tsx:493-501`, `547-555`, `609-614`.
- **WCAG:** 1.3.1; 4.1.2.
- **Recommendation:** expose toggle state and announce the filtered result count in a polite status region.
- **Effort:** small.

### P2 A11Y-13: The star rating mimics radios without full radio keyboard behavior

- **Affected:** delivered-song rating.
- **Observed:** five buttons use `role="radio"` inside a radiogroup but do not implement roving tab index or arrow-key selection. Users must Tab through all five options.
- **Evidence:** `components/SongReady.tsx:166-194`.
- **WCAG:** 2.1.1 and ARIA Authoring Practices alignment.
- **Recommendation:** use native radio inputs with styled labels, or implement complete radio-group keyboard behavior.
- **Effort:** small to medium.

### P2 A11Y-14: Repeated song-card image alt text can duplicate the button name

- **Affected:** catalogue song cards.
- **Observed:** the image uses the song title as alt text inside a button that also renders the title.
- **Evidence:** `pages/Library.tsx:91-138`.
- **Impact:** accessible names may repeat the title, creating noisy announcements.
- **Recommendation:** use `alt=""` when the adjacent visible title already names the card; reserve descriptive alt text for images that communicate independent content.
- **Effort:** small.

### P2 A11Y-15: Small tracked uppercase copy is overused

- **Affected:** all routes, especially admin and order tracking.
- **Observed:** 11-12px labels with `0.12em` to `0.18em` tracking appear throughout the interface.
- **Evidence:** repeated `text-xs`/`text-[11px]`, uppercase, tracked utilities; representative sources include `pages/OrderStatus.tsx:250`, `270`, `278`, `296`, `339`, `372` and `components/EmailCapturePopup.tsx:282-287`.
- **Impact:** reduced reading speed and legibility for dyslexic and low-vision users. Tracking does not compensate for weak contrast.
- **Recommendation:** reserve uppercase tracking for short section kickers. Use sentence case at 14px or larger for operational metadata and instructions.
- **Effort:** medium.

## Color-system audit

### Exact contrast table

| Foreground | Background | Ratio | AA normal text | Appropriate role |
| --- | --- | ---: | --- | --- |
| Ink `#1F1B14` | Ivory `#FAF6EE` | 15.90:1 | Pass | Primary text |
| Ink soft `#5A4F3F` | Ivory | 7.42:1 | Pass | Body/secondary text |
| Ink muted `#8B7F6C` | Ivory | 3.64:1 | **Fail** | Decoration or large text only |
| Terracotta `#943B2F` | Ivory | 6.66:1 | Pass | Text, links, focus on light surfaces |
| Terracotta soft `#E8B89E` | Ivory | 1.65:1 | **Fail** | Background/accent only |
| Mustard `#D8B253` | Ivory | 1.87:1 | **Fail** | Fill/accent only |
| Mustard soft `#F0DCA8` | Ivory | 1.26:1 | **Fail** | Background only |
| Sage `#7C8B5C` | Ivory | 3.42:1 | **Fail** | Large icon/non-text use only |
| Sage dark `#5D6A42` | Ivory | 5.40:1 | Pass | Status text |
| Sage soft `#C9D2B0` | Ivory | 1.46:1 | **Fail** | Background/border decoration only |
| Cream `#FFFDF6` | Ink | 16.84:1 | Pass | Dark-surface text |
| Terracotta | Ink | 2.39:1 | **Fail** | Do not use for text/focus on ink |
| Mustard | Ink | 8.50:1 | Pass | Premium text/icon on ink |
| Mustard soft | Ink | 12.66:1 | Pass | Secondary dark-surface text/focus |
| Line `#E5DDD0` | Ivory | 1.25:1 | N/A | Decorative divider only |
| Line strong `#C7BDA8` | Ivory | 1.73:1 | N/A | Still too weak for control boundaries |
| Cream at 45% | Ink | 4.41:1 | **Fail** | Raise to at least 55% for small text |
| Cream at 35% | Ink | 3.18:1 | **Fail** | Decorative only |

### Color criticism

The palette itself is not the problem. The role system is.

- Terracotta successfully owns primary emotion, links, and many actions, but it is also used for focus, decoration, selected states, icons, and error-adjacent emphasis. Its meaning changes too often.
- Mustard is strongest as a premium fill or dark-surface accent. It should not be used as light-surface text. The code sometimes already uses `#6F521F` for accessible gold-associated text; that should become a named token.
- Sage works for reassurance only when its dark variant carries the text. Base sage is borderline for icons and fails normal text on ivory.
- `ink-muted` is treated as a universal secondary text color even though it is not accessible at common sizes. This is the most pervasive token defect.
- Border tokens were designed for atmosphere, then reused for functional boundaries. Decorative softness and control affordance need separate tokens.
- The dark player and footer are visually useful anchors, but the system has no reliable dark-surface muted/focus scale. Cream at 55% passes (`5.88:1`); cream at 45% and 35% does not.

### Recommended token contract

- `text-primary`: `#1F1B14`
- `text-secondary`: `#5A4F3F`
- `text-muted-accessible`: `#6F6250` (`5.51:1` on ivory)
- `text-gold-accessible`: `#6F521F` (`6.71:1` on ivory)
- `border-decorative`: retain `#E5DDD0`
- `border-control`: no lighter than `#8B7F6C`
- `focus-light-surface`: `#943B2F`
- `focus-dark-surface`: `#F0DCA8` or cream
- `text-dark-surface-secondary`: cream at 55% or stronger

Do not globally darken the entire palette. Preserve soft surfaces; strengthen the foreground roles that carry meaning.

## Subjective visual and brand criticism

### P1 UX-01: The 10-second 50% discount popup damages premium positioning

- **Affected:** homepage, catalogue, and create flow unless previously dismissed.
- **Observed:** a modal appears after 10 seconds and offers 50% off, framed with "No thanks, I'll pay full price."
- **Evidence:** `components/EmailCapturePopup.tsx:17-22`, `99-108`, `309-350`.
- **Impact:** this creates pressure before trust. A permanent half-price offer signals that the list price is artificial and contradicts the crafted, emotionally premium product story.
- **Recommendation:** remove the automatic modal from the first-session core journey. Use an inline, low-pressure email capture after social proof or at exit/return intent. If the offer remains, reduce the discount and use neutral decline copy.
- **Effort:** medium; marketing decision required.

### P1 UX-02: Fixed layers compete for the bottom and center of the viewport

- **Affected:** public routes on first visit, especially mobile.
- **Observed:** the persistent player uses z-index 100, cookie consent 120, and email/track dialogs 200. App-level bottom padding accounts for the player, not the cookie banner. The offer can open while the player exists.
- **Evidence:** `App.tsx:244-260`; `components/PersistentPlayer.tsx:35`, `55`, `70`; `components/AnalyticsConsent.tsx:35-38`; `components/EmailCapturePopup.tsx:248-255`.
- **Impact:** occluded controls, attention fragmentation, and a product that feels eager rather than calm. On a 360px viewport, these layers can consume most of the useful screen.
- **Recommendation:** create a single overlay/layer coordinator. Consent gets first priority; modal marketing is suppressed while consent or task dialogs are active; the player docks above banners or collapses automatically.
- **Effort:** large structural change.
- **Confidence:** source-derived; render verification required for exact overlap.

### P2 VIS-01: The interface overuses rounded cards and pill controls

- **Affected:** every route, especially homepage, catalogue, tracking, checkout, and admin.
- **Observed:** `rounded-2xl`, `rounded-[1.5rem]`, and `rounded-full` are used for section wrappers, repeated cards, controls, badges, and containers.
- **Evidence:** representative sources: `pages/Library.tsx:17`, `48`, `57`, `91`; `pages/OrderStatus.tsx:232`, `266`, `291`, `305`, `356`, `371`, `381`; `pages/PaymentSuccess.tsx:190`, `205`; `pages/Admin.tsx:517`, `644`, `732`, `813`.
- **Impact:** hierarchy flattens because everything has the same silhouette. This directly conflicts with `DESIGN.md`, which asks for full-width bands, asymmetry, and cards only for individual tools/repeated items.
- **Recommendation:** remove container cards from page-level sections. Use tonal bands, columns, rules, and whitespace. Reserve rounded cards for selectable items, dialogs, and operational tools.
- **Effort:** large visual refactor.

### P2 VIS-02: The typography is distinctive but too theatrical in operational contexts

- **Affected:** create, order tracking, checkout, admin.
- **Observed:** Cormorant at 3xl-7xl and `leading-none` appears in forms, status pages, and dense workbench panels.
- **Impact:** the serif works for emotional headlines, but oversized status and form headings slow scanning and can create fragile wrapping at zoom. `leading-none` is aggressive for multiline editorial text.
- **Recommendation:** keep Cormorant for page and section titles; use DM Sans for field groups, order metadata, admin headings, and repeated card titles. Use line-height around 1.05-1.15 for multiline display text.
- **Effort:** medium.

### P2 VIS-03: Accent colors do not have stable semantic ownership

- **Affected:** relationship cards, player, statuses, pricing, promos, admin pipeline.
- **Observed:** sage, mustard, terracotta, and ink each act as decoration, state, CTA, border, and text depending on context.
- **Impact:** users cannot learn the system. A mustard element may mean premium, playback progress, loading, or promotion. Sage may mean completed, calm decoration, or a relationship category.
- **Recommendation:** assign strict roles: terracotta = primary action/emotional emphasis; mustard = premium/value/playback; sage = success/reassurance; red = destructive/error; ink = structural authority.
- **Effort:** medium.

### P2 VIS-04: Image treatment is too inconsistent to feel art-directed

- **Affected:** homepage, catalogue, success state.
- **Observed:** images combine sepia, luminosity blend, low opacity, category washes, saturation reduction, hover restoration, and plain full-color treatment.
- **Evidence:** `pages/Library.tsx:48-64`; `pages/Home.tsx:431-445`; `pages/PaymentSuccess.tsx:237-243`.
- **Impact:** the photos feel filtered by components rather than selected as one coherent collection. Hover-dependent color restoration also hides the intended image from touch users.
- **Recommendation:** define two treatments only: editorial color photography for primary content and a consistent restrained duotone for supporting imagery. Do not rely on hover to reveal the accurate image.
- **Effort:** medium.

### P2 VIS-05: Dark surfaces are becoming a second theme

- **Affected:** player, footer, relationship section, catalogue media cards.
- **Observed:** large ink bands and overlays are frequent despite the ivory-native direction.
- **Impact:** the app does not become dark-cinematic, but it repeatedly interrupts the sun-drenched gallery with heavy blocks. The persistent player is especially visually dominant relative to the content.
- **Recommendation:** keep the footer and compact player dark, but reduce large dark content bands. Use ink as punctuation, not a recurring background system.
- **Effort:** medium.

### P3 VIS-06: Shadows, blur, texture, and borders stack without a clear depth model

- **Affected:** fixed header, dialogs, media overlays, player, global texture.
- **Observed:** backdrop blur, ambient shadows, translucent cream, borders, and a fixed global noise layer coexist.
- **Evidence:** `index.css:47-86`, `214-219`; `App.tsx:257-265`; dialog and player classes.
- **Impact:** individually subtle effects accumulate into visual haze and extra paint work.
- **Recommendation:** define three depth levels: flat tonal section, bordered control/card, elevated overlay. Remove blur from elements that do not need to reveal moving content beneath them.
- **Effort:** small to medium.

## UX and conversion findings

### P2 UX-03: The header has competing primary actions on mobile

- **Affected:** mobile header.
- **Observed:** icon logo, persistent "Create Your Song" pill, and menu control share a 64px bar.
- **Evidence:** `components/Header.tsx:58-125`.
- **Impact:** the CTA is always available, but at narrow widths it crowds brand recognition and navigation. The menu repeats the same CTA again.
- **Recommendation:** keep the header to logo plus menu at the smallest breakpoint. Put the primary CTA in the open menu and use a sticky CTA only after the visitor scrolls past the hero.
- **Effort:** medium.
- **Confidence:** source-derived; test at 320-360px and 200% zoom.

### P2 UX-04: The catalogue's "Play all" promise does not match the behavior

- **Affected:** catalogue.
- **Observed:** "Play all samples" starts only the first song. Auto-advance is implemented globally only under particular end conditions and the 30-second preview lock resets playback to zero and locks the active song.
- **Evidence:** `pages/Library.tsx:28-39`; `App.tsx:75-90`, `146-171`.
- **Impact:** wording suggests a playlist, while the control performs a single play action. The 30-second lock can interrupt the expected sequence.
- **Recommendation:** rename to "Play first sample" or implement an explicit preview queue with visible current/next state.
- **Effort:** small for copy, medium for playlist behavior.

### P2 UX-05: The 30-second preview ending is abrupt and weakly recoverable

- **Affected:** persistent player.
- **Observed:** playback stops, resets to zero, disables the play control, and displays a lock message. The primary recovery CTA is hidden on small mobile layouts.
- **Evidence:** `App.tsx:146-154`; `components/PersistentPlayer.tsx:100-139`, `185-190`.
- **Impact:** the user loses context and may not understand whether another sample can be played. Mobile users see a disabled player without the desktop "Create yours" action.
- **Recommendation:** retain the played position visually, explain the preview limit, provide an always-visible next action, and allow switching samples without hiding recovery.
- **Effort:** medium.

### P2 UX-06: The create flow is clear but cognitively heavier than its visual hierarchy admits

- **Affected:** five-step song brief.
- **Observed:** chip groups, occasion cards, genre cards, text areas, pricing, expedited delivery, and email collection all use similar card/pill emphasis. Desktop has a step sidebar; mobile relies mainly on heading/progress.
- **Evidence:** `pages/CreateSong.tsx:377-469`, `493-806`.
- **Impact:** users can proceed, but the interface does not clearly distinguish required decisions from optional enrichment. Large serif labels can make each prompt feel equally important.
- **Recommendation:** label required/optional explicitly, reduce simultaneous choice count, provide concise examples beneath fields, preserve entered answers in a compact review summary, and test abandonment at each step.
- **Effort:** medium to large.

### P2 UX-07: Checkout communicates provider security but not enough purchase certainty

- **Affected:** checkout and return.
- **Observed:** the page shows "Provider-secured" and status copy, but purchase reassurance is fragmented across cards. The embedded Stripe area receives a generic div label, while Paystack uses a different presentation.
- **Evidence:** `pages/Checkout.tsx:650-875`.
- **Impact:** users need a single clear answer to price, delivery time, what happens next, refund/revision expectations, and payment provider. Provider switching changes the visual rhythm at the highest-trust moment.
- **Recommendation:** create one persistent order summary and reassurance block shared by providers. Keep payment-specific mechanics inside the provider area.
- **Effort:** medium.

### P2 UX-08: Tracking has strong reassurance but becomes a dashboard of cards

- **Affected:** signed-in/in-production order tracking.
- **Observed:** countdown, status badges, timeline cards, brief cards, and pricing card all have separate containers and strong visual treatment.
- **Evidence:** `pages/OrderStatus.tsx:229-390` and following sections.
- **Impact:** the emotional priority should be "what is happening now and when will I receive it." Secondary details compete with that answer.
- **Recommendation:** lead with current stage and delivery expectation, then progressively disclose history, brief, and payment details. Use a single vertical timeline instead of cards within cards.
- **Effort:** large.

### P2 UX-09: Admin uses the customer aesthetic where operational density needs a stronger system

- **Affected:** admin workbench.
- **Observed:** large serif headings, rounded sections, badges, and many pill actions remain dominant in a data-heavy workflow.
- **Evidence:** `pages/Admin.tsx:584-1135`; `components/admin/SongPipelinePanel.tsx:220-425`.
- **Impact:** the workbench is attractive but slower to scan. Repeated rounded panels consume vertical space and obscure data hierarchy, especially in order queues and generation stages.
- **Recommendation:** retain brand colors but shift to compact sans-serif headings, table/list density, fixed column alignment, explicit destructive styling, and fewer decorative containers.
- **Effort:** large.

### P2 UX-10: Error and recovery copy is inconsistent across the journey

- **Affected:** create, tracking, checkout, verify, payment success, admin.
- **Observed:** some errors explain recovery, while others use "Something went wrong" or leave the user with a generic retry. Success states redirect automatically without consistent timing or announcement.
- **Impact:** payment and authentication failures need precise next steps and preservation guarantees.
- **Recommendation:** define a state-copy system: what happened, whether data/payment is safe, what the user should do, and how to contact support. Never auto-redirect without a visible manual route.
- **Effort:** medium.

### P3 UX-11: Cookie consent is technically balanced but context-poor

- **Affected:** first visit when analytics is configured.
- **Observed:** Accept and Decline are visually available, but there is no privacy details link or way to revisit the choice in the interface.
- **Evidence:** `components/AnalyticsConsent.tsx:26-62`.
- **Recommendation:** add a privacy link and persistent preference control in the footer. Use `role="region"` unless the banner intentionally takes modal focus.
- **Effort:** small.

## What the implementation already does well

Brutal mode should still distinguish good foundations from defects.

- The primary ink/cream and terracotta/cream pairs are excellent contrast combinations.
- A skip link exists and is visually revealed on focus (`App.tsx:247-249`, `index.css:141-158`).
- Reduced-motion CSS disables reveal and animation timing (`index.css:171-183`), and the rotating finished-song art adds `motion-reduce:animate-none`.
- Track Order and Email Capture dialogs include `aria-modal`, labelled titles, initial focus, Escape handling, focus containment, scroll lock, and focus restoration.
- The create flow uses visible labels for its main narrative fields and exposes many card choices with `aria-pressed`.
- Images generally provide alt text or correctly use empty alt in the player where the cover is redundant.
- Primary touch controls commonly meet or exceed 44px.
- Error, empty, loading, and success states exist across the major flows rather than falling back to raw technical output.
- Build output is successfully code-split for large routes.

## Route-by-route remediation matrix

| Route/surface | Primary problems | Priority | Required verification |
| --- | --- | --- | --- |
| `/` Home | Card/pill repetition, 10-second offer, FAQ semantics, dark-band drift, low-contrast metadata | P1 | 360/768/1440, 200% zoom, popup timing, keyboard FAQ |
| `/library` | Filter state not exposed, "Play all" mismatch, redundant image names, sticky filter/player layering | P2 | horizontal filter scroll, touch, keyboard, empty/error/content states |
| `/create` | Dense choices, weak control boundaries, error association, mobile step context | P1 | all five steps, validation, back/forward persistence, 200% zoom, text spacing |
| `/track` | Unlabelled sign-in email, low-contrast metadata, dashboard card overload, async status | P1 | unauthenticated, empty, in-production, completed, expired token |
| `/checkout` | Trust hierarchy, provider inconsistency, weak borders, status announcement | P1 | Stripe, Paystack, zero-price promo, processing/error/success, return route |
| `/payment-success` | Muted labels, async verification announcement, generic failure recovery | P2 | missing reference, creating, error, success |
| `/payment-cancel` | Generic card composition, saved-brief claim must be validated | P2 | brief persistence and keyboard return actions |
| `/verify` | Async states not announced, automatic redirect | P2 | missing, invalid, expired, valid token |
| `/admin` | Label association, dense decorative UI, low-contrast labels, errors not announced | P1 | login error/loading plus authenticated workbench at wide and narrow widths |
| Header/mobile menu | Focus escape, narrow-width crowding, duplicated CTA | P1 | keyboard loop, Escape, focus restoration, 320/360px, 200% zoom |
| Persistent player | Inaccessible seek, preview recovery, overlay collision, dark focus | P1 | no song, audio/no audio, playing, locked, hidden, reduced motion |
| Dialogs/consent | Small close targets, error announcement, layer coordination | P1 | focus trap, backdrop click, Escape, consent + player + offer interaction |

## Top ten fixes in execution order

1. Replace failing text and functional-border tokens; establish separate decorative and control roles.
2. Fix dark-surface focus indicators and verify every interactive control by keyboard.
3. Add real labels and complete field/error relationships for order sign-in, admin login, dialogs, and forms.
4. Add route titles, route focus management, named Suspense status, and SPA announcements.
5. Replace the waveform button with a semantic range-based seek control.
6. Make mobile navigation a real modal disclosure or a genuinely nonmodal menu.
7. Coordinate consent, player, task dialogs, and marketing offers through one overlay policy.
8. Correct FAQ, filters, ratings, loading, success, and error semantics.
9. Remove or redesign the automatic 50% discount popup to protect premium trust.
10. Reduce section-wrapper cards and pill/uppercase repetition, starting with tracking, create, and admin.

## Quick wins versus structural work

### Quick wins (hours to two days)

- Add form IDs/labels, `aria-invalid`, descriptions, and live error/status regions.
- Add `aria-expanded`/`aria-controls` and true hidden state to FAQ.
- Add `aria-pressed` to catalogue filters.
- Increase modal close targets to 44x44.
- Correct focus selectors for dark controls.
- Replace muted and gold text uses with accessible foreground tokens.
- Update route titles and loading status copy.
- Rename "Play all samples" if playlist behavior is not implemented.

### Structural work (several days or product decisions)

- Refactor persistent audio seek and preview-limit recovery.
- Build a route-level focus/announcement convention.
- Introduce an overlay coordinator.
- Redesign the offer strategy and discount presentation.
- Reduce page-level card containers and formalize editorial layout primitives.
- Redesign order tracking around current stage and progressive disclosure.
- Create a separate dense admin component language using the same brand tokens.

## Regression checklist and acceptance criteria

### Automated/static

- `npm run build` passes.
- `npm run lint` passes with no errors.
- Add automated accessibility checks for every public route and admin login using axe or equivalent.
- Assert one `h1` per route, unique meaningful document titles, labelled inputs, and no serious/critical accessibility violations.
- Token contrast tests enforce `4.5:1` for normal text and `3:1` for functional non-text UI.

### Keyboard and screen reader

- Every task completes with keyboard only.
- Focus is always visible, never trapped accidentally, and never hidden behind fixed UI.
- Opening/closing menus and dialogs moves and restores focus predictably.
- Route changes, loading, validation errors, payment state, and success are announced without excessive repetition.
- Waveform/range, filters, rating, and step choices expose role, name, and current value/state.

### Responsive/reflow

- Test `320x568`, `360x800`, `768x1024`, `1440x900`, and mobile landscape.
- At 200% browser zoom and 400% narrow reflow, no two-dimensional page scroll is required except genuine data tables/media.
- Increased text spacing does not clip headings, pill labels, buttons, cards, or form controls.
- Header, player, consent, and dialogs never overlap actionable content.
- Safe-area insets are respected on top and bottom controls.

### Visual acceptance

- Muted text remains visibly secondary while meeting AA.
- Decorative dividers may remain soft; all control boundaries and selected states meet 3:1.
- Mustard and soft sage are never used as normal text on ivory.
- Terracotta is not used as the sole focus indicator on ink.
- No page section is wrapped in a card without a functional reason.
- A user can identify the primary action and current state within five seconds on every route.
- Hover-only visual information has an equivalent touch and keyboard state.

## Final product-level recommendation

Do not rebrand. The core identity is good enough and more distinctive than the average custom-song storefront. The correct move is disciplined subtraction and accessibility hardening.

First fix the semantic/token foundation. Then remove the automatic discount interruption and reduce the number of containers competing for attention. Finally, give customer tracking and admin their own information-density patterns while retaining the same typography and color family.

The target should not be "more beautiful." It should be calmer, more legible, and more credible. That is what will make the existing warm editorial direction feel genuinely premium.
