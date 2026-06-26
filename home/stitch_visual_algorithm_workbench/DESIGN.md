---
name: UAIS Console
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060d20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3e'
  surface-container-highest: '#2d3449'
  on-surface: '#dbe2fd'
  on-surface-variant: '#c7c4d8'
  inverse-surface: '#dbe2fd'
  inverse-on-surface: '#283044'
  outline: '#918fa1'
  outline-variant: '#464555'
  surface-tint: '#c3c0ff'
  primary: '#c3c0ff'
  on-primary: '#2c2a5e'
  primary-container: '#5c5a92'
  on-primary-container: '#dbd7ff'
  inverse-primary: '#5a5890'
  secondary: '#89ceff'
  on-secondary: '#00344d'
  secondary-container: '#00628d'
  on-secondary-container: '#abdaff'
  tertiary: '#4edea3'
  on-tertiary: '#003824'
  tertiary-container: '#006e4b'
  on-tertiary-container: '#67f4b7'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e3dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#161349'
  on-primary-fixed-variant: '#434176'
  secondary-fixed: '#c9e6ff'
  secondary-fixed-dim: '#89ceff'
  on-secondary-fixed: '#001e2f'
  on-secondary-fixed-variant: '#004c6e'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#005236'
  background: '#0b1326'
  on-background: '#dbe2fd'
  surface-variant: '#2d3449'
  error-red: '#ffb4ab'
  terminal-green: '#67f4b7'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  caption:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '700'
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 40px
  xl: 64px
  sidebar-width: 280px
  container-max: 1440px
---

## Brand & Style
The brand identity is rooted in **Technological Brutalism** mixed with **Modern SaaS functionality**. It targets developers, data scientists, and algorithm engineers who require a high-density, high-precision environment. The aesthetic is "Terminal-Plus"—retaining the focus and information density of a CLI while leveraging modern web capabilities like subtle gradients, micro-interactions, and visual hierarchy.

The tone is authoritative, analytical, and futuristic. It prioritizes clarity of data and computational state over decorative elements, using a "glow" and "grid" motif to evoke the feeling of a sophisticated mainframe or a real-time intelligence console.

## Colors
The palette is a deep-space dark mode optimized for long-term focus. 
- **Primary (#c3c0ff):** A high-vibrancy lavender used for brand elements, active states, and primary actions.
- **Secondary (#89ceff):** An electric sky blue reserved for informational accents and secondary interactive elements.
- **Tertiary (#4edea3):** A neon spring green used exclusively for success states, uptime metrics, and "active system" indicators.
- **Surface & Background (#0b1326):** The core foundation is a very dark navy, providing high contrast for the neon accents.
- **Functional Accents:** Low-opacity variations of the primary color (e.g., `primary/10`) are used for large decorative backgrounds (Hero sections) to maintain depth without distracting from content.

## Typography
The system employs a dual-font strategy. **Inter** handles all proportional UI text, providing a clean, neutral foundation that stays legible at high densities. **JetBrains Mono** is used for all "technical" data, including algorithm names, O-notation complexity, terminal logs, and system labels.

Scale is used aggressively to differentiate between "Display" (marketing/welcome) and "Console" (working) text. Captions are frequently transformed to uppercase with wide letter-spacing to mimic blueprint or schematics documentation.

## Layout & Spacing
The layout uses a **Fixed Sidebar / Fluid Content** model.
- **Navigation:** A permanent 280px sidebar provides the primary navigation rail.
- **Main Canvas:** A 1440px max-width container centers the content, using a standard 24px (md) gutter system.
- **Grid:** Use a 12-column grid for dashboard views. Bento-style cards should span 4 columns on desktop (3-up) and 6 columns on tablet (2-up).
- **Rhythm:** An 8px base unit drives the spacing system. Use `sm` (16px) for internal card padding and `md` (24px) for outer margins between major sections.

## Elevation & Depth
Depth is achieved through **Tonal Layering** and **Grid-based Outlines** rather than traditional shadows.
- **Surface Levels:** The background is `surface` (#0b1326). Cards and elevated containers use `surface-container` (#171f33). Sidebars use a bordered `surface`.
- **Outlines:** Every interactive block is encased in an `outline-variant` (#464555) border. This reinforces the technical, structured feel.
- **Interactivity:** Hover states introduce a "Glow" effect—using an inner shadow `inset 0 2px 4px rgba(195, 192, 255, 0.1)` and a primary-colored border to simulate a light-emitting component.
- **Overlays:** Tooltips and floating menus use `surface-bright` (#31394d) to pop against the dark canvas.

## Shapes
The shape language is **Precision Geometric**.
- **Standard Radius:** 4px (Soft) is the default for buttons, cards, and input fields to maintain a serious, structured look.
- **Utility Radius:** Use `0.25rem` (rounded) for smaller components like chips. 
- **Icons:** Material Symbols should be used with a 400 weight, unfilled by default, filling only on active states or high-emphasis areas.
- **Specialty:** User avatars are the only strictly circular elements in the system to provide a soft contrast to the otherwise rigid grid.

## Components
- **Buttons:**
    - **Primary:** Solid `primary-container` (#4f46e5) background with white text. High contrast, 4px radius.
    - **Secondary/Outline:** `outline-variant` border with `on-surface` text. Transitions to primary border on hover.
- **Cards (Bento Style):** Must have a `surface-container` background and a 1px `outline-variant`. On hover, the border changes to the card's specific accent color (Primary, Secondary, or Tertiary).
- **Terminal Blocks:** Used for code or logs. Darker than the card background, using `label-sm` font in Tertiary (green).
- **Inputs:** Search bars should be pill-shaped (full rounded) to distinguish them from structural buttons, using a `surface-container-lowest` background for maximum depth.
- **Status Indicators:** Use a pulse animation for active system states, pairing a 8px circle with a `caption` style label.