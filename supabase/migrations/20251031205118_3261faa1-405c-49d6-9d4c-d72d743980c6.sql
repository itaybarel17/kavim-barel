
-- Drop the old function
DROP FUNCTION IF EXISTS public.calculate_total_spots_for_area(text);

-- Create improved function that loops through all days in the area's days array
CREATE OR REPLACE FUNCTION public.calculate_total_spots_for_area(area_separation text)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  area_days JSONB;
  day_value TEXT;
  day_sum NUMERIC;
  result JSONB := '{}'::JSONB;
BEGIN
  -- Get the days for this area
  SELECT days INTO area_days
  FROM public.distribution_groups
  WHERE separation = area_separation;
  
  -- If no area found, return empty object
  IF area_days IS NULL THEN
    RETURN '{}'::JSONB;
  END IF;
  
  -- Loop through each day in the area's days array
  FOR day_value IN SELECT jsonb_array_elements_text(area_days)
  LOOP
    -- Calculate sum of averagesupply for customers in this area with this specific day
    SELECT COALESCE(SUM(averagesupply), 0) INTO day_sum
    FROM public.customerlist
    WHERE city_area = area_separation
      AND selected_day = day_value
      AND selected_day NOT LIKE '%,%'  -- Ensure single day only
      AND averagesupply IS NOT NULL;
    
    -- Add to result object
    result := jsonb_set(result, ARRAY[day_value], to_jsonb(day_sum));
  END LOOP;
  
  RETURN result;
END;
$$;

-- Update all existing areas to recalculate total_spots
UPDATE public.distribution_groups
SET total_spots = public.calculate_total_spots_for_area(separation)
WHERE separation IS NOT NULL;
