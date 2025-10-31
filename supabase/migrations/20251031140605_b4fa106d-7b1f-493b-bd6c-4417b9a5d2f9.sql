-- Drop old day columns
ALTER TABLE customerlist 
DROP COLUMN IF EXISTS day,
DROP COLUMN IF EXISTS day_extra;

ALTER TABLE candycustomerlist 
DROP COLUMN IF EXISTS day,
DROP COLUMN IF EXISTS day_extra;

-- Add new selected_day columns
ALTER TABLE customerlist 
ADD COLUMN IF NOT EXISTS selected_day JSONB,
ADD COLUMN IF NOT EXISTS selected_day_extra JSONB;

ALTER TABLE candycustomerlist 
ADD COLUMN IF NOT EXISTS selected_day JSONB,
ADD COLUMN IF NOT EXISTS selected_day_extra JSONB;

-- Function to auto-populate selected days based on areas
CREATE OR REPLACE FUNCTION public.auto_populate_selected_days()
RETURNS TRIGGER AS $$
DECLARE
  area_days JSONB;
  extra_area_days JSONB;
BEGIN
  -- Fill selected_day based on city_area
  IF NEW.city_area IS NOT NULL THEN
    SELECT days INTO area_days
    FROM public.distribution_groups
    WHERE separation = NEW.city_area;
    
    -- Auto-fill if not manually set
    IF NEW.selected_day IS NULL THEN
      NEW.selected_day := area_days;
    END IF;
  ELSE
    NEW.selected_day := NULL;
  END IF;
  
  -- Fill selected_day_extra based on extraarea
  IF NEW.extraarea IS NOT NULL THEN
    SELECT days INTO extra_area_days
    FROM public.distribution_groups
    WHERE separation = NEW.extraarea;
    
    -- Auto-fill if not manually set
    IF NEW.selected_day_extra IS NULL THEN
      NEW.selected_day_extra := extra_area_days;
    END IF;
  ELSE
    NEW.selected_day_extra := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path TO 'public';

-- Apply trigger to customerlist
DROP TRIGGER IF EXISTS trigger_auto_populate_selected_days ON public.customerlist;
CREATE TRIGGER trigger_auto_populate_selected_days
BEFORE INSERT OR UPDATE ON public.customerlist
FOR EACH ROW
EXECUTE FUNCTION public.auto_populate_selected_days();

-- Apply trigger to candycustomerlist
DROP TRIGGER IF EXISTS trigger_auto_populate_selected_days_candy ON public.candycustomerlist;
CREATE TRIGGER trigger_auto_populate_selected_days_candy
BEFORE INSERT OR UPDATE ON public.candycustomerlist
FOR EACH ROW
EXECUTE FUNCTION public.auto_populate_selected_days();

-- Function to update selected days when area changes
CREATE OR REPLACE FUNCTION public.update_selected_days_on_area_change()
RETURNS TRIGGER AS $$
DECLARE
  area_days JSONB;
  extra_area_days JSONB;
BEGIN
  -- Reset selected_day to area default when city_area changes
  IF OLD.city_area IS DISTINCT FROM NEW.city_area THEN
    IF NEW.city_area IS NOT NULL THEN
      SELECT days INTO area_days
      FROM public.distribution_groups
      WHERE separation = NEW.city_area;
      
      NEW.selected_day := area_days;
    ELSE
      NEW.selected_day := NULL;
    END IF;
  END IF;
  
  -- Reset selected_day_extra when extraarea changes
  IF OLD.extraarea IS DISTINCT FROM NEW.extraarea THEN
    IF NEW.extraarea IS NOT NULL THEN
      SELECT days INTO extra_area_days
      FROM public.distribution_groups
      WHERE separation = NEW.extraarea;
      
      NEW.selected_day_extra := extra_area_days;
    ELSE
      NEW.selected_day_extra := NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path TO 'public';

-- Apply update trigger to customerlist
DROP TRIGGER IF EXISTS trigger_update_days_on_area_change ON public.customerlist;
CREATE TRIGGER trigger_update_days_on_area_change
BEFORE UPDATE ON public.customerlist
FOR EACH ROW
EXECUTE FUNCTION public.update_selected_days_on_area_change();

-- Apply update trigger to candycustomerlist
DROP TRIGGER IF EXISTS trigger_update_days_on_area_change_candy ON public.candycustomerlist;
CREATE TRIGGER trigger_update_days_on_area_change_candy
BEFORE UPDATE ON public.candycustomerlist
FOR EACH ROW
EXECUTE FUNCTION public.update_selected_days_on_area_change();

-- Populate existing customers with days from their areas using subqueries
UPDATE public.customerlist c
SET 
  selected_day = (
    SELECT days 
    FROM public.distribution_groups 
    WHERE separation = c.city_area
  ),
  selected_day_extra = (
    SELECT days 
    FROM public.distribution_groups 
    WHERE separation = c.extraarea
  )
WHERE c.city_area IS NOT NULL;

-- Same for candycustomerlist
UPDATE public.candycustomerlist c
SET 
  selected_day = (
    SELECT days 
    FROM public.distribution_groups 
    WHERE separation = c.city_area
  ),
  selected_day_extra = (
    SELECT days 
    FROM public.distribution_groups 
    WHERE separation = c.extraarea
  )
WHERE c.city_area IS NOT NULL;