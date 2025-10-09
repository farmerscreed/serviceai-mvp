# Manual TypeScript Types Generation

Since we can't link to the Supabase project directly, here's how to generate TypeScript types manually:

## Method 1: Supabase Dashboard (Recommended)

1. **Go to your Supabase project dashboard**
   - Navigate to: https://supabase.com/dashboard/project/omozkxchmsgwbmlzunze

2. **Access the API section**
   - Go to **Settings** → **API**
   - Scroll down to **Generate types**

3. **Generate TypeScript types**
   - Click **Generate types**
   - Copy the generated TypeScript code
   - Save it as `lib/supabase/database.types.ts`

## Method 2: Using Supabase CLI (Alternative)

If you have access to the project through a different account or method:

```bash
# Try linking with a different approach
supabase link --project-ref omozkxchmsgwbmlzunze --password YOUR_DB_PASSWORD

# Generate types
supabase gen types typescript --linked > lib/supabase/database.types.ts
```

## Method 3: Manual Type Definition

If the above methods don't work, I can create a manual type definition file based on our schema. Let me know if you need this approach.

## What to Look For in Generated Types

The generated types should include:

```typescript
// Key interfaces to look for:
export interface Database {
  public: {
    Tables: {
      organization_settings: {
        Row: {
          organization_id: string
          default_language: string
          supported_languages: string[]
          // ... other fields
        }
        // ... other types
      }
      industry_templates: {
        Row: {
          id: string
          industry_code: string
          language_code: string
          // ... other fields
        }
        // ... other types
      }
      // ... other tables
    }
    Functions: {
      get_organization_settings: {
        Args: {
          p_organization_id: string
        }
        Returns: {
          organization_id: string
          default_language: string
          // ... other fields
        }
      }
      // ... other functions
    }
  }
}
```

## Next Steps After Types Generation

1. **Update your Supabase client** to use the new types
2. **Test the database functions** with sample data
3. **Create sample industry templates** for testing
4. **Implement the template engine** (Task 1.3)

## Verification

After generating types, run the verification script:
- Copy `scripts/verify_migration.sql` to your Supabase SQL Editor
- Run it to confirm everything is working
- Check that all functions return expected results
