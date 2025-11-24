# Design Guidelines - Jamalpur Tabligh Companion Management System

## Design Approach

**Hybrid Approach**: Material Design foundation with Glassmorphism aesthetic overlay
- Base structure follows Material Design principles for data-heavy interfaces
- Visual treatment applies modern glassmorphism for contemporary feel
- Mobile-first philosophy with native app-like interactions

## Typography

**Bengali + English Support**:
- Primary: 'Hind Siliguri' (Google Fonts) - optimized for Bengali
- Secondary: 'Inter' for English/numbers
- Headings: 600-700 weight, sizes 24px-32px (mobile), 32px-48px (desktop)
- Body text: 400-500 weight, 14px-16px (mobile), 16px-18px (desktop)
- Form labels: 500 weight, 13px-14px
- Buttons/CTAs: 600 weight, 14px-16px

## Layout System

**Tailwind Spacing Primitives**: Use 2, 4, 6, 8, 12, 16 units
- Card padding: p-6 (mobile), p-8 (desktop)
- Section spacing: py-12 (mobile), py-16 (desktop)
- Form field gaps: gap-4 to gap-6
- Grid gaps: gap-4 (mobile), gap-6 (desktop)

**Container Strategy**:
- Dashboard: max-w-7xl with px-4 (mobile), px-6 (desktop)
- Forms: max-w-2xl centered
- Data tables: w-full with horizontal scroll on mobile

## Glassmorphism Treatment

**Card Components**:
- Background: Semi-transparent white/light backdrop (backdrop-blur-xl)
- Border: Subtle 1px border with opacity
- Shadow: Soft, elevated shadow (shadow-xl with custom blur)
- Border radius: rounded-2xl for cards, rounded-xl for inputs

**Layering Hierarchy**:
- Page background: Gradient mesh (purple/blue/teal tones)
- Navigation/Header: Highest blur, most opacity
- Content cards: Medium blur, semi-transparent
- Overlays/Modals: Darkest backdrop with strongest blur

## Component Library

### Navigation & Header
- **Top Navigation Bar**: Full-width glassmorphic bar, sticky positioning
- Elements: Logo, role indicator badge, notification bell, user avatar dropdown
- Mobile: Hamburger menu with slide-out drawer (glassmorphic)

### Dashboard Cards
- **Stat Cards**: 2-column grid (mobile), 4-column (desktop)
- Content: Large number, label, icon, trend indicator
- **Recent Activity Feed**: Timeline-style with glassmorphic list items

### Forms & Inputs
- **Registration Form**: Multi-step with progress indicator at top
- **Input Fields**: Glassmorphic backgrounds, focused state with enhanced glow
- **Checkboxes** (for Tabligh activities): Custom checkboxes with icons, arranged in 2-column grid (mobile), 3-column (desktop)
- **Dropdowns**: Cascading selects for Thana → Union → Mosque hierarchy

### Data Display
- **Tables**: Glassmorphic table with alternating row subtle highlights
- Mobile: Card-based layout for each row with expand/collapse
- **Filter Bar**: Sticky glassmorphic bar above tables with search, thana/union filters

### Buttons
- **Primary**: Glassmorphic with gradient overlay, medium shadows
- **Secondary**: Outline style with glassmorphic hover
- **Icon Buttons**: Circular, glassmorphic, for actions (edit/delete/view)

### Modals & Overlays
- **Modal**: Centered glassmorphic card on darkened backdrop-blur
- **Side Panel**: Slide-in from right for detail views (mobile full-screen)

## Mobile-First Specifics

**App-Like Interactions**:
- Bottom navigation bar for main sections (Dashboard, Mosques, Halqa, Profile)
- Swipe gestures for navigation between sections
- Pull-to-refresh on data lists
- Floating action button (FAB) for primary actions (+ Add Mosque/Companion)

**Touch Targets**: Minimum 44px height for all interactive elements

**Responsive Breakpoints**:
- Mobile: < 768px (single column, bottom nav)
- Tablet: 768px-1024px (2-column layouts, side nav appears)
- Desktop: > 1024px (multi-column, full sidebar)

## Role-Based UI Differentiation

**Visual Indicators**:
- Super Admin: Purple accent throughout interface
- Manager: Blue accent
- Member/Companion: Teal accent

**Dashboard Variations**:
- Super Admin: Full system overview, manager management, all CRUD operations
- Manager: Mosque/Halqa management focus, member viewing
- Member: Personal profile, Tabligh activity checkboxes, assigned mosque info

## Settings Panel

**Layout**: Tabbed interface with categories (System, Users, Data, Backup)
- Toggle switches for system configurations
- Data export/import with progress indicators
- User role assignment table

## Images

**No Hero Images**: This is a utility dashboard application - no marketing/landing pages required

**Iconography**: Material Icons via CDN for consistent icon language throughout (mosque icons, user icons, location pins, activity markers)

**Background Treatment**: Instead of images, use:
- Gradient mesh backgrounds (CSS gradients)
- Subtle geometric patterns in glassmorphic layers
- Islamic geometric patterns as subtle watermarks in cards (SVG)

## Bangla/Bengali Language Considerations

- Ensure adequate line-height (1.6-1.8) for Bengali script readability
- Right-align form labels and left-align inputs for natural Bengali reading flow
- Date pickers support Bengali calendar alongside Gregorian
- Number formatting supports Bengali numerals option in settings