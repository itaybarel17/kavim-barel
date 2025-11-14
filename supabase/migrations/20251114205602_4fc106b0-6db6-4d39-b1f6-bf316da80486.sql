-- Update existing mainorder records to use new area name
UPDATE public.mainorder 
SET ezor1 = 'שרון דרום'
WHERE ezor1 = 'שרון';

UPDATE public.mainorder 
SET ezor2 = 'שרון דרום'
WHERE ezor2 = 'שרון';

-- Drop old functions with CASCADE to remove dependent triggers
DROP FUNCTION IF EXISTS public.fill_distribution_fields_from_candy_before() CASCADE;
DROP FUNCTION IF EXISTS public.update_distribution_fields_from_candy_after() CASCADE;

-- Create new function that uses customerlist instead of candycustomerlist
CREATE OR REPLACE FUNCTION public.fill_distribution_fields_from_customerlist()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO ''
AS $$
DECLARE
  main_area TEXT;
  extra_area TEXT;
  day_main TEXT;
  day_extra TEXT;
BEGIN
  -- Get area and day information from customerlist
  SELECT 
    COALESCE(cl.newarea, cl.city_area), 
    cl.extraarea,
    cl.selected_day
  INTO main_area, extra_area, day_main
  FROM public.customerlist cl
  WHERE cl.customernumber = NEW.customernumber;

  -- Get extra day if there's an extra area
  IF extra_area IS NOT NULL THEN
    SELECT cl.selected_day_extra INTO day_extra
    FROM public.customerlist cl
    WHERE cl.customernumber = NEW.customernumber;
  END IF;

  -- Set ezor1 (main area)
  NEW.ezor1 := main_area;
  NEW.ezor2 := extra_area;
  NEW.day1 := day_main;
  NEW.day2 := day_extra;

  RETURN NEW;
END;
$$;

-- Create trigger on mainorder for before insert or update
CREATE TRIGGER fill_distribution_fields_before_insert_update
BEFORE INSERT OR UPDATE ON public.mainorder
FOR EACH ROW
EXECUTE FUNCTION public.fill_distribution_fields_from_customerlist();