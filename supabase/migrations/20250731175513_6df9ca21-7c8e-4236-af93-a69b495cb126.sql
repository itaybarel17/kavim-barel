-- Add triggers for customerlist and candycustomerlist to update city_area
CREATE TRIGGER update_city_area_customerlist_trigger
  BEFORE INSERT OR UPDATE ON customerlist
  FOR EACH ROW
  EXECUTE FUNCTION update_city_area();

CREATE TRIGGER update_city_area_candycustomerlist_trigger
  BEFORE INSERT OR UPDATE ON candycustomerlist
  FOR EACH ROW
  EXECUTE FUNCTION update_city_area();

-- Create enhanced function that searches both customerlist and candycustomerlist
CREATE OR REPLACE FUNCTION public.update_mainorder_areas_and_days_enhanced()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  main_area TEXT;
  extra_area TEXT;
  day_main TEXT;
  day_extra TEXT;
BEGIN
  -- First try to get data from customerlist
  SELECT 
    COALESCE(cl.newarea, cl.city_area), 
    cl.extraarea
  INTO main_area, extra_area
  FROM customerlist cl
  WHERE cl.customernumber = NEW.customernumber;

  -- If not found in customerlist, try candycustomerlist
  IF main_area IS NULL THEN
    SELECT 
      COALESCE(ccl.newarea, ccl.city_area), 
      ccl.extraarea
    INTO main_area, extra_area
    FROM candycustomerlist ccl
    WHERE ccl.customernumber = NEW.customernumber;
  END IF;

  -- Get distribution days for areas
  SELECT day INTO day_main 
  FROM distribution_groups 
  WHERE separation = main_area;

  SELECT day INTO day_extra 
  FROM distribution_groups 
  WHERE separation = extra_area;

  -- Update the order fields
  NEW.ezor1 := 
    CASE 
      WHEN main_area IS NOT NULL AND extra_area IS NOT NULL THEN '[' || main_area || ', ' || extra_area || ']'
      WHEN main_area IS NOT NULL THEN '[' || main_area || ']'
      ELSE NULL
    END;

  NEW.ezor2 := extra_area;
  NEW.day1 := day_main;
  NEW.day2 := day_extra;

  RETURN NEW;
END;
$function$;

-- Replace the existing mainorder trigger with the enhanced version
DROP TRIGGER IF EXISTS update_mainorder_areas_and_days_trigger ON mainorder;

CREATE TRIGGER update_mainorder_areas_and_days_enhanced_trigger
  BEFORE INSERT OR UPDATE ON mainorder
  FOR EACH ROW
  EXECUTE FUNCTION update_mainorder_areas_and_days_enhanced();