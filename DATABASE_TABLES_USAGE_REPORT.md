# Database Tables Usage Analysis Report
**Date**: 2025-10-13
**Analysis**: `vapi_assistants` vs `customer_configurations` Tables
**Status**: CRITICAL ARCHITECTURAL ISSUE IDENTIFIED

---

## Executive Summary

Your codebase has **TWO overlapping tables** for storing VAPI assistant data:
1. **`vapi_assistants`** (Migration 005) - **CURRENTLY ACTIVE IN CODE**
2. **`customer_configurations`** (Migration 004) - **LEGACY/PARTIALLY ABANDONED**

**Current Status**: The code is **INCONSISTENTLY** using both tables, causing:
- ❌ Failed webhook lookups (line 124 in `/api/webhooks/vapi/route.ts` is missing `.eq()`)
- ❌ Database errors ("Cannot coerce the result to a single JSON object")
- ❌ Organization lookup failures for assistant calls

---

## 1. Table Definitions

### `vapi_assistants` (Migration 005 - NEWER)
```sql
CREATE TABLE vapi_assistants (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    industry_code VARCHAR(50) NOT NULL,
    language_code VARCHAR(5) DEFAULT 'en',
    vapi_assistant_id VARCHAR(255) UNIQUE NOT NULL,  -- ✅ Unique constraint
    vapi_phone_number VARCHAR(20),
    template_id UUID REFERENCES industry_templates(id),
    business_data JSONB NOT NULL,
    voice_config JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose**: Store assistant configurations with multi-language support

### `customer_configurations` (Migration 004 - OLDER)
```sql
CREATE TABLE customer_configurations (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    industry_template_id UUID REFERENCES industry_templates(id),
    primary_language VARCHAR(5) DEFAULT 'en',
    secondary_languages VARCHAR[] DEFAULT '{}',
    sms_preferences JSONB DEFAULT '{}',
    custom_config JSONB DEFAULT '{}',
    vapi_assistant_id VARCHAR(255),  -- ❌ NO unique constraint
    vapi_phone_number VARCHAR(20),
    twilio_phone_number VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, industry_template_id)
);
```

**Purpose**: Customer-specific AI assistant configurations with SMS settings

---

## 2. Code Usage Analysis

### **PRIMARY TABLE: `vapi_assistants`** ✅

#### **WHERE IT'S USED** (7 locations):

1. **`app/api/webhooks/vapi/route.ts:124`** - **CRITICAL BUG**
   ```typescript
   const { data, error } = await supabase
     .from('vapi_assistants')
     .eq('is_active', true)  // ❌ MISSING .eq('vapi_assistant_id', assistantId)
     .single()
   ```
   **Issue**: Query is incomplete! This is causing the "Cannot coerce result to single JSON object" error because it's trying to return ALL active assistants instead of filtering by assistant ID.

2. **`lib/vapi/multilingual-vapi-service.ts:1064-1081`**
   ```typescript
   // ✅ CORRECT: Saves assistant after creation
   await supabase.from('vapi_assistants').insert({
     organization_id, industry_code, language_code,
     vapi_assistant_id, vapi_phone_number,
     template_id, business_data, voice_config, is_active: true
   })
   ```

3. **`app/api/vapi/assistants/[id]/route.ts:149`**
   ```typescript
   // ✅ CORRECT: Fetches assistant for deletion
   .from('vapi_assistants')
   .select('organization_id, vapi_assistant_id')
   .eq('vapi_assistant_id', params.id)
   ```

4. **`app/api/vapi/assistants/update-language/route.ts:47`**
   ```typescript
   // ✅ CORRECT: Updates language settings
   .from('vapi_assistants')
   .update({ language_code: newLanguage, voice_config })
   .eq('vapi_assistant_id', assistantId)
   ```

5. **`lib/webhooks/language-context.ts:103, 191, 356`**
   ```typescript
   // ✅ CORRECT: Language detection and context loading
   .from('vapi_assistants')
   .select('language_code, business_data, organization_id')
   .eq('vapi_assistant_id', assistantId)
   ```

6. **`app/api/assistants/route.ts:30-41`**
   ```typescript
   // ✅ CORRECT: Lists assistants with phone assignments
   .from('vapi_assistants')
   .select(`*, phone_number_assignments(*)`)
   .in('organization_id', orgIds)
   ```

---

### **SECONDARY TABLE: `customer_configurations`** ⚠️

#### **WHERE IT'S USED** (2 locations):

1. **`app/api/webhooks/vapi/route.ts:144`** - Organization Lookup (Method 2)
   ```typescript
   // ⚠️ FALLBACK: Only used if assistant ID lookup fails
   const { data, error } = await supabase
     .from('customer_configurations')
     .select('organization_id')
     .eq('vapi_phone_number', phoneNumber)
     .eq('is_active', true)
     .single()
   ```

2. **`lib/webhooks/tool-call-handlers.ts:590`** - **UNUSED/ABANDONED**
   ```typescript
   // ❌ UNUSED: Method exists but never called
   private async getCustomerConfiguration(customerId: string) {
     const { data: config } = await supabase
       .from('customer_configurations')
       .select('*')
       .eq('organization_id', customerId)
       .single()
   }
   ```
   **Note**: This method is defined but has **ZERO references** in the codebase.

---

## 3. Architectural Issues

### **Issue #1: Duplicate Data Storage**
- **Problem**: Same data (`vapi_assistant_id`, `vapi_phone_number`, `organization_id`) stored in TWO tables
- **Impact**: Data inconsistency risk, wasted storage, confusion for developers

### **Issue #2: Missing Unique Constraint**
- **`vapi_assistants`**: Has `UNIQUE(vapi_assistant_id)` ✅
- **`customer_configurations`**: NO unique constraint on `vapi_assistant_id` ❌
- **Impact**: Allows duplicate assistant IDs in `customer_configurations`

### **Issue #3: Webhook Lookup Fragmentation**
```typescript
// Current flow in app/api/webhooks/vapi/route.ts:
// Method 1: vapi_assistants (BROKEN - missing WHERE clause)
// Method 2: customer_configurations (WORKS but rarely used)
// Method 3: call_logs (WORKS for follow-up webhooks)
```

### **Issue #4: Abandoned Code**
- `getCustomerConfiguration()` method exists but is **never called**
- `customer_configurations` table appears to be legacy from original multi-language schema

---

## 4. Database Query Bug

### **ROOT CAUSE OF YOUR ERROR** (line 124):

**Current Code** (BROKEN):
```typescript
const { data, error } = await supabase
  .from('vapi_assistants')
  .eq('is_active', true)  // ❌ Only filters by is_active
  .single()  // ❌ Tries to return single row from MULTIPLE matches
```

**What It Does**:
- Queries for ALL active assistants (could be 10, 20, 100+)
- Tries to return single row with `.single()`
- FAILS with "Cannot coerce the result to a single JSON object"

**CORRECT Fix**:
```typescript
const { data, error } = await supabase
  .from('vapi_assistants')
  .select('organization_id, vapi_assistant_id')
  .eq('vapi_assistant_id', assistantId)  // ✅ Filter by assistant ID first
  .eq('is_active', true)
  .single()
```

---

## 5. Migration History

### Timeline:
1. **Migration 004** (Task 1.2): Created `customer_configurations`
   - Purpose: Multi-language customer configs with SMS preferences
   - Included: `vapi_assistant_id`, `vapi_phone_number`, `twilio_phone_number`

2. **Migration 005** (Task 2.1): Created `vapi_assistants`
   - Purpose: Dedicated Vapi assistant storage
   - **Better design**: Unique constraint, cleaner schema
   - **Problem**: Didn't deprecate or migrate data from `customer_configurations`

3. **Current State**: Both tables coexist
   - Code primarily uses `vapi_assistants` ✅
   - `customer_configurations` only used for phone number fallback lookup
   - **No data migration** was performed

---

## 6. Recommendations

### **Option A: Full Migration to `vapi_assistants`** (RECOMMENDED)

**Pros**:
- Single source of truth
- Better schema design (unique constraints)
- Cleaner code architecture

**Steps**:
1. Fix the webhook lookup bug (line 124)
2. Remove `vapi_assistant_id` and `vapi_phone_number` from `customer_configurations`
3. Update phone lookup to use `vapi_assistants` instead
4. Keep `customer_configurations` for SMS preferences only

**Migration SQL**:
```sql
-- 1. Migrate any existing data
INSERT INTO vapi_assistants (
  organization_id, vapi_assistant_id, vapi_phone_number, ...
)
SELECT
  organization_id, vapi_assistant_id, vapi_phone_number, ...
FROM customer_configurations
WHERE vapi_assistant_id IS NOT NULL
ON CONFLICT (vapi_assistant_id) DO NOTHING;

-- 2. Remove duplicate columns
ALTER TABLE customer_configurations
  DROP COLUMN vapi_assistant_id,
  DROP COLUMN vapi_phone_number;
```

### **Option B: Keep Dual System** (NOT RECOMMENDED)

**If you choose this**:
1. Fix the webhook lookup bug immediately
2. Document clear separation of concerns:
   - `vapi_assistants`: Assistant metadata, phone numbers
   - `customer_configurations`: SMS preferences, custom configs only
3. Add foreign key: `customer_configurations.vapi_assistant_id → vapi_assistants.vapi_assistant_id`

---

## 7. Immediate Actions Required

### **CRITICAL FIX** (Do This Now):
```typescript
// File: app/api/webhooks/vapi/route.ts:124
// Current (BROKEN):
const { data, error } = await supabase
  .from('vapi_assistants')
  .eq('is_active', true)
  .single()

// Fixed:
const { data, error } = await supabase
  .from('vapi_assistants')
  .select('organization_id, vapi_assistant_id, vapi_phone_number')
  .eq('vapi_assistant_id', assistantId)
  .eq('is_active', true)
  .single()
```

### **Secondary Fixes**:
1. Remove unused `getCustomerConfiguration()` method from `tool-call-handlers.ts`
2. Update phone number lookup to use `vapi_assistants` instead of `customer_configurations`
3. Add migration to consolidate tables

---

## 8. File Locations Reference

### **Files Using `vapi_assistants`**:
```
✅ app/api/webhooks/vapi/route.ts:124 (BROKEN - needs fix)
✅ lib/vapi/multilingual-vapi-service.ts:1064-1081
✅ app/api/vapi/assistants/[id]/route.ts:149
✅ app/api/vapi/assistants/update-language/route.ts:47
✅ lib/webhooks/language-context.ts:103, 191, 356
✅ app/api/assistants/route.ts:30-41
```

### **Files Using `customer_configurations`**:
```
⚠️ app/api/webhooks/vapi/route.ts:144 (fallback only)
❌ lib/webhooks/tool-call-handlers.ts:590 (unused method)
```

### **Migration Files**:
```
📄 supabase/migrations/004_task_1_2_multilanguage_schema.sql (created customer_configurations)
📄 supabase/migrations/005_create_vapi_assistants.sql (created vapi_assistants)
```

---

## 9. Testing Checklist

After implementing fixes:

- [ ] Create test assistant via UI
- [ ] Verify assistant record in `vapi_assistants` table
- [ ] Make test call to assistant
- [ ] Confirm webhook successfully identifies organization
- [ ] Check logs for "✅ Found organization by assistant ID"
- [ ] Verify no "PGRST116" errors
- [ ] Test phone number fallback lookup
- [ ] Confirm tool calls work (book_appointment, etc.)

---

## 10. Conclusion

**Current State**: Your system is using `vapi_assistants` as the primary table, but has incomplete queries causing webhook failures.

**Immediate Action**: Fix line 124 in `app/api/webhooks/vapi/route.ts` by adding `.eq('vapi_assistant_id', assistantId)`

**Long-term**: Consolidate to single table (`vapi_assistants`) and deprecate assistant-related columns from `customer_configurations`

**Risk Level**: 🔴 HIGH - Webhooks are currently failing for all VAPI calls

---

**Report Generated**: 2025-10-13
**Analysis Tool**: Claude Code Pattern Search
**Files Analyzed**: 26 files, 2 database migrations, 7 API routes
