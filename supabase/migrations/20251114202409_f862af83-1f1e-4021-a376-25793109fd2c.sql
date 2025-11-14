-- 1. Drop the trigger for days change (no longer needed)
DROP TRIGGER IF EXISTS trigger_update_total_spots_on_days ON public.distribution_groups;

-- 2. Drop the function for days change
DROP FUNCTION IF EXISTS public.update_total_spots_on_days_change();

-- 3. Temporarily drop foreign key constraints to allow updates
ALTER TABLE public.customerlist DROP CONSTRAINT IF EXISTS customerlist_newarea_fkey;
ALTER TABLE public.customerlist DROP CONSTRAINT IF EXISTS customerlist_extraarea_fkey;
ALTER TABLE public.candycustomerlist DROP CONSTRAINT IF EXISTS candycustomerlist_newarea_fkey;
ALTER TABLE public.candycustomerlist DROP CONSTRAINT IF EXISTS candycustomerlist_extraarea_fkey;

-- 4. Update area names in all tables - maintaining the numbers at the end
-- distribution_groups
UPDATE public.distribution_groups 
SET separation = REPLACE(separation, 'תל אביב-יפו', 'דרום תל אביב')
WHERE separation LIKE 'תל אביב-יפו%';

UPDATE public.distribution_groups 
SET separation = REPLACE(separation, 'חיפה-קריות', 'חיפה')
WHERE separation LIKE 'חיפה-קריות%';

UPDATE public.distribution_groups 
SET separation = REPLACE(separation, 'שרון ', 'שרון דרום ')
WHERE separation LIKE 'שרון %' AND separation NOT LIKE 'שרון צפון%' AND separation NOT LIKE 'שרון דרום%';

-- cities table
UPDATE public.cities 
SET area = 'דרום תל אביב' 
WHERE area = 'תל אביב-יפו';

UPDATE public.cities 
SET area = 'חיפה' 
WHERE area = 'חיפה-קריות';

UPDATE public.cities 
SET area = 'שרון דרום' 
WHERE area = 'שרון';

-- customerlist table - maintaining numbers
UPDATE public.customerlist 
SET city_area = REPLACE(city_area, 'תל אביב-יפו', 'דרום תל אביב')
WHERE city_area LIKE 'תל אביב-יפו%';

UPDATE public.customerlist 
SET city_area = REPLACE(city_area, 'חיפה-קריות', 'חיפה')
WHERE city_area LIKE 'חיפה-קריות%';

UPDATE public.customerlist 
SET city_area = REPLACE(city_area, 'שרון ', 'שרון דרום ')
WHERE city_area LIKE 'שרון %' AND city_area NOT LIKE 'שרון צפון%' AND city_area NOT LIKE 'שרון דרום%';

UPDATE public.customerlist 
SET newarea = REPLACE(newarea, 'תל אביב-יפו', 'דרום תל אביב')
WHERE newarea LIKE 'תל אביב-יפו%';

UPDATE public.customerlist 
SET newarea = REPLACE(newarea, 'חיפה-קריות', 'חיפה')
WHERE newarea LIKE 'חיפה-קריות%';

UPDATE public.customerlist 
SET newarea = REPLACE(newarea, 'שרון ', 'שרון דרום ')
WHERE newarea LIKE 'שרון %' AND newarea NOT LIKE 'שרון צפון%' AND newarea NOT LIKE 'שרון דרום%';

UPDATE public.customerlist 
SET extraarea = REPLACE(extraarea, 'תל אביב-יפו', 'דרום תל אביב')
WHERE extraarea LIKE 'תל אביב-יפו%';

UPDATE public.customerlist 
SET extraarea = REPLACE(extraarea, 'חיפה-קריות', 'חיפה')
WHERE extraarea LIKE 'חיפה-קריות%';

UPDATE public.customerlist 
SET extraarea = REPLACE(extraarea, 'שרון ', 'שרון דרום ')
WHERE extraarea LIKE 'שרון %' AND extraarea NOT LIKE 'שרון צפון%' AND extraarea NOT LIKE 'שרון דרום%';

-- candycustomerlist table - maintaining numbers
UPDATE public.candycustomerlist 
SET city_area = REPLACE(city_area, 'תל אביב-יפו', 'דרום תל אביב')
WHERE city_area LIKE 'תל אביב-יפו%';

UPDATE public.candycustomerlist 
SET city_area = REPLACE(city_area, 'חיפה-קריות', 'חיפה')
WHERE city_area LIKE 'חיפה-קריות%';

UPDATE public.candycustomerlist 
SET city_area = REPLACE(city_area, 'שרון ', 'שרון דרום ')
WHERE city_area LIKE 'שרון %' AND city_area NOT LIKE 'שרון צפון%' AND city_area NOT LIKE 'שרון דרום%';

UPDATE public.candycustomerlist 
SET newarea = REPLACE(newarea, 'תל אביב-יפו', 'דרום תל אביב')
WHERE newarea LIKE 'תל אביב-יפו%';

UPDATE public.candycustomerlist 
SET newarea = REPLACE(newarea, 'חיפה-קריות', 'חיפה')
WHERE newarea LIKE 'חיפה-קריות%';

UPDATE public.candycustomerlist 
SET newarea = REPLACE(newarea, 'שרון ', 'שרון דרום ')
WHERE newarea LIKE 'שרון %' AND newarea NOT LIKE 'שרון צפון%' AND newarea NOT LIKE 'שרון דרום%';

UPDATE public.candycustomerlist 
SET extraarea = REPLACE(extraarea, 'תל אביב-יפו', 'דרום תל אביב')
WHERE extraarea LIKE 'תל אביב-יפו%';

UPDATE public.candycustomerlist 
SET extraarea = REPLACE(extraarea, 'חיפה-קריות', 'חיפה')
WHERE extraarea LIKE 'חיפה-קריות%';

UPDATE public.candycustomerlist 
SET extraarea = REPLACE(extraarea, 'שרון ', 'שרון דרום ')
WHERE extraarea LIKE 'שרון %' AND extraarea NOT LIKE 'שרון צפון%' AND extraarea NOT LIKE 'שרון דרום%';

-- 5. Re-add foreign key constraints
ALTER TABLE public.customerlist 
ADD CONSTRAINT customerlist_extraarea_fkey 
FOREIGN KEY (extraarea) REFERENCES public.distribution_groups(separation);

ALTER TABLE public.customerlist 
ADD CONSTRAINT customerlist_newarea_fkey 
FOREIGN KEY (newarea) REFERENCES public.distribution_groups(separation);

ALTER TABLE public.candycustomerlist 
ADD CONSTRAINT candycustomerlist_extraarea_fkey 
FOREIGN KEY (extraarea) REFERENCES public.distribution_groups(separation);

ALTER TABLE public.candycustomerlist 
ADD CONSTRAINT candycustomerlist_newarea_fkey 
FOREIGN KEY (newarea) REFERENCES public.distribution_groups(separation);

-- 6. Drop the old calculate_total_spots_for_area function before creating new one
DROP FUNCTION IF EXISTS public.calculate_total_spots_for_area(text);

-- 7. Create new simplified calculate_total_spots_for_area function - now returns numeric sum
CREATE OR REPLACE FUNCTION public.calculate_total_spots_for_area(area_separation text)
RETURNS numeric
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  -- Simply sum all averagesupply for customers in this area
  RETURN (
    SELECT COALESCE(SUM(averagesupply), 0)
    FROM public.customerlist
    WHERE city_area = area_separation
      AND averagesupply IS NOT NULL
  );
END;
$function$;

-- 8. Simplify update_total_spots_on_customer_change function
CREATE OR REPLACE FUNCTION public.update_total_spots_on_customer_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update the area that this customer belongs to (or belonged to)
  IF TG_OP = 'DELETE' THEN
    -- Update old area
    IF OLD.city_area IS NOT NULL THEN
      UPDATE public.distribution_groups
      SET totalsupplyspots = public.calculate_total_spots_for_area(OLD.city_area)
      WHERE separation = OLD.city_area;
    END IF;
    RETURN OLD;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Update old area if it changed
    IF OLD.city_area IS DISTINCT FROM NEW.city_area AND OLD.city_area IS NOT NULL THEN
      UPDATE public.distribution_groups
      SET totalsupplyspots = public.calculate_total_spots_for_area(OLD.city_area)
      WHERE separation = OLD.city_area;
    END IF;
    
    -- Update new area
    IF NEW.city_area IS NOT NULL THEN
      UPDATE public.distribution_groups
      SET totalsupplyspots = public.calculate_total_spots_for_area(NEW.city_area)
      WHERE separation = NEW.city_area;
    END IF;
    RETURN NEW;
    
  ELSIF TG_OP = 'INSERT' THEN
    -- Update the area this customer belongs to
    IF NEW.city_area IS NOT NULL THEN
      UPDATE public.distribution_groups
      SET totalsupplyspots = public.calculate_total_spots_for_area(NEW.city_area)
      WHERE separation = NEW.city_area;
    END IF;
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$function$;

-- 9. Drop the total_spots column
ALTER TABLE public.distribution_groups DROP COLUMN IF EXISTS total_spots;

-- 10. Drop the freq column
ALTER TABLE public.distribution_groups DROP COLUMN IF EXISTS freq;

-- 11. Recalculate all totalsupplyspots
UPDATE public.distribution_groups
SET totalsupplyspots = public.calculate_total_spots_for_area(separation)
WHERE separation IS NOT NULL;