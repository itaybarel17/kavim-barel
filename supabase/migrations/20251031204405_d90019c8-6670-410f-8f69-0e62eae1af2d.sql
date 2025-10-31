-- Step 1: Normalize selected_day and selected_day_extra to plain text
-- Remove JSON formatting from selected_day
UPDATE public.customerlist
SET selected_day = CASE
  WHEN selected_day IS NULL THEN NULL
  WHEN selected_day LIKE '[%' THEN 
    REPLACE(REPLACE(REPLACE(selected_day, '[', ''), ']', ''), '"', '')
  ELSE selected_day
END
WHERE selected_day IS NOT NULL;

-- Remove JSON formatting from selected_day_extra
UPDATE public.customerlist
SET selected_day_extra = CASE
  WHEN selected_day_extra IS NULL THEN NULL
  WHEN selected_day_extra LIKE '[%' THEN 
    REPLACE(REPLACE(REPLACE(selected_day_extra, '[', ''), ']', ''), '"', '')
  ELSE selected_day_extra
END
WHERE selected_day_extra IS NOT NULL;

-- Step 2: Create function to calculate total_spots for an area
CREATE OR REPLACE FUNCTION public.calculate_total_spots_for_area(area_separation TEXT)
RETURNS JSONB
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

-- Step 3: Create trigger function to update total_spots when customerlist changes
CREATE OR REPLACE FUNCTION public.update_total_spots_on_customer_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Update the area that this customer belongs to (or belonged to)
  IF TG_OP = 'DELETE' THEN
    -- Update old area
    IF OLD.city_area IS NOT NULL THEN
      UPDATE public.distribution_groups
      SET total_spots = public.calculate_total_spots_for_area(OLD.city_area)
      WHERE separation = OLD.city_area;
    END IF;
    RETURN OLD;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Update old area if it changed
    IF OLD.city_area IS DISTINCT FROM NEW.city_area AND OLD.city_area IS NOT NULL THEN
      UPDATE public.distribution_groups
      SET total_spots = public.calculate_total_spots_for_area(OLD.city_area)
      WHERE separation = OLD.city_area;
    END IF;
    
    -- Update new area
    IF NEW.city_area IS NOT NULL THEN
      UPDATE public.distribution_groups
      SET total_spots = public.calculate_total_spots_for_area(NEW.city_area)
      WHERE separation = NEW.city_area;
    END IF;
    RETURN NEW;
    
  ELSIF TG_OP = 'INSERT' THEN
    -- Update the area this customer belongs to
    IF NEW.city_area IS NOT NULL THEN
      UPDATE public.distribution_groups
      SET total_spots = public.calculate_total_spots_for_area(NEW.city_area)
      WHERE separation = NEW.city_area;
    END IF;
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Create trigger on customerlist
DROP TRIGGER IF EXISTS trigger_update_total_spots_on_customer ON public.customerlist;
CREATE TRIGGER trigger_update_total_spots_on_customer
  AFTER INSERT OR UPDATE OF averagesupply, city_area, selected_day OR DELETE
  ON public.customerlist
  FOR EACH ROW
  EXECUTE FUNCTION public.update_total_spots_on_customer_change();

-- Step 4: Create trigger function to update total_spots when distribution_groups.days changes
CREATE OR REPLACE FUNCTION public.update_total_spots_on_days_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Recalculate total_spots for this area when days change
  IF TG_OP = 'UPDATE' AND OLD.days IS DISTINCT FROM NEW.days THEN
    NEW.total_spots := public.calculate_total_spots_for_area(NEW.separation);
  ELSIF TG_OP = 'INSERT' THEN
    NEW.total_spots := public.calculate_total_spots_for_area(NEW.separation);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on distribution_groups
DROP TRIGGER IF EXISTS trigger_update_total_spots_on_days ON public.distribution_groups;
CREATE TRIGGER trigger_update_total_spots_on_days
  BEFORE INSERT OR UPDATE OF days
  ON public.distribution_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_total_spots_on_days_change();

-- Step 5: Initial population of total_spots for all areas
UPDATE public.distribution_groups
SET total_spots = public.calculate_total_spots_for_area(separation);