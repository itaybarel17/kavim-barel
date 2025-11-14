-- Drop and recreate function to support both customerlist and candycustomerlist
DROP FUNCTION IF EXISTS public.fill_distribution_fields_from_customerlist() CASCADE;

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
  -- Try to get area and day information from customerlist first
  SELECT 
    COALESCE(cl.newarea, cl.city_area), 
    cl.extraarea,
    cl.selected_day,
    cl.selected_day_extra
  INTO main_area, extra_area, day_main, day_extra
  FROM public.customerlist cl
  WHERE cl.customernumber = NEW.customernumber;

  -- If not found in customerlist, try candycustomerlist
  IF main_area IS NULL THEN
    SELECT 
      COALESCE(ccl.newarea, ccl.city_area), 
      ccl.extraarea,
      ccl.selected_day,
      ccl.selected_day_extra
    INTO main_area, extra_area, day_main, day_extra
    FROM public.candycustomerlist ccl
    WHERE ccl.customernumber = NEW.customernumber;
  END IF;

  -- Set ezor1, ezor2, day1, day2
  NEW.ezor1 := main_area;
  NEW.ezor2 := extra_area;
  NEW.day1 := day_main;
  NEW.day2 := day_extra;

  RETURN NEW;
END;
$$;

-- Recreate trigger on mainorder
CREATE TRIGGER fill_distribution_fields_before_insert_update
BEFORE INSERT OR UPDATE ON public.mainorder
FOR EACH ROW
EXECUTE FUNCTION public.fill_distribution_fields_from_customerlist();