-- Migration 040: Add Site Amenities to projects table
-- This adds comprehensive site amenities tracking similar to Airbnb's "What this place offers"
-- Includes categories for Power, Sanitation, Water, Parking, Comfort, Safety, Security, and Logistics

-- Add site_amenities column (JSONB to store amenities object)
ALTER TABLE projects 
ADD COLUMN site_amenities JSONB DEFAULT '{}';

-- Add comment to document the purpose and structure of this field
COMMENT ON COLUMN projects.site_amenities IS 'Site amenities available at the project location. Structure: {
  "power": ["indoor_receptacle", "outdoor_receptacle", "20_amp_receptacle", etc.],
  "sanitation": ["flushing_toilets", "portable_toilets"],
  "water": ["indoor_tap", "outdoor_tap"],
  "parking": ["1_space", "2_spaces", "3_spaces", etc.],
  "comfort": ["indoor_break_area", "outdoor_sheltered_break_area", "wifi", etc.],
  "safety": ["first_aid_kit", "fire_extinguisher", "spill_kit"],
  "security": ["key_to_be_provided", "homeowner_managed", "security_guards", etc.],
  "logistics": ["trailer_storage", "materials_storage", "contractor_signage_allowed", etc.]
}';

-- Create index on site_amenities for performance (GIN index for JSONB)
CREATE INDEX idx_projects_site_amenities ON projects USING GIN (site_amenities);

-- Add constraint to ensure site_amenities is always an object
ALTER TABLE projects 
ADD CONSTRAINT check_site_amenities_is_object 
CHECK (jsonb_typeof(site_amenities) = 'object');

-- Create a function to get default "not included" amenities
-- This will be used by the application to show what's NOT included by default
CREATE OR REPLACE FUNCTION get_default_not_included_amenities()
RETURNS JSONB AS $$
BEGIN
  RETURN '{
    "power": ["indoor_receptacle", "2_plus_indoor_receptacles", "outdoor_receptacle", "2_plus_outdoor_receptacles", "20_amp_receptacle", "30_amp_receptacle", "50_amp_receptacle"],
    "sanitation": ["flushing_toilets", "portable_toilets"],
    "water": ["indoor_tap", "outdoor_tap"],
    "parking": ["1_space", "2_spaces", "3_spaces", "4_spaces", "5_plus_spaces"]
  }'::JSONB;
END;
$$ LANGUAGE plpgsql;

-- Add comment for the function
COMMENT ON FUNCTION get_default_not_included_amenities() IS 'Returns the default list of amenities that are NOT included unless explicitly selected. Used to show contractors what amenities are not available at the site.';

-- Create a function to check if sanitation is properly handled
-- This ensures that if no toilets are selected, sanitation shows as "not included"
CREATE OR REPLACE FUNCTION validate_sanitation_amenities(amenities JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- If sanitation is not provided or is empty array, it's valid (will show as not included)
  IF amenities IS NULL OR amenities = '{}'::JSONB THEN
    RETURN TRUE;
  END IF;
  
  -- If sanitation key exists, check if it's an array
  IF amenities ? 'sanitation' THEN
    RETURN jsonb_typeof(amenities->'sanitation') = 'array';
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add constraint to validate sanitation amenities
ALTER TABLE projects 
ADD CONSTRAINT check_sanitation_amenities_valid 
CHECK (validate_sanitation_amenities(site_amenities));

-- Create a view to easily query projects with amenities
CREATE OR REPLACE VIEW projects_with_amenities AS
SELECT 
  p.*,
  COALESCE(p.site_amenities, '{}'::JSONB) as amenities,
  -- Helper columns to check specific amenity categories
  COALESCE(p.site_amenities->'power', '[]'::JSONB) as power_amenities,
  COALESCE(p.site_amenities->'sanitation', '[]'::JSONB) as sanitation_amenities,
  COALESCE(p.site_amenities->'water', '[]'::JSONB) as water_amenities,
  COALESCE(p.site_amenities->'parking', '[]'::JSONB) as parking_amenities,
  COALESCE(p.site_amenities->'comfort', '[]'::JSONB) as comfort_amenities,
  COALESCE(p.site_amenities->'safety', '[]'::JSONB) as safety_amenities,
  COALESCE(p.site_amenities->'security', '[]'::JSONB) as security_amenities,
  COALESCE(p.site_amenities->'logistics', '[]'::JSONB) as logistics_amenities
FROM projects p;

-- Add comment for the view
COMMENT ON VIEW projects_with_amenities IS 'View that provides easy access to project amenities with helper columns for each category.';

-- Create indexes for common amenity queries
CREATE INDEX idx_projects_amenities_power ON projects USING GIN ((site_amenities->'power'));
CREATE INDEX idx_projects_amenities_sanitation ON projects USING GIN ((site_amenities->'sanitation'));
CREATE INDEX idx_projects_amenities_parking ON projects USING GIN ((site_amenities->'parking'));
