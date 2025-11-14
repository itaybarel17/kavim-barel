-- Reset selected_day for customers with multiple days (containing commas or dots)
UPDATE public.customerlist
SET selected_day = NULL
WHERE selected_day IS NOT NULL 
  AND (selected_day LIKE '%,%' OR selected_day LIKE '%.%');

UPDATE public.customerlist
SET selected_day_extra = NULL
WHERE selected_day_extra IS NOT NULL 
  AND (selected_day_extra LIKE '%,%' OR selected_day_extra LIKE '%.%');

-- Same for candy customers
UPDATE public.candycustomerlist
SET selected_day = NULL
WHERE selected_day IS NOT NULL 
  AND (selected_day LIKE '%,%' OR selected_day LIKE '%.%');

UPDATE public.candycustomerlist
SET selected_day_extra = NULL
WHERE selected_day_extra IS NOT NULL 
  AND (selected_day_extra LIKE '%,%' OR selected_day_extra LIKE '%.%');