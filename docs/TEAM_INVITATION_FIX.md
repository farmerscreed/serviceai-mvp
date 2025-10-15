# Team Invitation API Fix

## Issue Summary

**Problem**: When trying to send team member invitations, the request failed with:
- **404 Error**: `POST /api/organizations/{id}/invite` - endpoint not found
- **Error Message**: `Unexpected token '<', "<!DOCTYPE "... is not valid JSON` (HTML 404 page being returned instead of JSON)

**Additional Issues Found**:
- Database relationship errors when fetching members
- Permission denied when accessing invitations

---

## Root Cause

The team settings page was calling the wrong API endpoint:
- **Called**: `/api/organizations/${organizationId}/invite`
- **Should Be**: `/api/organizations/invitations/create`

Additionally, the request was missing the `organization_id` field that the API expects.

---

## Fix Applied

### File Modified: `app/settings/team/page.tsx`

**Changed Lines 99-140** (handleInvite function):

#### Before (WRONG):
```typescript
const handleInvite = async (e: React.FormEvent) => {
  e.preventDefault()

  if (!inviteForm.email.trim()) {
    toast.warning('Please enter an email address')
    return
  }

  setInviteLoading(true)
  try {
    const response = await fetch(`/api/organizations/${currentOrganization?.organization_id}/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: inviteForm.email,
        role: inviteForm.role
      }),
    })
    // ... rest of handler
  }
}
```

#### After (CORRECT):
```typescript
const handleInvite = async (e: React.FormEvent) => {
  e.preventDefault()

  // Added organization validation
  if (!currentOrganization) {
    toast.error('No organization selected')
    return
  }

  if (!inviteForm.email.trim()) {
    toast.warning('Please enter an email address')
    return
  }

  setInviteLoading(true)
  try {
    // Fixed endpoint and added organization_id to body
    const response = await fetch('/api/organizations/invitations/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organization_id: currentOrganization.organization_id,  // ← ADDED
        email: inviteForm.email,
        role: inviteForm.role
      }),
    })
    // ... rest of handler
  }
}
```

---

## API Endpoint Details

### Correct Endpoint: `/api/organizations/invitations/create`

**Method**: POST

**Required Fields**:
```json
{
  "organization_id": "uuid",
  "email": "string",
  "role": "admin" | "member"
}
```

**Response** (Success):
```json
{
  "success": true,
  "invitation": { ... },
  "message": "Invitation created successfully"
}
```

**Response** (Error):
```json
{
  "error": "Error message"
}
```

**Validation**:
- ✅ Checks if user has admin/owner permissions
- ✅ Validates email format
- ✅ Checks for duplicate invitations
- ✅ Checks if user is already a member
- ✅ Sets 7-day expiration

---

## Additional Issues to Address

### 1. Database Relationship Error

**Error**:
```
Could not find a relationship between 'organization_members' and 'user_profiles' in the schema cache
```

**Cause**: Missing foreign key relationship in Supabase

**Solution Needed**: Add foreign key relationship in database migration:
```sql
ALTER TABLE organization_members
ADD CONSTRAINT fk_organization_members_user
FOREIGN KEY (user_id)
REFERENCES user_profiles(id)
ON DELETE CASCADE;
```

### 2. Permission Denied on Users Table

**Error**:
```
permission denied for table users
```

**Cause**: The code is trying to access `auth.users` table directly which is restricted

**Current Code** (lines 64-68 in create/route.ts):
```typescript
.from('auth.users')  // ← Not allowed!
.select('id')
.eq('email', email)
```

**Solution Needed**: Use Supabase auth API instead:
```typescript
// Replace direct table access with auth API
const { data: { users } } = await supabase.auth.admin.listUsers()
const existingUser = users?.find(u => u.email === email)
```

Or create a database function to check this:
```sql
CREATE OR REPLACE FUNCTION get_user_id_by_email(user_email TEXT)
RETURNS UUID AS $$
  SELECT id FROM auth.users WHERE email = user_email;
$$ LANGUAGE SQL SECURITY DEFINER;
```

---

## Testing Checklist

- [x] Fix invitation endpoint URL
- [x] Add organization_id to request payload
- [x] Add organization validation
- [ ] Test sending invitation to new email
- [ ] Test duplicate invitation prevention
- [ ] Test invalid email validation
- [ ] Test permission checks (non-admin users)
- [ ] Fix database relationship error
- [ ] Fix users table permission issue

---

## Status

✅ **Primary Fix Applied**: Team invitation endpoint corrected
⏳ **Database Issues**: Need to be addressed separately
⏳ **Testing**: Needs manual testing to verify

---

## Next Steps

1. **Test the invitation flow**: Try sending an invitation again
2. **Database migration**: Fix the organization_members → user_profiles relationship
3. **Permission fix**: Update the create invitation route to avoid direct auth.users access
4. **Edge function**: Implement email sending (TODO in code)

---

**Fixed**: 2025-10-11
**File Modified**: `app/settings/team/page.tsx`
