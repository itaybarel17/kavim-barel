-- Remove temporary JSONB columns from candycustomerlist
ALTER TABLE public.candycustomerlist 
  DROP COLUMN IF EXISTS selected_day_temp,
  DROP COLUMN IF EXISTS selected_day_extra_temp;

-- Remove temporary JSONB columns from customerlist
ALTER TABLE public.customerlist 
  DROP COLUMN IF EXISTS selected_day_temp,
  DROP COLUMN IF EXISTS selected_day_extra_temp;