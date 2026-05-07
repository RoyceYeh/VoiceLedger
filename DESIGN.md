---
name: Financial Intelligence System
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#bcc9cd'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#869397'
  outline-variant: '#3d494c'
  surface-tint: '#4cd7f6'
  primary: '#4cd7f6'
  on-primary: '#003640'
  primary-container: '#06b6d4'
  on-primary-container: '#00424f'
  inverse-primary: '#00687a'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#ffb2b7'
  on-tertiary: '#67001b'
  tertiary-container: '#ff7f8b'
  on-tertiary-container: '#7d0023'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#acedff'
  primary-fixed-dim: '#4cd7f6'
  on-primary-fixed: '#001f26'
  on-primary-fixed-variant: '#004e5c'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffdadb'
  tertiary-fixed-dim: '#ffb2b7'
  on-tertiary-fixed: '#40000d'
  on-tertiary-fixed-variant: '#92002a'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  display-num:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-bold:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.4'
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  container-margin: 32px
  gutter: 24px
---

## Brand & Style

The design system is engineered for high-stakes financial environments where clarity and precision are paramount. It centers on a **Modern Glassmorphic** aesthetic, utilizing translucent layers to create a sense of depth without overwhelming the user with heavy shadows. 

The brand personality is authoritative yet approachable, aiming to evoke a feeling of "controlled power." By balancing deep charcoal foundations with vibrant, neon-adjacent data accents, the UI directs focus toward critical insights and performance metrics. High-density data is mitigated through generous whitespace and a "cards-first" structural philosophy, ensuring the user remains calm and focused during complex analysis.

## Colors

The palette is optimized for a sophisticated Dark Mode that reduces eye strain during prolonged monitoring. 

- **Foundations:** The primary background (#0f172a) provides a deep, ink-like base, while the surface color (#1e293b) defines interactive cards and containers.
- **Accents:** 
    - **Cyan (#06b6d4):** Used for navigation, active states, and primary calls to action.
    - **Emerald Green (#10b981):** Reserved exclusively for positive financial growth, income, and surplus indicators.
    - **Rose Red (#f43f5e):** Reserved for expenses, deficits, and critical alerts.
- **Overlays:** Glassmorphism is achieved using white alpha-blended strokes (8-12% opacity) to simulate light catching the edge of glass panes.

## Typography

This design system utilizes **Inter** for its exceptional legibility in data-heavy environments. 

Emphasis is placed on numerical hierarchy. Large financial totals use the `display-num` style with tighter letter spacing to feel impactful and "solid." All labels and secondary data points utilize medium weights to ensure they remain legible against dark backgrounds. Monospaced numeric features of Inter should be enabled via CSS (`font-feature-settings: 'tnum' on, 'lnum' on`) to ensure that numbers in tables and dashboards align perfectly for vertical scanning.

## Layout & Spacing

The system employs a **12-column fluid grid** designed for 1440px+ viewports, scaling down to 4 columns for mobile. 

The spacing rhythm is built on a 4px baseline. To achieve the "sophisticated" feel, the system mandates a minimum of `24px` (lg) padding inside all data cards and `32px` (xl) margins between major dashboard sections. This "ample whitespace" strategy prevents the dark theme from feeling claustrophobic and allows the vibrant data accents to stand out as the most important elements on the screen.

## Elevation & Depth

Depth is communicated through **Tonal Layering** and **Glassmorphism** rather than traditional black shadows.

1.  **Level 0 (Base):** Deep Charcoal (#0f172a).
2.  **Level 1 (Cards):** Surface Blue (#1e293b) with a 1px solid border at 8% white opacity.
3.  **Level 2 (Modals/Popovers):** Surface Blue with a `backdrop-filter: blur(12px)` and a slightly brighter border (15% white opacity).

Shadows, when used, are "Ambient Glows." Instead of dark offsets, use a very large, soft blur (20-40px) with 5% opacity of the accent color (e.g., a subtle Cyan glow behind a primary action button) to simulate light emission.

## Shapes

The design system uses a "Rounded" (Level 2) shape language to soften the technical nature of financial data. 

- **Standard Components:** Buttons and input fields use a `0.5rem` (8px) radius.
- **Data Cards:** Containers use `1rem` (16px) to create clear visual containment.
- **Badges/Chips:** Categorical elements use a full pill-shape (999px) to distinguish them from interactive buttons.

This consistent use of large radii contributes to the modern, premium feel of the dashboard.

## Components

### Buttons
- **Primary:** High-contrast Cyan (#06b6d4) with dark text for maximum visibility.
- **Secondary:** Transparent background with a 1px Cyan border.
- **Tertiary:** Ghost style; text-only with a subtle background hover state.

### Data Cards
Cards are the primary layout unit. Every card must have a title in `label-bold` and ample `lg` padding. Cards should utilize the "Glass" border technique defined in the Elevation section.

### Badges & Chips
Used for transaction categories (e.g., "Utilities", "Investment"). These should have a subtle background tint (10% opacity) of the category color and 100% opacity text for the label.

### Input Fields
Inputs should match the surface color but use a brighter border on focus. Placeholders should be low-contrast (#64748b) to ensure they do not compete with user-entered data.

### Progress Bars & Charts
Charts must adhere to the semantic color rules: Emerald for growth/positive, Rose for decline/negative. Line charts should use a gradient "glow" beneath the line to reinforce the glassmorphic style.