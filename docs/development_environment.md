# Development Environment Documentation

## Overview
The development environment is built on Next.js 15 with Turbopack for fast hot module replacement, TypeScript 5 for type safety, and Tailwind CSS v4 for styling. The setup emphasizes rapid development cycles with optimized build processes and comprehensive tooling integration.

## Architecture
The development environment follows a modern JAMstack architecture with server-side rendering capabilities. It uses Turbopack for development builds, providing near-instant hot module replacement. The architecture separates concerns between the Next.js application layer, Supabase backend services, and various development tools integrated through MCP (Model Context Protocol) servers.

## File Structure
```
Development Configuration Files:
├── package.json              # NPM scripts and dependencies
├── package-lock.json         # Locked dependency versions
├── next.config.ts            # Next.js configuration
├── tsconfig.json             # TypeScript configuration
├── tailwind.config.ts        # Tailwind CSS configuration
├── postcss.config.mjs        # PostCSS configuration
├── eslint.config.mjs         # ESLint configuration
├── components.json           # shadcn/ui component configuration
├── .env.example              # Environment variable template
├── .env.local                # Local environment variables
├── .mcp.json                 # MCP server configurations
├── .gitignore                # Git ignore patterns
└── next-env.d.ts             # Next.js TypeScript definitions
```

## Core Components

### Package Configuration (package.json)
```json
{
  "name": "exam-paper-viewer",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

The package.json defines four essential scripts:
- **dev**: Starts development server with Turbopack for fast HMR
- **build**: Creates production-optimized build
- **start**: Runs production server
- **lint**: Validates code quality with ESLint

### Next.js Configuration (next.config.ts)
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
};
```

Configuration enables:
- Remote image optimization for Supabase storage
- Modern image formats (AVIF, WebP) for performance
- Automatic image optimization pipeline

### TypeScript Configuration (tsconfig.json)
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "strict": true,
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Key TypeScript settings:
- **Strict mode**: Enforces type safety
- **Bundler resolution**: Optimized for Next.js bundling
- **Incremental compilation**: Faster subsequent builds
- **Path aliases**: Clean imports with @/ prefix

## Data Flow

### Development Server Flow
1. **Turbopack bundler** processes TypeScript/JSX files
2. **Hot Module Replacement** injects changes without page reload
3. **React Fast Refresh** preserves component state during updates
4. **Middleware** handles authentication on each request
5. **Server Components** render on the server with fresh data
6. **Client Components** hydrate with interactive functionality

### Build Process Flow
1. **TypeScript compilation** validates types
2. **Next.js bundling** creates optimized chunks
3. **Tailwind CSS** generates utility classes
4. **PostCSS** processes CSS with plugins
5. **Image optimization** prepares responsive formats
6. **Static generation** pre-renders pages where possible

## Key Functions and Hooks

### Development Server Initialization
```bash
npm run dev
# Equivalent to: next dev --turbopack
```

Turbopack provides:
- 700x faster updates than Webpack
- Incremental compilation
- Automatic code splitting
- Tree shaking in development

### Environment Variable Loading
```typescript
// Accessed via process.env
process.env.NEXT_PUBLIC_SUPABASE_URL
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Environment variables are loaded from:
1. `.env.local` (highest priority)
2. `.env.development.local` (dev only)
3. `.env` (defaults)

## Integration Points

### MCP Server Integrations (.mcp.json)
```json
{
  "mcpServers": {
    "playwright": {
      "type": "stdio",
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    },
    "figma-dev-mode-mcp-server": {
      "type": "http",
      "url": "http://127.0.0.1:3845/mcp"
    },
    "shadcn-ui": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@jpisnice/shadcn-ui-mcp-server"]
    },
    "supabase": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase@latest"]
    }
  }
}
```

MCP servers provide:
- **Playwright**: Browser automation for testing
- **Figma**: Design-to-code integration
- **shadcn/ui**: Component library access
- **Supabase**: Database management tools

### Tailwind CSS Integration
```typescript
// tailwind.config.ts
const config: Config = {
  darkMode: "class",
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Custom warm color palette
        "cream": { 50: "#FFFEFB", ... },
        "salmon": { 400: "#E59C84", ... },
        "coral": { 400: "#FB923C", ... }
      }
    }
  }
}
```

Tailwind v4 features:
- PostCSS-based processing
- Custom color system with warm palette
- Component-specific variants
- Animation utilities via tailwindcss-animate

## Configuration

### Environment Variables (.env.local)
```bash
# Required Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
NEXT_PUBLIC_SITE_URL=https://[domain]

# Development-specific (optional)
# NODE_ENV=development (auto-set by Next.js)
# NEXT_TELEMETRY_DISABLED=1 (disable telemetry)
```

### ESLint Configuration (eslint.config.mjs)
```javascript
import { FlatCompat } from "@eslint/eslintrc";

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];
```

Enforces:
- Next.js best practices
- Core Web Vitals compliance
- TypeScript type checking
- React hooks rules

### PostCSS Configuration (postcss.config.mjs)
```javascript
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

Enables Tailwind CSS v4 processing pipeline with optimized builds.

## Type Definitions

### shadcn/ui Component Configuration (components.json)
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui"
  }
}
```

Configures:
- React Server Components support
- TypeScript components
- Path aliases for clean imports
- CSS variable-based theming

## Implementation Details

### Hot Reload Setup with Turbopack
Turbopack is enabled via the `--turbopack` flag in the dev script. It provides:

1. **Incremental computation**: Only rebuilds changed modules
2. **Function-level caching**: Caches individual function outputs
3. **Lazy compilation**: Compiles only requested routes
4. **Persistent caching**: Maintains cache across restarts

### Development Middleware Pipeline
```typescript
// src/middleware.ts
export async function middleware(request: NextRequest) {
  // Authentication checks
  const { data: { user } } = await supabase.auth.getUser()
  
  // Route protection logic
  if (!user && isProtectedPage) {
    return NextResponse.redirect('/auth/signin')
  }
  
  // Onboarding flow management
  if (user && !profile?.onboarding_completed) {
    return NextResponse.redirect('/onboarding')
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)',]
}
```

Middleware runs on every request in development, handling:
- Authentication state
- Route protection
- Onboarding flow
- Cookie management

### Query Client Isolation (providers.tsx)
```typescript
function makeQueryClient(userId?: string) {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: userId ? CACHE_TIMES.DYNAMIC_DATA.staleTime : 0,
        gcTime: userId ? CACHE_TIMES.DYNAMIC_DATA.gcTime : 0,
      }
    }
  })
  
  // Tag client with user ID for debugging
  Object.defineProperty(client, '__userId', {
    value: userId,
    writable: false
  })
  
  return client
}
```

Development features:
- Per-user query client instances
- Cache isolation between sessions
- Debug tagging for cache inspection
- Automatic cleanup on user change

## Dependencies

### Core Dependencies
- **next**: 15.4.6 - React framework with App Router
- **react**: 19.1.0 - UI library
- **react-dom**: 19.1.0 - React DOM renderer
- **typescript**: ^5 - Type safety

### Development Dependencies
- **@tailwindcss/postcss**: ^4.1.12 - CSS processing
- **eslint**: ^9 - Code quality
- **eslint-config-next**: 15.4.6 - Next.js linting rules
- **@types/node**: ^20 - Node.js types
- **@types/react**: ^19 - React types

### Data Management
- **@tanstack/react-query**: ^5.85.0 - Server state management
- **@supabase/supabase-js**: ^2.55.0 - Database client
- **@supabase/ssr**: ^0.6.1 - SSR support

### UI Components
- **@radix-ui/react-***: Various - Headless UI primitives
- **tailwindcss-animate**: ^1.0.7 - Animation utilities
- **lucide-react**: ^0.539.0 - Icon library

## API Reference

### Development Scripts
```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run ESLint
npm run lint

# Type checking (implicit in build)
npx tsc --noEmit
```

### Environment Variable Reference
```bash
# Required
NEXT_PUBLIC_SUPABASE_URL      # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY # Public anonymous key
NEXT_PUBLIC_SITE_URL           # Production site URL

# Auto-set by Next.js
NODE_ENV                       # development | production
PORT                           # Server port (default: 3000)

# Optional optimizations
NEXT_TELEMETRY_DISABLED        # Disable anonymous telemetry
ANALYZE                        # Enable bundle analyzer
```

### Build Output Structure
```
.next/
├── app-build-manifest.json    # App router build manifest
├── build-manifest.json        # Page mappings
├── cache/                     # Build cache
│   ├── webpack/              # Webpack cache (production)
│   └── turbopack/            # Turbopack cache (development)
├── server/                    # Server-side code
├── static/                    # Static assets
└── types/                     # Generated TypeScript types
```

## Other Notes

### Performance Optimizations
1. **Turbopack in Development**: 700x faster HMR than Webpack
2. **Incremental TypeScript**: Faster subsequent compilations
3. **Image Optimization**: Automatic AVIF/WebP conversion
4. **Code Splitting**: Automatic route-based splitting
5. **React Server Components**: Reduced client bundle size

### Development Best Practices
1. Use `npm run dev` for development (enables Turbopack)
2. Keep `.env.local` for sensitive configuration
3. Utilize path aliases (@/) for clean imports
4. Leverage TypeScript strict mode for type safety
5. Use React Server Components by default
6. Client Components only when interactivity needed

### Common Development Tasks
```bash
# Install new dependency
npm install [package-name]

# Add dev dependency
npm install -D [package-name]

# Update dependencies
npm update

# Clean build cache
rm -rf .next

# Type check without building
npx tsc --noEmit

# Analyze bundle size
ANALYZE=true npm run build
```

### Debugging Tools
1. **React DevTools**: Component inspection
2. **Redux DevTools**: Query cache inspection (TanStack Query)
3. **Network tab**: API request monitoring
4. **Console**: Development logs and warnings
5. **Lighthouse**: Performance auditing

### Known Quirks
- Turbopack may require restart after installing new dependencies
- Environment variables prefixed with `NEXT_PUBLIC_` are exposed to browser
- Middleware runs on every request, including static assets (filtered by matcher)
- Hot reload preserves React state but not module-level variables
- TypeScript incremental compilation cache occasionally needs clearing
```