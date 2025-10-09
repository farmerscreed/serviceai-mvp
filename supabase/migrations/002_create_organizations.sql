-- ============================================================================
-- ORGANIZATIONS & MULTI-TENANCY SCHEMA
-- Migration 002: Create organizations, members, and invitations tables
-- ============================================================================

-- ============================================================================
-- TABLE: organizations
-- Core tenant/organization table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic info
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    industry_code VARCHAR(50), -- Links to industry templates (Task 1.4)
    
    -- Ownership
    owner_id UUID NOT NULL REFERENCES auth.users(id),
    
    -- Settings
    primary_language VARCHAR(5) DEFAULT 'en' CHECK (primary_language IN ('en', 'es')),
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    
    -- Billing (will be used in Task 0.3)
    stripe_customer_id VARCHAR(255) UNIQUE,
    subscription_status VARCHAR(50) DEFAULT 'trial',
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE: organization_members
-- Junction table for users <-> organizations with roles
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Role hierarchy: owner > admin > member
    role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Audit
    invited_by UUID REFERENCES auth.users(id),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Each user can only have one membership per organization
    UNIQUE(organization_id, user_id)
);

-- ============================================================================
-- TABLE: organization_invitations
-- Pending invitations to join organizations
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.organization_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    
    -- Invitation details
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'member')), -- Cannot invite as owner
    
    -- Security
    token VARCHAR(255) UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
    
    -- Audit
    invited_by UUID NOT NULL REFERENCES auth.users(id),
    accepted_at TIMESTAMPTZ,
    
    -- Expiration (7 days default)
    expires_at TIMESTAMPTZ NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate pending invitations
    UNIQUE(organization_id, email, status)
);

-- ============================================================================
-- INDEXES
-- Optimized for common queries
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_organizations_owner ON public.organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_active ON public.organizations(is_active);

CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON public.organization_members(role);
CREATE INDEX IF NOT EXISTS idx_org_members_active ON public.organization_members(is_active);

CREATE INDEX IF NOT EXISTS idx_org_invitations_token ON public.organization_invitations(token);
CREATE INDEX IF NOT EXISTS idx_org_invitations_email ON public.organization_invitations(email);
CREATE INDEX IF NOT EXISTS idx_org_invitations_status ON public.organization_invitations(status);
CREATE INDEX IF NOT EXISTS idx_org_invitations_org ON public.organization_invitations(organization_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- Complete data isolation between organizations
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: organizations
-- ============================================================================

-- Users can view organizations they're members of
DROP POLICY IF EXISTS "Users can view their organizations" ON public.organizations;
CREATE POLICY "Users can view their organizations"
ON public.organizations FOR SELECT
USING (
    id IN (
        SELECT organization_id
        FROM public.organization_members
        WHERE user_id = auth.uid()
        AND is_active = TRUE
    )
);

-- Users can create organizations
DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations;
CREATE POLICY "Users can create organizations"
ON public.organizations FOR INSERT
WITH CHECK (auth.uid() = owner_id);

-- Owners and admins can update their organizations
DROP POLICY IF EXISTS "Owners and admins can update organizations" ON public.organizations;
CREATE POLICY "Owners and admins can update organizations"
ON public.organizations FOR UPDATE
USING (
    id IN (
        SELECT organization_id
        FROM public.organization_members
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND is_active = TRUE
    )
);

-- Only owners can delete organizations
DROP POLICY IF EXISTS "Only owners can delete organizations" ON public.organizations;
CREATE POLICY "Only owners can delete organizations"
ON public.organizations FOR DELETE
USING (
    id IN (
        SELECT organization_id
        FROM public.organization_members
        WHERE user_id = auth.uid()
        AND role = 'owner'
        AND is_active = TRUE
    )
);

-- ============================================================================
-- RLS POLICIES: organization_members
-- ============================================================================

-- Users can view members of their organizations
DROP POLICY IF EXISTS "Users can view organization members" ON public.organization_members;
CREATE POLICY "Users can view organization members"
ON public.organization_members FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id
        FROM public.organization_members
        WHERE user_id = auth.uid()
        AND is_active = TRUE
    )
);

-- Owners and admins can add members
DROP POLICY IF EXISTS "Owners and admins can add members" ON public.organization_members;
CREATE POLICY "Owners and admins can add members"
ON public.organization_members FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id
        FROM public.organization_members
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND is_active = TRUE
    )
);

-- Owners and admins can update members (change roles, deactivate)
DROP POLICY IF EXISTS "Owners and admins can update members" ON public.organization_members;
CREATE POLICY "Owners and admins can update members"
ON public.organization_members FOR UPDATE
USING (
    organization_id IN (
        SELECT organization_id
        FROM public.organization_members
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND is_active = TRUE
    )
);

-- Owners and admins can remove members
DROP POLICY IF EXISTS "Owners and admins can remove members" ON public.organization_members;
CREATE POLICY "Owners and admins can remove members"
ON public.organization_members FOR DELETE
USING (
    organization_id IN (
        SELECT organization_id
        FROM public.organization_members
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND is_active = TRUE
    )
);

-- ============================================================================
-- RLS POLICIES: organization_invitations
-- ============================================================================

-- Users can view invitations for their organizations
DROP POLICY IF EXISTS "Members can view organization invitations" ON public.organization_invitations;
CREATE POLICY "Members can view organization invitations"
ON public.organization_invitations FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id
        FROM public.organization_members
        WHERE user_id = auth.uid()
        AND is_active = TRUE
    )
    OR
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Owners and admins can create invitations
DROP POLICY IF EXISTS "Owners and admins can create invitations" ON public.organization_invitations;
CREATE POLICY "Owners and admins can create invitations"
ON public.organization_invitations FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id
        FROM public.organization_members
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND is_active = TRUE
    )
);

-- Owners and admins can update invitations (revoke, etc.)
DROP POLICY IF EXISTS "Owners and admins can update invitations" ON public.organization_invitations;
CREATE POLICY "Owners and admins can update invitations"
ON public.organization_invitations FOR UPDATE
USING (
    organization_id IN (
        SELECT organization_id
        FROM public.organization_members
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND is_active = TRUE
    )
);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get user's organizations with role info
CREATE OR REPLACE FUNCTION public.get_user_organizations(p_user_id UUID)
RETURNS TABLE (
    organization_id UUID,
    organization_name VARCHAR,
    organization_slug VARCHAR,
    industry_code VARCHAR,
    user_role VARCHAR,
    is_owner BOOLEAN,
    is_active BOOLEAN,
    member_count BIGINT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.id,
        o.name,
        o.slug,
        o.industry_code,
        om.role,
        (om.role = 'owner') AS is_owner,
        o.is_active,
        (SELECT COUNT(*) FROM public.organization_members WHERE organization_id = o.id AND is_active = TRUE),
        o.created_at
    FROM public.organizations o
    INNER JOIN public.organization_members om ON o.id = om.organization_id
    WHERE om.user_id = p_user_id
    AND om.is_active = TRUE
    AND o.is_active = TRUE
    ORDER BY om.role DESC, o.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has required role in organization
CREATE OR REPLACE FUNCTION public.user_has_role(
    p_user_id UUID,
    p_organization_id UUID,
    p_required_role VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
    user_role VARCHAR;
    role_hierarchy INT;
    required_hierarchy INT;
BEGIN
    -- Get user's role in the organization
    SELECT role INTO user_role
    FROM public.organization_members
    WHERE user_id = p_user_id
    AND organization_id = p_organization_id
    AND is_active = TRUE;

    -- If user is not a member, return false
    IF user_role IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Role hierarchy: owner(3) > admin(2) > member(1)
    role_hierarchy := CASE user_role
        WHEN 'owner' THEN 3
        WHEN 'admin' THEN 2
        WHEN 'member' THEN 1
        ELSE 0
    END;

    required_hierarchy := CASE p_required_role
        WHEN 'owner' THEN 3
        WHEN 'admin' THEN 2
        WHEN 'member' THEN 1
        ELSE 0
    END;

    -- User has required role if their hierarchy >= required hierarchy
    RETURN role_hierarchy >= required_hierarchy;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate slug format (lowercase alphanumeric + hyphens)
CREATE OR REPLACE FUNCTION public.validate_slug(p_slug VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN p_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to generate slug from name
CREATE OR REPLACE FUNCTION public.generate_slug(p_name VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    base_slug VARCHAR;
    final_slug VARCHAR;
    counter INT := 0;
BEGIN
    -- Convert to lowercase, replace spaces with hyphens, remove special chars
    base_slug := lower(regexp_replace(p_name, '[^a-zA-Z0-9\s-]', '', 'g'));
    base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
    base_slug := regexp_replace(base_slug, '-+', '-', 'g');
    base_slug := trim(both '-' from base_slug);
    
    final_slug := base_slug;
    
    -- Check for uniqueness and append counter if needed
    WHILE EXISTS (SELECT 1 FROM public.organizations WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired invitations
CREATE OR REPLACE FUNCTION public.cleanup_expired_invitations()
RETURNS INT AS $$
DECLARE
    updated_count INT;
BEGIN
    UPDATE public.organization_invitations
    SET status = 'expired'
    WHERE status = 'pending'
    AND expires_at < NOW();
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to update updated_at timestamp on organizations
CREATE OR REPLACE FUNCTION public.update_organization_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_organizations_timestamp ON public.organizations;
CREATE TRIGGER update_organizations_timestamp
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_organization_timestamp();

-- Trigger to update updated_at timestamp on organization_members
DROP TRIGGER IF EXISTS update_organization_members_timestamp ON public.organization_members;
CREATE TRIGGER update_organization_members_timestamp
    BEFORE UPDATE ON public.organization_members
    FOR EACH ROW
    EXECUTE FUNCTION public.update_organization_timestamp();

-- ============================================================================
-- GRANTS
-- Ensure proper permissions
-- ============================================================================
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

GRANT ALL ON public.organizations TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;

GRANT ALL ON public.organization_members TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_members TO authenticated;

GRANT ALL ON public.organization_invitations TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_invitations TO authenticated;

-- Grant execute on helper functions
GRANT EXECUTE ON FUNCTION public.get_user_organizations(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_role(UUID, UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_slug(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_slug(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_invitations() TO authenticated, service_role;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify tables were created
DO $$
BEGIN
    ASSERT (SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('organizations', 'organization_members', 'organization_invitations')) = 3,
            'Not all tables were created';
    
    RAISE NOTICE 'Migration 002 completed successfully!';
    RAISE NOTICE 'Created tables: organizations, organization_members, organization_invitations';
    RAISE NOTICE 'Created RLS policies for complete data isolation';
    RAISE NOTICE 'Created helper functions for role checking and organization management';
END $$;

