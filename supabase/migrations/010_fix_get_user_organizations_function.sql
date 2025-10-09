-- Fix ambiguous column reference in get_user_organizations by fully qualifying names
-- and avoid shadowing PL/pgSQL variables

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
        o.id AS organization_id,
        o.name AS organization_name,
        o.slug AS organization_slug,
        o.industry_code AS industry_code,
        om.role AS user_role,
        (om.role = 'owner') AS is_owner,
        o.is_active AS is_active,
        (
          SELECT COUNT(*)
          FROM public.organization_members om2
          WHERE om2.organization_id = o.id
            AND om2.is_active = TRUE
        ) AS member_count,
        o.created_at AS created_at
    FROM public.organizations o
    INNER JOIN public.organization_members om ON o.id = om.organization_id
    WHERE om.user_id = p_user_id
      AND om.is_active = TRUE
      AND o.is_active = TRUE
    ORDER BY om.role DESC, o.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


