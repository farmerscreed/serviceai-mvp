-- Create function to get template with language fallback to English

CREATE OR REPLACE FUNCTION public.get_template_with_fallback(
  p_industry_code VARCHAR,
  p_language_code VARCHAR DEFAULT 'en'
)
RETURNS SETOF public.industry_templates AS $$
BEGIN
  -- Try requested language
  RETURN QUERY
  SELECT * FROM public.industry_templates
  WHERE industry_code = p_industry_code
    AND language_code = p_language_code
    AND is_active = TRUE
  ORDER BY version DESC
  LIMIT 1;

  -- Fallback to English
  IF NOT FOUND AND p_language_code <> 'en' THEN
    RETURN QUERY
    SELECT * FROM public.industry_templates
    WHERE industry_code = p_industry_code
      AND language_code = 'en'
      AND is_active = TRUE
    ORDER BY version DESC
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;


