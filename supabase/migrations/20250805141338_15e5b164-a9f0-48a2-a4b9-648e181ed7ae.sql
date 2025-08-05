-- Update database functions to use days[0] instead of day column

-- Update fill_distribution_fields_from_candy_before function
CREATE OR REPLACE FUNCTION public.fill_distribution_fields_from_candy_before()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  main_area TEXT;
  extra_area TEXT;
  day_main TEXT;
  day_extra TEXT;
BEGIN
  SELECT 
    COALESCE(cl.newarea, cl.city_area), 
    cl.extraarea
  INTO main_area, extra_area
  FROM candycustomerlist cl
  WHERE cl.customernumber = NEW.customernumber;

  -- Use days->>0 instead of day
  SELECT days->>0 INTO day_main 
  FROM distribution_groups 
  WHERE separation = main_area;

  SELECT days->>0 INTO day_extra 
  FROM distribution_groups 
  WHERE separation = extra_area;

  NEW.ezor1 := 
    CASE 
      WHEN main_area IS NOT NULL AND extra_area IS NOT NULL THEN '[' || main_area || ', ' || extra_area || ']'
      WHEN main_area IS NOT NULL THEN '[' || main_area || ']'
      ELSE NULL
    END;

  NEW.ezor2 := extra_area;
  NEW.day1 := day_main;
  NEW.day2 := day_extra;

  RETURN NEW;
END;
$function$;

-- Update update_mainorder_areas_days function  
CREATE OR REPLACE FUNCTION public.update_mainorder_areas_days()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE mainorder
  SET
    ezor1 = COALESCE(cl.newarea, cl.city_area),
    ezor2 = CASE 
              WHEN cl.extraarea IS NOT NULL 
                   AND cl.extraarea <> cl.newarea 
                   AND cl.extraarea <> cl.city_area
              THEN cl.extraarea
              ELSE NULL
            END,
    day1 = dg1.days->>0,
    day2 = dg2.days->>0
  FROM candycustomerlist cl
  LEFT JOIN distribution_groups dg1 ON dg1.separation = COALESCE(cl.newarea, cl.city_area)
  LEFT JOIN distribution_groups dg2 ON dg2.separation = cl.extraarea
  WHERE mainorder.customernumber = cl.customernumber
    AND mainorder.ordernumber = NEW.ordernumber;

  RETURN NEW;
END;
$function$;

-- Update update_mainorder_areas_and_days function
CREATE OR REPLACE FUNCTION public.update_mainorder_areas_and_days()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  main_area TEXT;
  extra_area TEXT;
  day_main TEXT;
  day_extra TEXT;
BEGIN
  SELECT 
    COALESCE(cl.newarea, cl.city_area), 
    cl.extraarea
  INTO main_area, extra_area
  FROM customerlist cl
  WHERE cl.customernumber = NEW.customernumber;

  -- Use days->>0 instead of day
  SELECT days->>0 INTO day_main 
  FROM distribution_groups 
  WHERE separation = main_area;

  SELECT days->>0 INTO day_extra 
  FROM distribution_groups 
  WHERE separation = extra_area;

  NEW.ezor1 := 
    CASE 
      WHEN main_area IS NOT NULL AND extra_area IS NOT NULL THEN '[' || main_area || ', ' || extra_area || ']'
      WHEN main_area IS NOT NULL THEN '[' || main_area || ']'
      ELSE NULL
    END;

  NEW.ezor2 := extra_area;
  NEW.day1 := day_main;
  NEW.day2 := day_extra;

  RETURN NEW;
END;
$function$;

-- Update update_mainorder_areas_and_days_enhanced function
CREATE OR REPLACE FUNCTION public.update_mainorder_areas_and_days_enhanced()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  main_area TEXT;
  extra_area TEXT;
  day_main TEXT;
  day_extra TEXT;
BEGIN
  -- First try to get data from customerlist
  SELECT 
    COALESCE(cl.newarea, cl.city_area), 
    cl.extraarea
  INTO main_area, extra_area
  FROM customerlist cl
  WHERE cl.customernumber = NEW.customernumber;

  -- If not found in customerlist, try candycustomerlist
  IF main_area IS NULL THEN
    SELECT 
      COALESCE(ccl.newarea, ccl.city_area), 
      ccl.extraarea
    INTO main_area, extra_area
    FROM candycustomerlist ccl
    WHERE ccl.customernumber = NEW.customernumber;
  END IF;

  -- Use days->>0 instead of day
  SELECT days->>0 INTO day_main 
  FROM distribution_groups 
  WHERE separation = main_area;

  SELECT days->>0 INTO day_extra 
  FROM distribution_groups 
  WHERE separation = extra_area;

  NEW.ezor1 := 
    CASE 
      WHEN main_area IS NOT NULL AND extra_area IS NOT NULL THEN '[' || main_area || ', ' || extra_area || ']'
      WHEN main_area IS NOT NULL THEN '[' || main_area || ']'
      ELSE NULL
    END;

  NEW.ezor2 := extra_area;
  NEW.day1 := day_main;
  NEW.day2 := day_extra;

  RETURN NEW;
END;
$function$;

-- Update existing mainorder records to populate day1/day2 from days column
UPDATE mainorder 
SET 
  day1 = dg1.days->>0,
  day2 = dg2.days->>0
FROM customerlist cl
LEFT JOIN distribution_groups dg1 ON dg1.separation = COALESCE(cl.newarea, cl.city_area)
LEFT JOIN distribution_groups dg2 ON dg2.separation = cl.extraarea
WHERE mainorder.customernumber = cl.customernumber
  AND (mainorder.day1 IS NULL OR mainorder.day2 IS NULL OR mainorder.day1 != dg1.days->>0 OR mainorder.day2 != dg2.days->>0);

-- Also update from candycustomerlist for records not found in customerlist
UPDATE mainorder 
SET 
  day1 = dg1.days->>0,
  day2 = dg2.days->>0
FROM candycustomerlist ccl
LEFT JOIN distribution_groups dg1 ON dg1.separation = COALESCE(ccl.newarea, ccl.city_area)
LEFT JOIN distribution_groups dg2 ON dg2.separation = ccl.extraarea
WHERE mainorder.customernumber = ccl.customernumber
  AND mainorder.customernumber NOT IN (SELECT customernumber FROM customerlist)
  AND (mainorder.day1 IS NULL OR mainorder.day2 IS NULL OR mainorder.day1 != dg1.days->>0 OR mainorder.day2 != dg2.days->>0);

-- Now we can safely drop the old day column
ALTER TABLE distribution_groups DROP COLUMN IF EXISTS day;