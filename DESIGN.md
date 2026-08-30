# Design — Project Identity

> This document is project-long-lived. Tokens are not changed without
> the Architect's approval. Developers MUST use these tokens
> instead of improvising their own colors/spacings.

## Style Direction

Dunkle, glamouröse Red-Carpet-Optik mit tiefem Samtschwarz, Champagner-Elfenbein und Goldakzent; elegante Serifen-Display-Typografie trifft auf klare, ruhige UI-Struktur nach Linear/Stripe-Vorbild.

## Colors

- `--color-bg`: **#161110**
- `--color-surface`: **#1F1815**
- `--color-surface_raised`: **#2A211C**
- `--color-fg`: **#F4EBDC**
- `--color-muted`: **#A69782**
- `--color-accent`: **#D4AF37**
- `--color-accent_hover`: **#E3C25C**
- `--color-accent_active`: **#B8942C**
- `--color-border`: **#3A2F27**
- `--color-danger`: **#E06C5B**
- `--color-danger_hover`: **#EC8474**
- `--color-success`: **#7FB58B**
- `--color-overlay`: **rgba(10, 8, 7, 0.72)**

## Typography

- `font_family`: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif
- `display_font_family`: 'Didot', 'Bodoni MT', 'Playfair Display', 'Times New Roman', Georgia, serif
- `heading_weight`: 600
- `body_weight`: 400
- `size_scale`: 12px, 14px, 16px, 20px, 28px, 36px, 48px

## Spacing Scale

- `--space-0`: 4px
- `--space-1`: 8px
- `--space-2`: 12px
- `--space-3`: 16px
- `--space-4`: 24px
- `--space-5`: 32px
- `--space-6`: 48px
- `--space-7`: 64px

## Border-Radii

- `--radius-sm`: 4px
- `--radius-md`: 8px
- `--radius-lg`: 16px
- `--radius-pill`: 999px

## Components

### Button

Min-height 44px (mobile tap), padding 12px 24px, radius md, font-weight 600, letter-spacing 0.02em. Primary: bg=accent, color=#161110, border 1px solid transparent; hover bg=accent_hover; active bg=accent_active + transform translateY(1px); disabled opacity 0.45, cursor not-allowed. Secondary: bg transparent, color=fg, border 1px solid border; hover bg=surface_raised, border=accent; active bg=surface; disabled opacity 0.45. Danger: bg=danger, color=#161110; hover bg=danger_hover; active dunkler. Focus-visible: outline 2px solid accent, offset 2px.

### Card

bg=surface, border 1px solid border, radius lg, padding 16px, subtle top highlight (1px rgba(244,235,220,0.06) inset). Hover: border-color accent, translateY(-2px), shadow 0 12px 28px rgba(0,0,0,0.35); transition 160ms ease.

### Input

Min-height 44px, padding 10px 14px, bg=#0F0C0B, color=fg, border 1px solid border, radius md, font-size 14px. Placeholder color=muted. Focus: border accent, box-shadow 0 0 0 3px rgba(212,175,55,0.18). Error: border danger. Label: font-size 14px, font-weight 600, margin-bottom 8px.

### Modal

Overlay bg=overlay, backdrop-filter blur(3px); panel bg=surface_raised, border 1px solid border, radius lg, padding 24px, max-width 480px, centered, shadow 0 24px 60px rgba(0,0,0,0.5). Header with display serif title 28px and close icon button 44x44px.

### Navbar

Höhe 64px, bg rgba(22,17,16,0.85) mit backdrop-filter blur(8px), border-bottom 1px solid border, sticky top. Links: color=muted, font-weight 500, padding 8px 12px; hover color=fg; active color=accent mit 1px goldener Unterstreichung. App-Name in display serif, 20px, gold.

### Badge/Chip

Für Kategorien: padding 4px 12px, radius pill, bg=surface_raised, border 1px solid border, color=muted, font-size 12px, font-weight 500, min-height 28px. Selected: bg rgba(212,175,55,0.14), border accent, color=accent. Hover: border accent, color=fg.

### EmptyState

Zentriert, padding 48px 24px, gestrichelter Border 1px solid border, radius lg, bg=surface. Icon/Silhouette 48px in muted, Titel 20px display serif color=fg, Beschreibung 14px color=muted, darunter sekundärer Button.

### Toast/Feedback

Fixiert oben rechts, max-width 360px, bg=surface_raised, border 1px solid border, radius md, padding 12px 16px, shadow. Success: linker 3px Balken success; Error: linker Balken danger. Text 14px color=fg, auto-dismiss 4s.

### OutfitCard

Wie Card, zusätzlich Vorschau-Raster 3 Spalten mit 48px großen Bild-Thumbnails (radius md, object-fit cover, bg=#0F0C0B), Outfit-Name in display serif 20px, Meta-Zeile muted 12px.

### ImageThumb

Quadratisch, bg=#0F0C0B, border 1px solid border, radius md, object-fit cover, Breite im Garderoben-Grid 100%, Seitenverhältnis 1:1, hover: border accent. Platzhalter ohne Bild: zentrierte Kleiderbügel-Silhouette in muted.

## Layout Principles

- Container max-width 1200px, zentriert mit padding 16px (mobile) bzw. 24px (desktop).
- Breakpoints: mobile <640px, tablet 640-1023px, desktop >=1024px.
- Garderoben-Grid: 2 Spalten mobil, 3 Spalten ab 640px, 4 Spalten ab 1024px, gap 16px; Outfit-Liste analog.
- Abschnittsabstand: 32px mobile, 48px desktop; Sektionen mit serifen Display-Überschrift 28-36px.
- Formulare: einspaltig, max-width 560px; primäre Aktion oben, destruktive Aktion klar getrennt.
- Auth-Ansichten: zentrierte Karte max-width 420px auf dunklem Hintergrund mit dezentem goldenem Radial-Glow.
