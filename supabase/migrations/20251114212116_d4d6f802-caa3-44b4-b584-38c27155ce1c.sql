-- Step 1: Fix 'שרון דרומי' to 'שרון דרום' in candycustomerlist
UPDATE public.candycustomerlist
SET city_area = 'שרון דרום'
WHERE city_area = 'שרון דרומי';

-- Step 2: Update selected_day for all candycustomerlist customers without a value
UPDATE public.candycustomerlist ccl
SET selected_day = (
  SELECT dg.days->>0
  FROM public.distribution_groups dg
  WHERE dg.separation = ccl.city_area
)
WHERE ccl.selected_day IS NULL 
AND ccl.city_area IS NOT NULL;

-- Step 3: Fix old mainorder entries for candycustomerlist customers
UPDATE public.mainorder m
SET 
  ezor1 = COALESCE(ccl.newarea, ccl.city_area),
  ezor2 = ccl.extraarea,
  day1 = ccl.selected_day,
  day2 = ccl.selected_day_extra
FROM public.candycustomerlist ccl
WHERE m.customernumber = ccl.customernumber
AND (m.ezor1 LIKE '[%]' OR m.ezor1 IS NULL OR m.ezor1 = '');

-- Step 4: Also fix old mainorder entries for customerlist customers with bracket values
UPDATE public.mainorder m
SET 
  ezor1 = COALESCE(cl.newarea, cl.city_area),
  ezor2 = cl.extraarea,
  day1 = cl.selected_day,
  day2 = cl.selected_day_extra
FROM public.customerlist cl
WHERE m.customernumber = cl.customernumber
AND (m.ezor1 LIKE '[%]' OR m.ezor1 IS NULL OR m.ezor1 = '');