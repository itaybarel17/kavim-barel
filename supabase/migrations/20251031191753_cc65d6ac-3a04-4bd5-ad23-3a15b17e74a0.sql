-- Step 1: Create temporary TEXT columns
ALTER TABLE public.candycustomerlist 
  ADD COLUMN selected_day_temp TEXT,
  ADD COLUMN selected_day_extra_temp TEXT;

-- Step 2: Convert existing JSONB data to TEXT (first day only)
UPDATE public.candycustomerlist
SET 
  selected_day_temp = CASE 
    WHEN selected_day IS NOT NULL THEN selected_day->>0
    ELSE NULL
  END,
  selected_day_extra_temp = CASE
    WHEN selected_day_extra IS NOT NULL THEN selected_day_extra->>0
    ELSE NULL
  END;

-- Step 3: Drop old JSONB columns
ALTER TABLE public.candycustomerlist 
  DROP COLUMN selected_day,
  DROP COLUMN selected_day_extra;

-- Step 4: Rename temp columns to original names
ALTER TABLE public.candycustomerlist 
  RENAME COLUMN selected_day_temp TO selected_day;

ALTER TABLE public.candycustomerlist 
  RENAME COLUMN selected_day_extra_temp TO selected_day_extra;

-- Step 5: Update the auto_populate_selected_days function to store only first day
CREATE OR REPLACE FUNCTION public.auto_populate_selected_days()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  area_days JSONB;
  extra_area_days JSONB;
BEGIN
  -- Fill selected_day based on city_area - take only first day
  IF NEW.city_area IS NOT NULL THEN
    SELECT days INTO area_days
    FROM public.distribution_groups
    WHERE separation = NEW.city_area;
    
    -- Auto-fill if not manually set - store only first day as string
    IF NEW.selected_day IS NULL THEN
      NEW.selected_day := area_days->>0;
    END IF;
  ELSE
    NEW.selected_day := NULL;
  END IF;
  
  -- Fill selected_day_extra based on extraarea - take only first day
  IF NEW.extraarea IS NOT NULL THEN
    SELECT days INTO extra_area_days
    FROM public.distribution_groups
    WHERE separation = NEW.extraarea;
    
    -- Auto-fill if not manually set - store only first day as string
    IF NEW.selected_day_extra IS NULL THEN
      NEW.selected_day_extra := extra_area_days->>0;
    END IF;
  ELSE
    NEW.selected_day_extra := NULL;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Step 6: Update the update_selected_days_on_area_change function to store only first day
CREATE OR REPLACE FUNCTION public.update_selected_days_on_area_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  area_days JSONB;
  extra_area_days JSONB;
BEGIN
  -- Reset selected_day to area default (first day only) when city_area changes
  IF OLD.city_area IS DISTINCT FROM NEW.city_area THEN
    IF NEW.city_area IS NOT NULL THEN
      SELECT days INTO area_days
      FROM public.distribution_groups
      WHERE separation = NEW.city_area;
      
      NEW.selected_day := area_days->>0;
    ELSE
      NEW.selected_day := NULL;
    END IF;
  END IF;
  
  -- Reset selected_day_extra (first day only) when extraarea changes
  IF OLD.extraarea IS DISTINCT FROM NEW.extraarea THEN
    IF NEW.extraarea IS NOT NULL THEN
      SELECT days INTO extra_area_days
      FROM public.distribution_groups
      WHERE separation = NEW.extraarea;
      
      NEW.selected_day_extra := extra_area_days->>0;
    ELSE
      NEW.selected_day_extra := NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;