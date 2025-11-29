# Jamalpur Tabligh Companion Management System

## Overview

A full-stack web application for managing Tabligh (Islamic missionary) activities in the Jamalpur district of Bangladesh. The system enables tracking of members, mosques, and halqas (circles/groups) across different thanas (subdivisions) and unions. It features role-based access control with three user types: super_admin, manager, and member. The application supports Bengali and English languages with a modern glassmorphism design aesthetic.

## Recent Changes (November 2025)

### Registration Form
- Added হালকা (Halka) field in correct order: থানা → ইউনিয়ন → হালকা → মসজিদ
- Halka selection is optional and depends on union selection

### CSV Import/Export
- Added CSV import functionality for members, mosques, and halqas
- Available in Settings section for super_admin users only
- Import format matches export format for easy data round-trip
- Row-level Zod validation with detailed error messages
- CSV column orders:
  - Members: নাম, ফোন, ইমেইল, থানা, ইউনিয়ন, তাবলীগ কার্যক্রম
  - Mosques: মসজিদের নাম, ঠিকানা, ইমামের ফোন, মুয়াজ্জিনের ফোন, থানা, ইউনিয়ন
  - Halqas: হালকার নাম, থানা, ইউনিয়ন

### Filter Management
- Filters (search, thana, union) now reset automatically when switching views

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18 with TypeScript
- Vite as build tool and development server
- TanStack Query (React Query) for server state management
- Wouter for client-side routing
- shadcn/ui component library with Radix UI primitives
- Tailwind CSS for styling with custom glassmorphism design system

**Design Philosophy:**
- Mobile-first responsive design with native app-like interactions
- Hybrid Material Design foundation with glassmorphism aesthetic overlay
- Bengali (Hind Siliguri) and English (Inter) typography support
- Custom color system supporting light/dark modes via CSS variables
- Glass effect cards with backdrop blur and semi-transparent backgrounds

**Component Structure:**
- Reusable UI components in `client/src/components/ui/` (shadcn/ui)
- Business logic components in `client/src/components/`
- Page-level components in `client/src/pages/`
- Custom hooks in `client/src/hooks/`
- Path aliases configured (`@/` maps to `client/src/`, `@shared/` to shared types)

**State Management:**
- Authentication state managed via React Context (`AuthProvider`)
- Server state cached and synchronized with TanStack Query
- Session-based authentication with HTTP-only cookies
- Query key patterns support filtering (e.g., by thana, union, search terms)

### Backend Architecture

**Technology Stack:**
- Node.js with Express.js framework
- TypeScript with ES modules
- Session-based authentication using express-session
- bcrypt for password hashing
- Drizzle ORM for database operations

**API Structure:**
- RESTful API endpoints under `/api` prefix
- Session middleware for authentication state
- Role-based middleware (`requireAuth`, `requireRole`) for authorization
- Separate development (`index-dev.ts`) and production (`index-prod.ts`) entry points
- Development mode integrates Vite middleware for HMR

**Authentication & Authorization:**
- Session-based auth with PostgreSQL session store (connect-pg-simple)
- Three user roles: `super_admin`, `manager`, `member`
- Password hashing with bcrypt (10 rounds)
- Protected routes require authentication middleware
- Role-specific access control for admin features

**Data Layer:**
- Centralized storage interface (`IStorage`) in `server/storage.ts`
- CRUD operations for users, thanas, unions, mosques, and halqas
- Search and filtering capabilities with Drizzle ORM
- Cascading deletes for hierarchical data (thana → union → mosque)

### Database Architecture

**ORM & Migrations:**
- Drizzle ORM with PostgreSQL dialect
- Schema defined in `shared/schema.ts` (shared between client and server)
- Zod schemas generated from Drizzle schemas for validation
- Migration files in `./migrations/` directory

**Database Schema:**

**Users Table:**
- Primary key: UUID (auto-generated)
- Fields: name, email, phone (unique), password (hashed), role
- Foreign keys: thanaId, unionId, mosqueId (optional)
- Array field: tabligActivities (text array of activity IDs)

**Thanas Table:**
- Administrative subdivisions in Jamalpur district
- Fields: name (unique), nameBn (Bengali name)

**Unions Table:**
- Sub-divisions within thanas
- Foreign key: thanaId (cascade delete)
- Fields: name, nameBn

**Mosques Table:**
- Foreign keys: thanaId, unionId (cascade delete)
- Fields: name, address, phone (optional)

**Halqas Table:**
- Groups/circles for organizing members
- Foreign keys: thanaId, unionId (cascade delete)
- Fields: name

**Data Hierarchy:**
- Thana → Union → Mosque/Halqa
- Users can be associated with any level of the hierarchy
- Cascading deletes maintain referential integrity

### Design System

**Glassmorphism Implementation:**
- CSS custom properties in `index.css` for theme variables
- `.glass` utility class for backdrop blur and transparency
- Gradient mesh backgrounds (purple/blue/teal tones)
- Layered blur hierarchy (navigation > cards > overlays)
- Border radius: rounded-2xl for cards, rounded-xl for inputs

**Responsive Breakpoints:**
- Mobile-first approach with Tailwind's default breakpoints
- Bottom navigation for mobile (<768px)
- Sidebar navigation for desktop (≥768px)
- Sticky positioning for filters and navigation

**Typography Scale:**
- Bengali text: Hind Siliguri (Google Fonts)
- English/numbers: Inter (Google Fonts)
- Font weights: 300-700 range
- Heading sizes: 24-48px, Body: 14-18px

## External Dependencies

### Database
- **Neon Serverless PostgreSQL**: Cloud-hosted PostgreSQL database
- Connection via `@neondatabase/serverless` package
- Connection string in `DATABASE_URL` environment variable
- Session store: `connect-pg-simple` for PostgreSQL-backed sessions

### UI Component Libraries
- **Radix UI**: Headless UI primitives for accessible components
  - Dialog, Dropdown, Select, Checkbox, Radio, Tabs, Toast, etc.
  - 20+ component primitives used throughout the application
- **shadcn/ui**: Pre-built component library configuration
  - Configured in `components.json`
  - "new-york" style variant with neutral base color
  - Components in `client/src/components/ui/`

### Font Services
- **Google Fonts**: CDN-hosted web fonts
  - Hind Siliguri: Bengali language support
  - Inter: English and numbers

### Development Tools
- **Replit Plugins** (development only):
  - `@replit/vite-plugin-runtime-error-modal`: Error overlay
  - `@replit/vite-plugin-cartographer`: Code navigation
  - `@replit/vite-plugin-dev-banner`: Development banner

### Build & Development
- **Vite**: Frontend build tool and dev server
- **esbuild**: Backend bundler for production builds
- **tsx**: TypeScript execution for development server

### Validation & Forms
- **Zod**: Schema validation library
- **drizzle-zod**: Generate Zod schemas from Drizzle schemas
- **@hookform/resolvers**: React Hook Form integration with Zod
- **zod-validation-error**: User-friendly validation error messages

### Date & Time
- **date-fns**: Date manipulation and formatting library
- Used for timestamp formatting and date calculations

### Utilities
- **class-variance-authority**: Type-safe variant management for components
- **clsx** & **tailwind-merge**: Conditional className utilities
- **cmdk**: Command palette component (if implemented)
- **nanoid**: Unique ID generation