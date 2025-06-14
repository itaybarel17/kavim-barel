
-- Add return_reason column as JSONB to mainorder table
ALTER TABLE public.mainorder 
ADD COLUMN return_reason JSONB;

-- Add return_reason column as JSONB to mainreturns table  
ALTER TABLE public.mainreturns 
ADD COLUMN return_reason JSONB;

-- Change schedule_id_if_changed from TEXT to JSONB in mainorder table
-- First, convert existing TEXT values to JSONB array format
UPDATE public.mainorder 
SET schedule_id_if_changed = 
  CASE 
    WHEN schedule_id_if_changed IS NULL THEN NULL
    ELSE jsonb_build_array(schedule_id_if_changed)
  END
WHERE schedule_id_if_changed IS NOT NULL;

-- Change column type to JSONB
ALTER TABLE public.mainorder 
ALTER COLUMN schedule_id_if_changed TYPE JSONB USING schedule_id_if_changed::JSONB;

-- Change schedule_id_if_changed from TEXT to JSONB in mainreturns table
-- First, convert existing TEXT values to JSONB array format
UPDATE public.mainreturns 
SET schedule_id_if_changed = 
  CASE 
    WHEN schedule_id_if_changed IS NULL THEN NULL
    ELSE jsonb_build_array(schedule_id_if_changed)
  END
WHERE schedule_id_if_changed IS NOT NULL;

-- Change column type to JSONB
ALTER TABLE public.mainreturns 
ALTER COLUMN schedule_id_if_changed TYPE JSONB USING schedule_id_if_changed::JSONB;
