-- פונקציה ליצירת סכום totalsupplyspots_barelcandy ב distribution_groups
CREATE OR REPLACE FUNCTION public.update_distribution_groups_barelcandy()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.totalsupplyspots_barelcandy := COALESCE(NEW.totalsupplyspots_candy, 0) + COALESCE(NEW.totalsupplyspots, 0);
  RETURN NEW;
END;
$function$;

-- טריגר לעדכון totalsupplyspots_barelcandy
DROP TRIGGER IF EXISTS trigger_update_distribution_groups_barelcandy ON public.distribution_groups;
CREATE TRIGGER trigger_update_distribution_groups_barelcandy
  BEFORE INSERT OR UPDATE OF totalsupplyspots_candy, totalsupplyspots
  ON public.distribution_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_distribution_groups_barelcandy();

-- פונקציה ליצירת סכום averagesupplyweek_barelcandy ב cities
CREATE OR REPLACE FUNCTION public.update_cities_barelcandy()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.averagesupplyweek_barelcandy := COALESCE(NEW.averagesupplyweek_candy, 0) + COALESCE(NEW.averagesupplyweek, 0);
  RETURN NEW;
END;
$function$;

-- טריגר לעדכון averagesupplyweek_barelcandy
DROP TRIGGER IF EXISTS trigger_update_cities_barelcandy ON public.cities;
CREATE TRIGGER trigger_update_cities_barelcandy
  BEFORE INSERT OR UPDATE OF averagesupplyweek_candy, averagesupplyweek
  ON public.cities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_cities_barelcandy();

-- עדכון חד פעמי של כל השורות הקיימות
UPDATE public.distribution_groups
SET totalsupplyspots_barelcandy = COALESCE(totalsupplyspots_candy, 0) + COALESCE(totalsupplyspots, 0);

UPDATE public.cities
SET averagesupplyweek_barelcandy = COALESCE(averagesupplyweek_candy, 0) + COALESCE(averagesupplyweek, 0);