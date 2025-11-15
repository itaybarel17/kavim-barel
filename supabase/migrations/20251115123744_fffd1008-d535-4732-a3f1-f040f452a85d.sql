-- תיקון הפונקציה: cities לפי city, distribution_groups לפי city_area/separation
CREATE OR REPLACE FUNCTION public.update_cities_and_groups_from_candy()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- 1. עדכון cities.averagesupplyweek_candy לפי city (לא area!)
  UPDATE public.cities c
  SET averagesupplyweek_candy = (
    SELECT COALESCE(SUM(cc.averagesupply), 0)
    FROM public.candycustomerlist cc
    WHERE cc.city = c.city
  );
  
  -- 2. עדכון distribution_groups.totalsupplyspots_candy לפי city_area/separation
  UPDATE public.distribution_groups dg
  SET totalsupplyspots_candy = (
    SELECT COALESCE(SUM(cc.averagesupply), 0)
    FROM public.candycustomerlist cc
    WHERE cc.city_area = dg.separation
  );
  
END;
$function$;