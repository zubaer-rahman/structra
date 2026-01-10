-- Featured Projects Query
-- This query fetches both featured projects and projects by featured contractors
-- Use this query in your application to get the complete list of featured content

-- Query for featured projects (both admin-selected and featured contractor projects)
WITH featured_projects AS (
  -- Featured projects (admin selected) - only include projects with selected proposals
  SELECT 
    p.id,
    p.project_title,
    p.statement_of_work,
    p.budget,
    p.category,
    p.location,
    p.project_type,
    p.status,
    p.start_date,
    p.end_date,
    p.substantial_completion,
    p.project_photos,
    p.is_featured_project,
    p.creator,
    u.full_name as homeowner_name,
    u.profile_photo as homeowner_photo,
    pr_featured.contractor::uuid as contractor_id,
    contractor_user_featured.full_name::text as contractor_name,
    contractor_user_featured.profile_photo::text as contractor_photo,
    cp_featured.business_name::text as business_name,
    cp_featured.logo::text as contractor_logo,
    NULL::timestamp as featured_contractor_expiry,
    'featured_project' as feature_type
  FROM projects p
  JOIN users u ON p.creator = u.id
  JOIN proposals pr_featured ON p.id = pr_featured.project
  JOIN contractor_profiles cp_featured ON pr_featured.contractor = cp_featured.user_id
  JOIN users contractor_user_featured ON cp_featured.user_id = contractor_user_featured.id
  WHERE p.is_featured_project = TRUE
    AND p.status = 'Completed'
    AND p.location IS NOT NULL
    AND pr_featured.is_selected = 'yes'
),
featured_contractor_projects AS (
  -- Projects by featured contractors
  SELECT 
    p.id,
    p.project_title,
    p.statement_of_work,
    p.budget,
    p.category,
    p.location,
    p.project_type,
    p.status,
    p.start_date,
    p.end_date,
    p.substantial_completion,
    p.project_photos,
    p.is_featured_project,
    p.creator,
    u.full_name as homeowner_name,
    u.profile_photo as homeowner_photo,
    pr.contractor::uuid as contractor_id,
    contractor_user.full_name::text as contractor_name,
    contractor_user.profile_photo::text as contractor_photo,
    cp.business_name::text as business_name,
    cp.logo::text as contractor_logo,
    cp.featured_contractor_expiry::timestamp as featured_contractor_expiry,
    'featured_contractor' as feature_type
  FROM projects p
  JOIN users u ON p.creator = u.id
  JOIN proposals pr ON p.id = pr.project
  JOIN contractor_profiles cp ON pr.contractor = cp.user_id
  JOIN users contractor_user ON cp.user_id = contractor_user.id
  WHERE cp.is_featured_contractor = TRUE
    AND (cp.featured_contractor_expiry IS NULL OR cp.featured_contractor_expiry > NOW())
    AND p.status = 'Completed'
    AND p.location IS NOT NULL
    AND pr.is_selected = 'yes'
)
-- Combine both types of featured projects
SELECT * FROM (
  SELECT * FROM featured_projects
  UNION ALL
  SELECT * FROM featured_contractor_projects
) combined_projects
-- Order by: 1st featured contractor expiry (newest first), then by substantial completion (newest first)
ORDER BY 
  CASE WHEN featured_contractor_expiry IS NOT NULL THEN featured_contractor_expiry ELSE '1900-01-01'::timestamp END DESC,
  substantial_completion DESC NULLS LAST
LIMIT 12;
