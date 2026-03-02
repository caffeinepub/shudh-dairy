# Sunrise Milk And Agro Product's

## Current State
- E-commerce store with warm parchment/saffron-gold palette (OKLCH tokens) for the public website
- Admin panel using slate-indigo dark theme
- Fonts: Playfair Display (display) + General Sans (body)
- Components: StorePage, AdminLogin, AdminDashboard, ProductCard, CartDrawer, FounderSection, OrderTracker
- CSS tokens all defined in `/src/frontend/index.css`
- Good structure but visual execution is functional, not premium: spacing is inconsistent, hero area has low visual impact, admin panel lacks visual hierarchy/polish, category filters look plain, footer is sparse, product cards could be more refined

## Requested Changes (Diff)

### Add
- Richer hero section with a decorative banner-strip or angled accent element below the image
- Prominent category filter pills with icon support (leaf for Ghee, snowflake/fork for Paneer)
- A "marquee/announcement" ticker bar at the very top of the store (e.g. "Free delivery above ₹999 | 100% Pure Dairy | Trusted by 10,000+ Families")
- Section dividers with decorative motifs between product grid and footer
- Admin panel: sidebar-style left nav (collapsible on mobile) with icon links for Products, Orders, Store Settings, Founder Info - replacing the current single-scroll layout
- Admin dashboard: top header with gradient background using brand indigo tones
- Admin stats cards: upgrade with gradient icon backgrounds, larger numbers, trend indicator styling
- Improved table rows: alternating subtle row tints, pill-style action buttons
- Admin login: more polished card with glowing ring effect and subtle pattern overlay enhancement

### Modify
- `index.css`: Upgrade primary OKLCH token to a richer saffron (slightly higher chroma), deepen trust-bar background, add new gradient utility classes
- `index.css` admin section: Make dashboard background `oklch(0.94 0.010 258)` (light slate), upgrade header to rich deep indigo gradient, add admin sidebar tokens
- ProductCard: slightly taller image aspect ratio (5/4), add a thin gold-tinted top border accent on hover
- StorePage header: add a thin colored top bar (4px saffron stripe), increase brand name font size, improve tagline styling
- StorePage footer: add a richer dark-background footer section with three-column layout and gradient top-border divider
- AdminLogin: upgrade background to include a more prominent radial glow + subtle wavy SVG decoration
- AdminDashboard: restructure to sidebar + main content layout (sidebar on left, main scrolls on right)

### Remove
- Nothing removed — purely additive/refinement

## Implementation Plan
1. Update `index.css` design tokens: richer primary chroma, new admin sidebar/nav tokens, announcement bar tokens, footer dark tokens, gradient utility classes
2. Update `tailwind.config.js`: add `Bricolage Grotesque` or `Cabinet Grotesk` for admin headings if desired, add new shadow tokens
3. Add announcement ticker bar component at top of StorePage
4. Upgrade StorePage header: top accent stripe, larger logo area, better tagline
5. Upgrade hero: add diagonal accent strip below image, stronger CTA area
6. Upgrade product section: icon-enhanced category filters, cleaner section heading
7. Upgrade StorePage footer: dark background with gradient divider, better grid layout
8. Upgrade ProductCard: taller image, hover gold-border accent
9. Restructure AdminDashboard: add left sidebar navigation with icons (Products, Orders, Store Settings, Founder Info), content area scrolls on right
10. Upgrade AdminDashboard header: deep indigo gradient background
11. Upgrade AdminDashboard stats: gradient icon wrappers, trend arrows
12. Upgrade AdminLogin: richer glow, better card shadow, wavy background decoration
13. Validate: typecheck, lint, build
