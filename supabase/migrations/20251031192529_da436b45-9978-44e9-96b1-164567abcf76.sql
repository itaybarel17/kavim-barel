-- Step 1: Add JSONB temp columns to both tables
ALTER TABLE public.candycustomerlist 
  ADD COLUMN selected_day_temp JSONB,
  ADD COLUMN selected_day_extra_temp JSONB;

ALTER TABLE public.customerlist 
  ADD COLUMN selected_day_temp JSONB,
  ADD COLUMN selected_day_extra_temp JSONB;

-- Step 2: Convert customerlist selected_day and selected_day_extra to TEXT
-- First, create temporary TEXT columns for conversion
ALTER TABLE public.customerlist 
  ADD COLUMN selected_day_text_temp TEXT,
  ADD COLUMN selected_day_extra_text_temp TEXT;

-- Step 3: Convert existing JSONB data to TEXT (first day only) in customerlist
UPDATE public.customerlist
SET 
  selected_day_text_temp = CASE 
    WHEN selected_day IS NOT NULL THEN selected_day->>0
    ELSE NULL
  END,
  selected_day_extra_text_temp = CASE
    WHEN selected_day_extra IS NOT NULL THEN selected_day_extra->>0
    ELSE NULL
  END;

-- Step 4: Drop old JSONB columns in customerlist
ALTER TABLE public.customerlist 
  DROP COLUMN selected_day,
  DROP COLUMN selected_day_extra;

-- Step 5: Rename text temp columns to original names in customerlist
ALTER TABLE public.customerlist 
  RENAME COLUMN selected_day_text_temp TO selected_day;

ALTER TABLE public.customerlist 
  RENAME COLUMN selected_day_extra_text_temp TO selected_day_extra;