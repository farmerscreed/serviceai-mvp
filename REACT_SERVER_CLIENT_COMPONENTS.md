# React Server & Client Component Best Practices

## Problem Solved

Fixed React Server Component error: "Only plain objects can be passed to Client Components from Server Components. Classes or other objects with methods are not supported."

### Root Cause

In Next.js App Router, Server Components (default) cannot pass React component instances (like Lucide icons) as props to Client Components. React components are functions/classes with methods, not plain serializable objects.

## Solution

### ❌ Before (Incorrect)

**Server Component (app/page.tsx):**
```typescript
import { Phone, Globe, Zap } from 'lucide-react'
import { FeatureGrid } from '@/components/marketing/FeatureCard'

const features = [
  {
    icon: Phone,  // ❌ Passing component instance
    title: "AI Phone Assistant",
    description: "..."
  }
]

export default function HomePage() {
  return <FeatureGrid features={features} />
}
```

**Client Component (components/marketing/FeatureCard.tsx):**
```typescript
'use client'
import { LucideIcon } from 'lucide-react'

interface FeatureCardProps {
  icon: LucideIcon  // ❌ Receiving component instance from server
  title: string
  description: string
}

export function FeatureCard({ icon: Icon, ...props }: FeatureCardProps) {
  return <Icon className="w-6 h-6" />
}
```

### ✅ After (Correct)

**Server Component (app/page.tsx):**
```typescript
import { FeatureGrid } from '@/components/marketing/FeatureCard'

const features = [
  {
    iconName: 'Phone' as const,  // ✅ Passing string
    title: "AI Phone Assistant",
    description: "..."
  }
]

export default function HomePage() {
  return <FeatureGrid features={features} />
}
```

**Client Component (components/marketing/FeatureCard.tsx):**
```typescript
'use client'
import * as LucideIcons from 'lucide-react'

type IconName = keyof typeof LucideIcons

interface FeatureCardProps {
  iconName: IconName  // ✅ Receiving string
  title: string
  description: string
}

export function FeatureCard({ iconName, ...props }: FeatureCardProps) {
  const Icon = LucideIcons[iconName] as LucideIcons.LucideIcon  // ✅ Import icon in client component
  return <Icon className="w-6 h-6" />
}
```

## Key Principles

1. **Server Components** (default in Next.js App Router)
   - Can only pass serializable data to Client Components
   - Use strings, numbers, plain objects, arrays
   - Cannot pass: functions, component instances, class instances

2. **Client Components** (`'use client'` directive)
   - Can use hooks, event handlers, browser APIs
   - Can import and use component libraries directly
   - Receive serializable props from Server Components

3. **Icon Passing Pattern**
   - Server → Client: Pass icon **name** as string
   - Client: Import icon library and resolve by name
   - Type-safe with TypeScript literal types

## When Icons Work Directly

Icons work fine when both components are Client Components:

```typescript
'use client'
import { Phone } from 'lucide-react'

export function MyClientComponent() {
  const Icon = Phone  // ✅ OK - both in same client component
  return <Icon />
}
```

## Files Changed

- `app/page.tsx` - Changed `icon:` to `iconName:` with string values
- `components/marketing/FeatureCard.tsx` - Updated to accept `iconName` string and resolve icon in client component

## Verification

Run the dev server and check for React warnings:
```bash
npm run dev
curl http://localhost:3000 | grep -i "error"
```

Should return no React Server Component errors.

## Future Development

When creating new components that accept icons:

1. If **both components are client-side**: Pass icon component directly
2. If **server → client boundary**: Pass icon name as string, resolve in client component
3. Always mark components with `'use client'` if they use hooks, event handlers, or browser APIs

## Reference

- [Next.js Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [React Server Components](https://react.dev/reference/rsc/server-components)
- [Next.js Client Components](https://nextjs.org/docs/app/building-your-application/rendering/client-components)
