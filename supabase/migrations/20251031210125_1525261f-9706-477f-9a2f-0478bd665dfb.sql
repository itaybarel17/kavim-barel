-- Drop the old function
DROP FUNCTION IF EXISTS public.calculate_total_spots_for_area(text);

-- Create improved function that splits days by comma and calculates for each day
CREATE OR REPLACE FUNCTION public.calculate_total_spots_for_area(area_separation text)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  area_days JSONB;
  days_item TEXT;
  individual_day TEXT;
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
  
  -- Loop through each item in the area's days array
  FOR days_item IN SELECT jsonb_array_elements_text(area_days)
  LOOP
    -- Split by comma to handle "ה,ד" format
    -- This handles both single days ("ה") and comma-separated days ("ה,ד")
    FOR individual_day IN 
      SELECT TRIM(unnest(string_to_array(days_item, ',')))
    LOOP
      -- Skip if we already calculated this day
      IF result ? individual_day THEN
        CONTINUE;
      END IF;
      
      -- Calculate sum of averagesupply for customers in this area with this specific day
      SELECT COALESCE(SUM(averagesupply), 0) INTO day_sum
      FROM public.customerlist
      WHERE city_area = area_separation
        AND selected_day = individual_day
        AND averagesupply IS NOT NULL;
      
      -- Add to result object
      result := jsonb_set(result, ARRAY[individual_day], to_jsonb(day_sum));
    END LOOP;
  END LOOP;
  
  RETURN result;
END;
$$;

-- Update all existing areas to recalculate total_spots
UPDATE public.distribution_groups
SET total_spots = public.calculate_total_spots_for_area(separation)
WHERE separation IS NOT NULL;