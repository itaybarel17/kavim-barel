-- פונקציה לעדכון cities.averagesupplyweek_candy ו-distribution_groups.totalsupplyspots_candy
CREATE OR REPLACE FUNCTION public.update_cities_and_groups_from_candy()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- 1. עדכון cities.averagesupplyweek_candy (שדה נפרד ללקוחות ממתקים)
  UPDATE public.cities c
  SET averagesupplyweek_candy = (
    SELECT COALESCE(SUM(cc.averagesupply), 0)
    FROM public.candycustomerlist cc
    WHERE cc.city_area = c.area
  );
  
  -- 2. עדכון distribution_groups.totalsupplyspots_candy (שדה נפרד ללקוחות ממתקים)
  UPDATE public.distribution_groups dg
  SET totalsupplyspots_candy = (
    SELECT COALESCE(SUM(cc.averagesupply), 0)
    FROM public.candycustomerlist cc
    WHERE cc.city_area = dg.separation
  );
  
END;
$function$;

-- פונקציית טריגר שמופעלת על שינויים ב-candycustomerlist
CREATE OR REPLACE FUNCTION public.trigger_update_cities_groups_from_candy()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.averagesupply IS NOT NULL THEN
      PERFORM public.update_cities_and_groups_from_candy();
    END IF;
    
  ELSIF TG_OP = 'UPDATE' THEN
    IF (OLD.averagesupply IS DISTINCT FROM NEW.averagesupply) OR
       (OLD.city_area IS DISTINCT FROM NEW.city_area) THEN
      PERFORM public.update_cities_and_groups_from_candy();
    END IF;
    
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.averagesupply IS NOT NULL THEN
      PERFORM public.update_cities_and_groups_from_candy();
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- יצירת הטריגר על טבלת candycustomerlist
DROP TRIGGER IF EXISTS trigger_cities_groups_from_candy ON public.candycustomerlist;

CREATE TRIGGER trigger_cities_groups_from_candy
  AFTER INSERT OR UPDATE OR DELETE ON public.candycustomerlist
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_cities_groups_from_candy();