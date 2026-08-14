---
name: StoryDex Cinematic Noir
colors:
  surface: '#12121e'
  surface-dim: '#11131a'
  surface-bright: '#373941'
  surface-container-lowest: '#0c0e15'
  surface-container-low: '#191b22'
  surface-container: '#1d1f26'
  surface-container-high: '#282a31'
  surface-container-highest: '#33343c'
  on-surface: '#e2e2ec'
  on-surface-variant: '#ccc3d8'
  inverse-surface: '#e2e2ec'
  inverse-on-surface: '#2e3038'
  outline: '#958da1'
  outline-variant: '#4a4455'
  surface-tint: '#d2bbff'
  primary: '#d2bbff'
  on-primary: '#3f008e'
  primary-container: '#7c3aed'
  on-primary-container: '#ede0ff'
  inverse-primary: '#732ee4'
  secondary: '#bdc2ff'
  on-secondary: '#131e8c'
  secondary-container: '#2f3aa3'
  on-secondary-container: '#a8afff'
  tertiary: '#c7c5d3'
  on-tertiary: '#302f3b'
  tertiary-container: '#666572'
  on-tertiary-container: '#e6e3f3'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#eaddff'
  primary-fixed-dim: '#d2bbff'
  on-primary-fixed: '#25005a'
  on-primary-fixed-variant: '#5a00c6'
  secondary-fixed: '#e0e0ff'
  secondary-fixed-dim: '#bdc2ff'
  on-secondary-fixed: '#000767'
  on-secondary-fixed-variant: '#2f3aa3'
  tertiary-fixed: '#e4e1f0'
  tertiary-fixed-dim: '#c7c5d3'
  on-tertiary-fixed: '#1b1b25'
  on-tertiary-fixed-variant: '#464652'
  background: '#0a0a14'
  on-background: '#e2e2ec'
  surface-variant: '#33343c'
  muted: '#1a1a2c'
  status-watched: '#4ade80'
  status-watching: '#60a5fa'
  status-planning: '#c084fc'
  brand-glow: rgba(124, 58, 237, 0.25)
typography:
  display-hero:
    fontFamily: Plus Jakarta Sans
    fontSize: 72px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  display-hero-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.3'
    letterSpacing: -0.02em
  section-header:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: '1.4'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.1em
  data-tabular:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: '1'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1280px
  gutter-desktop: 2rem
  gutter-mobile: 1rem
  stack-section: 3.5rem
  stack-component: 1.5rem
  base-unit: 4px
---

## Brand & Style

The brand identity is **Cinematic, Immersive, and Sophisticated**. It is designed for media enthusiasts who treat their collections as a curated gallery. The design style is a hybrid of **Minimalism** and **Glassmorphism**, leveraging high-contrast typography against deep, atmospheric backgrounds to prioritize high-quality artwork.

The UI should evoke a sense of "Premium Discovery"—the feeling of walking into a high-end private theater. We achieve this through:
- **Atmospheric Depth:** Using layered surfaces and subtle blurs to create a spatial experience.
- **Content-First Hierarchy:** De-emphasizing UI chrome to let poster and banner art drive the emotional response.
- **Refined Tactility:** Precise micro-interactions and scale-based transitions that make the interface feel responsive and "alive."

## Colors

The palette is anchored in **Deep Midnight Navy (#0a0a14)** to provide a canvas where vibrant colors and media artwork pop. 

- **Primary & Secondary:** We use a spectrum of Indigo and Violet. The primary violet is used for high-intent actions and critical status indicators, while the lighter secondary indigo is reserved for subtle accents and hover states.
- **Functional Transparency:** Rather than solid grays, we use opacity modifiers on the foreground color (e.g., `foreground/60`) to maintain color harmony across different levels of information density.
- **Status Semanticism:** Progress and tracking states follow a soft-neon logic—colors are highly saturated but used sparingly (10-15% opacity for backgrounds) to avoid overwhelming the dark theme.
- **Brand Glow:** Interactive elements should utilize a brand-tinted shadow (`#7c3aed` at 25% alpha) to create a subtle illumination effect rather than a traditional drop shadow.

## Typography

The typography strategy balances high-impact editorial style with technical precision.

- **Headlines:** We use **Plus Jakarta Sans** with tight tracking and heavy weights. For Display levels, a three-stop gradient (Foreground -> 90% -> 70%) should be applied to create a "metallic" premium sheen.
- **Body:** **Inter** provides maximum legibility for descriptions and metadata. We use a relaxed line height (`1.6`) for long-form synopsis text.
- **Labels & Data:** **JetBrains Mono** is used for "technical" metadata (episode counts, timestamps, file formats). The monospaced nature ensures that changing numerical values don't cause layout jitter.
- **Accessibility:** Text smoothing (`antialiased`) must be enabled globally to ensure high-contrast text remains crisp on dark backgrounds.

## Layout & Spacing

The system uses a **Fluid-Fixed Hybrid** grid. The content stretches to fill the viewport until it hits the 1280px maximum width, after which it centers.

- **Spacing Rhythm:** We follow a 4px/8px baseline. Component internal padding should default to `16px (p-4)`, scaling to `24px (p-6)` or `32px (p-8)` for large modals or hero containers.
- **Media Grids:** For poster art, use a 3/4 aspect ratio. Grids should be responsive:
    - **Mobile:** 2-column.
    - **Tablet:** 3 or 4-column.
    - **Desktop:** 5 or 6-column.
- **The Cinematic Overhang:** A core layout pattern is the negative-margin overlap, where the main content container pulls upward (e.g., `-mt-24`) over a blurred background banner to create immediate depth upon page load.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **Subtle Glassmorphism** rather than traditional shadows.

- **The Surface Stack:** 
    1. **Level 0 (Base):** Deep Navy (`#0a0a14`).
    2. **Level 1 (Cards/Inputs):** Surface (`#12121e`) with a `1px` border of `white/10`.
    3. **Level 2 (Modals/Popovers):** Surface with `backdrop-blur-xl` and a `shadow-2xl` tinted with the background color.
- **Glow Interactions:** Instead of making elements lighter on hover, we apply a "Brand Glow"—a soft, 20-30% opacity shadow using the primary violet color.
- **Scrims:** Media posters should use a multi-stop gradient overlay (Black/90 -> Black/30 -> Transparent) at the bottom to ensure white typography remains legible over unpredictable artwork.

## Shapes

The shape language is **Modern and Organic**. 

- **Primary Radius:** `0.5rem (8px)` is the standard for buttons, inputs, and small UI widgets.
- **Container Radius:** `1rem (16px)` or `1.5rem (24px)` for cards and posters to soften the large amount of rectangular media.
- **Pill Shape:** Used exclusively for status badges and chips to distinguish them from interactive buttons.
- **Borders:** Use thin `1px` strokes. Interactive elements should transition from a neutral border (`white/10`) to a brand-tinted border (`brand/40`) on hover.

## Components

### Buttons
- **Primary:** Violet fill with white text and a `1.03x` scale hover effect. Include a brand-colored shadow.
- **Secondary/Ghost:** `white/10` background or border-only. On hover, the background opacity increases to `white/20`.
- **Active State:** A `1px` downward translation (`translate-y-px`) to simulate a physical press.

### Cards (Media-centric)
- Use a `3/4` aspect ratio for posters.
- Apply `rounded-2xl` and `overflow-hidden`.
- On hover: The image should scale (`scale-105`) and the container should lift (`-translate-y-1.5`) with a duration of `300ms`.

### Progress Indicators
- **Track:** `white/10` or `muted` surface.
- **Fill:** A linear gradient from `brand-dark` to `brand`.
- **Logic:** For "completed" states, the gradient should shift to an emerald/green hue.

### Input Fields
- Dark background (`#0a0a14`) with a 44px minimum touch target.
- Focus state: `2px` ring using the primary brand color at 50% opacity.
- Placeholder text: `muted-foreground` at 40% opacity.

### Status Badges
- Small, uppercase labels using the `label-caps` typography.
- Backgrounds are 10% opacity versions of the status color (Green, Blue, Red) with 40% opacity borders.