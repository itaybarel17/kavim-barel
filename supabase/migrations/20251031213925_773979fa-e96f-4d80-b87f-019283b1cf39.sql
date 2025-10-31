-- Drop existing trigger
DROP TRIGGER IF EXISTS trigger_update_total_spots_on_customer ON public.customerlist;

-- Create improved trigger function that also updates totalsupplyspots
CREATE OR REPLACE FUNCTION public.update_total_spots_on_customer_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  new_total_spots JSONB;
  total_sum NUMERIC;
  key TEXT;
  value TEXT;
BEGIN
  -- Update the area that this customer belongs to (or belonged to)
  IF TG_OP = 'DELETE' THEN
    -- Update old area
    IF OLD.city_area IS NOT NULL THEN
      -- Recalculate total_spots
      new_total_spots := public.calculate_total_spots_for_area(OLD.city_area);
      
      -- Calculate totalsupplyspots as sum of all values in total_spots
      total_sum := 0;
      FOR key, value IN SELECT * FROM jsonb_each_text(new_total_spots)
      LOOP
        total_sum := total_sum + COALESCE(value::numeric, 0);
      END LOOP;
      
      UPDATE public.distribution_groups
      SET 
        total_spots = new_total_spots,
        totalsupplyspots = total_sum
      WHERE separation = OLD.city_area;
    END IF;
    RETURN OLD;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Update old area if it changed
    IF OLD.city_area IS DISTINCT FROM NEW.city_area AND OLD.city_area IS NOT NULL THEN
      -- Recalculate total_spots
      new_total_spots := public.calculate_total_spots_for_area(OLD.city_area);
      
      -- Calculate totalsupplyspots
      total_sum := 0;
      FOR key, value IN SELECT * FROM jsonb_each_text(new_total_spots)
      LOOP
        total_sum := total_sum + COALESCE(value::numeric, 0);
      END LOOP;
      
      UPDATE public.distribution_groups
      SET 
        total_spots = new_total_spots,
        totalsupplyspots = total_sum
      WHERE separation = OLD.city_area;
    END IF;
    
    -- Update new area
    IF NEW.city_area IS NOT NULL THEN
      -- Recalculate total_spots
      new_total_spots := public.calculate_total_spots_for_area(NEW.city_area);
      
      -- Calculate totalsupplyspots
      total_sum := 0;
      FOR key, value IN SELECT * FROM jsonb_each_text(new_total_spots)
      LOOP
        total_sum := total_sum + COALESCE(value::numeric, 0);
      END LOOP;
      
      UPDATE public.distribution_groups
      SET 
        total_spots = new_total_spots,
        totalsupplyspots = total_sum
      WHERE separation = NEW.city_area;
    END IF;
    RETURN NEW;
    
  ELSIF TG_OP = 'INSERT' THEN
    -- Update the area this customer belongs to
    IF NEW.city_area IS NOT NULL THEN
      -- Recalculate total_spots
      new_total_spots := public.calculate_total_spots_for_area(NEW.city_area);
      
      -- Calculate totalsupplyspots
      total_sum := 0;
      FOR key, value IN SELECT * FROM jsonb_each_text(new_total_spots)
      LOOP
        total_sum := total_sum + COALESCE(value::numeric, 0);
      END LOOP;
      
      UPDATE public.distribution_groups
      SET 
        total_spots = new_total_spots,
        totalsupplyspots = total_sum
      WHERE separation = NEW.city_area;
    END IF;
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Recreate trigger with the new function
CREATE TRIGGER trigger_update_total_spots_on_customer
AFTER INSERT OR UPDATE OF averagesupply, city_area, selected_day OR DELETE
ON public.customerlist
FOR EACH ROW
EXECUTE FUNCTION public.update_total_spots_on_customer_change();

-- Update all existing areas to recalculate both total_spots and totalsupplyspots
DO $$
DECLARE
  area_record RECORD;
  new_total_spots JSONB;
  total_sum NUMERIC;
  key TEXT;
  value TEXT;
BEGIN
  FOR area_record IN SELECT separation FROM public.distribution_groups WHERE separation IS NOT NULL
  LOOP
    -- Calculate total_spots
    new_total_spots := public.calculate_total_spots_for_area(area_record.separation);
    
    -- Calculate totalsupplyspots as sum of all values
    total_sum := 0;
    FOR key, value IN SELECT * FROM jsonb_each_text(new_total_spots)
    LOOP
      total_sum := total_sum + COALESCE(value::numeric, 0);
    END LOOP;
    
    -- Update both fields
    UPDATE public.distribution_groups
    SET 
      total_spots = new_total_spots,
      totalsupplyspots = total_sum
    WHERE separation = area_record.separation;
  END LOOP;
END;
$$;