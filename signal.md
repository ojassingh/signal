# Signal - AI Revenue Analytics Platform

> **Signal is an AI assistant for revenue analytics** that helps founders track which content and channels drive paying customers, then suggests content to scale what's working.

---

## Business Context

### Core Problem

Founders run multiple channels (TikTok, Instagram, influencers, SEO, ads) but can't tell which actually drives revenue. They waste hours analyzing data instead of building. Can't afford $80k/year growth person.

### Solution

Signal provides:
1. **Attribution Analytics** - Track which marketing channels drive actual paying customers
2. **AI-Powered Insights** - Automatically identify what's working and why
3. **Content Generation** - Generate content to scale successful channels
4. **ICP Deep Research** - AI-driven deep research into the user's Ideal Customer Profile (ICP) to provide more contextual and actionable insights

### Target User

Early-stage founders and growth-focused startups who need data-driven marketing insights without hiring expensive growth personnel.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16.0.5 (App Router, RSC) |
| **Language** | TypeScript 5.x |
| **React** | React 19.2.0 |
| **Database** | PostgreSQL via Neon (serverless) |
| **ORM** | Drizzle ORM 0.44.7 |
| **Auth** | Better Auth 1.4.4 |
| **Styling** | Tailwind CSS 4 + CSS Variables |
| **UI Components** | shadcn/ui (new-york style) |
| **State Management** | TanStack React Query 5.x |
| **Email** | Resend |
| **Linting** | Biome 2.3.8 + Ultracite |
| **Package Manager** | Bun |

---

## Project Structure

```
signal/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (app)/               # Authenticated app routes
│   │   │   ├── dashboard/       # Main dashboard
│   │   │   │   ├── [websiteId]/ # Individual site analytics
│   │   │   │   └── components/  # Dashboard-specific components
│   │   │   └── layout.tsx       # Auth-protected layout
│   │   ├── (auth)/              # Authentication routes
│   │   │   ├── sign-in/
│   │   │   ├── sign-up/
│   │   │   └── components/      # Auth UI components
│   │   ├── api/
│   │   │   ├── auth/[...all]/   # Better Auth API handler
│   │   │   └── ingest/          # Analytics event ingestion
│   │   ├── globals.css          # Global styles + CSS variables
│   │   ├── layout.tsx           # Root layout
│   │   └── page.tsx             # Landing page
│   ├── actions/                  # Server Actions
│   │   ├── email.ts             # Email sending (Resend)
│   │   └── sites.ts             # Site CRUD operations
│   ├── components/
│   │   ├── landing-page/        # Marketing page components
│   │   ├── ui/                  # shadcn/ui components
│   │   ├── query-provider.tsx   # React Query provider
│   │   └── theme-provider.tsx   # next-themes provider
│   ├── db/
│   │   ├── drizzle.ts           # Database connection
│   │   └── schema.ts            # Drizzle schema definitions
│   ├── lib/
│   │   ├── auth.ts              # Better Auth server config
│   │   ├── auth-client.ts       # Better Auth client hooks
│   │   ├── errors.ts            # Typed error responses
│   │   ├── types.ts             # TypeScript types
│   │   └── utils.ts             # Utility functions (cn)
│   └── proxy.ts                 # Middleware for auth redirects
├── public/
│   └── track.js                 # Client-side tracking script
├── datasources/                 # (Empty - for future data integrations)
├── migrations/                  # Drizzle migrations output
├── drizzle.config.ts            # Drizzle Kit configuration
├── biome.json                   # Biome linter/formatter config
├── components.json              # shadcn/ui configuration
└── package.json
```

---

## Database Schema

### Core Tables

```typescript
// User (Better Auth managed)
user {
  id: text (PK)
  name: text
  email: text (unique)
  emailVerified: boolean
  image: text?
  createdAt: timestamp
  updatedAt: timestamp
}

// Session (Better Auth managed)
session {
  id: text (PK)
  expiresAt: timestamp
  token: text (unique)
  ipAddress: text?
  userAgent: text?
  userId: text (FK → user.id)
  createdAt: timestamp
  updatedAt: timestamp
}

// Account (OAuth providers)
account {
  id: text (PK)
  accountId: text
  providerId: text
  userId: text (FK → user.id)
  accessToken: text?
  refreshToken: text?
  idToken: text?
  accessTokenExpiresAt: timestamp?
  refreshTokenExpiresAt: timestamp?
  scope: text?
  password: text?
  createdAt: timestamp
  updatedAt: timestamp
}

// Verification tokens
verification {
  id: text (PK)
  identifier: text
  value: text
  expiresAt: timestamp
  createdAt: timestamp
  updatedAt: timestamp
}

// Sites (user's tracked websites)
sites {
  id: uuid (PK, auto-generated)
  ownerId: text (FK → user.id)
  name: text
  domain: text (unique)
  createdAt: timestamp
}

// Site Members (for team collaboration)
siteMembers {
  siteId: uuid (FK → sites.id)
  userId: text (FK → user.id)
  createdAt: timestamp
  PRIMARY KEY (siteId, userId)
}
```

### Relations

- User → Sessions (one-to-many)
- User → Accounts (one-to-many)
- User → Sites (one-to-many as owner)
- User → SiteMembers (many-to-many with Sites)
- Sites → SiteMembers (one-to-many)

---

## Authentication

### Provider: Better Auth

**Server Configuration** (`src/lib/auth.ts`):
- Drizzle adapter with PostgreSQL
- Social providers: GitHub, Google
- Database hooks for user creation (sends welcome email)
- Next.js cookies plugin

**Client Configuration** (`src/lib/auth-client.ts`):
- Exports: `signIn`, `signUp`, `useSession`, `signOut`
- Base URL from `NEXT_PUBLIC_BASE_URL`

### Auth Flow

1. User clicks "Sign In" → `/sign-in`
2. Selects OAuth provider (Google/GitHub)
3. Successful auth → redirect to `/dashboard`
4. Session stored in cookies
5. Protected routes check session in layouts

### Middleware (`src/proxy.ts`)

- `/` with session → redirect to `/dashboard`
- `/dashboard/*` without session → redirect to `/sign-in`

---

## API Routes

### `/api/auth/[...all]`
Better Auth catch-all handler for authentication endpoints.

### `/api/ingest` (POST)
Analytics event ingestion endpoint.

**Request Body:**
```typescript
{
  siteId: string
  visitor_id: string
  event: string
  path: string
  referrer: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  screen_width: number
  screen_height: number
  language: string
  ua: string
  timestamp: string
}
```

**Note:** Currently logs events; Tinybird integration is commented out.

---

## Server Actions

### `src/actions/sites.ts`

```typescript
// Get all sites owned by current user
getUserSites(): Promise<ActionResult<Site[]>>

// Create a new site from URL
createSite(url: string): Promise<ActionResult<Site>>
```

### `src/actions/email.ts`

```typescript
// Send welcome email to new users
sendWelcomeEmail({ email, name }): Promise<void>
```

---

## Client-Side Tracking

The `public/track.js` script is embedded on tracked sites:

```html
<script data-website-id="YOUR_SITE_ID" defer src="https://signal.app/track.js"></script>
```

**Features:**
- Auto-generates persistent visitor ID (localStorage)
- Captures: pageview events, UTM parameters, referrer, screen size, language
- Exposes `window.signal.track(event, props)` for custom events

---

## Type System

### Action Results Pattern

```typescript
type ActionSuccess<T> = { success: true; data: T }
type ActionError = { success: false; error: string }
type ActionResult<T> = ActionSuccess<T> | ActionError
```

### Error Factory

```typescript
SignalError.Auth.Unauthorized()
SignalError.Auth.SessionExpired()
SignalError.Site.InvalidUrl()
SignalError.Site.AlreadyExists()
SignalError.Site.NotFound()
```

---

## Styling System

### Theme Variables

Uses OKLCH color space with CSS variables for:
- Background, foreground, card, popover
- Primary, secondary, muted, accent, destructive
- Border, input, ring
- Chart colors (1-5)
- Sidebar variants

### Dark Mode

Implemented via `next-themes` with:
- System preference detection
- Class-based theme switching (`.dark`)
- Full dark mode color palette

### Custom Components

Button has custom `sexy` variant:
```css
inset-shadow-primary inset-shadow-sm rounded-full border bg-primary...
```

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://...

# Better Auth
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# OAuth Providers
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Email
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# Analytics (planned)
TINYBIRD_TOKEN=
```

---

## Development Commands

```bash
# Install dependencies
bun install

# Run development server
bun dev

# Build for production
bun build

# Start production server
bun start

# Lint code
bun lint

# Format code
bun format

# Database migrations
bunx drizzle-kit generate  # Generate migrations
bunx drizzle-kit push      # Push to database
bunx drizzle-kit studio    # Open Drizzle Studio
```

---

## Current State & TODOs

### Implemented ✅
- [x] Landing page with hero section
- [x] OAuth authentication (GitHub, Google)
- [x] User session management
- [x] Site creation and listing
- [x] Client-side tracking script
- [x] Welcome email on signup
- [x] Dark/light theme support

### Needs Implementation 🚧
- [ ] Analytics dashboard UI (`/dashboard/[websiteId]`)
- [ ] Event data storage (Tinybird or alternative)
- [ ] Revenue tracking integration
- [ ] Channel attribution logic
- [ ] AI-powered insights engine
- [ ] Content generation features
- [ ] ICP deep research functionality
- [ ] Team collaboration features
- [ ] Pricing/billing integration
- [ ] FAQ section on landing page

---

## Architecture Decisions

### Why Better Auth?
- Modern, type-safe authentication
- Built-in Drizzle adapter
- Easy OAuth provider setup
- Database hooks for lifecycle events

### Why Drizzle ORM?
- Type-safe database queries
- PostgreSQL native support
- Excellent DX with Drizzle Kit
- Works well with Neon serverless

### Why React Query?
- Server state management
- Automatic cache invalidation
- Optimistic updates support
- Works seamlessly with Server Actions

### Why Biome + Ultracite?
- Fast, all-in-one linting/formatting
- Consistent code style
- Next.js and React domain rules

---

## Code Conventions

### File Organization
- Feature-based folder structure within route groups
- Components co-located with their routes when specific
- Shared components in `src/components/`

### Naming Conventions
- PascalCase for components
- camelCase for functions and variables
- kebab-case for file names
- TypeScript strict mode enabled

### Import Aliases
```typescript
@/components  → src/components
@/lib         → src/lib
@/db          → src/db
@/actions     → src/actions
@/app         → src/app
```

### Server Actions Pattern
1. Validate session first
2. Return typed `ActionResult<T>`
3. Use `SignalError` factory for errors

---

## AI Agent Guidelines

When working on this codebase:

1. **Authentication**: Always check session before data operations
2. **Database**: Use Drizzle ORM patterns, run migrations after schema changes
3. **Components**: Follow shadcn/ui patterns, use `cn()` for class merging
4. **Actions**: Return `ActionResult<T>` from all server actions
5. **Styling**: Use Tailwind with CSS variables, respect dark mode
6. **Types**: Leverage TypeScript strictly, infer from Drizzle schema
7. **State**: Use React Query for server state, mutations invalidate queries
8. **Errors**: Use SignalError factory for consistent error responses

---

## Future Vision

Signal aims to become the go-to AI marketing analyst for startups by:

1. **Attribution Intelligence** - Know exactly which channels convert
2. **Predictive Analytics** - AI-powered forecasting of channel performance
3. **Content Automation** - Generate high-converting content at scale
4. **ICP Research** - Deep AI research into customer profiles for targeted insights
5. **Competitive Intelligence** - Track what's working for competitors
6. **ROI Optimization** - Maximize marketing spend efficiency

