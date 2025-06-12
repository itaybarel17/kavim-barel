
-- Fix the set_distribution_num function to not reference the deleted distribution_num column
CREATE OR REPLACE FUNCTION set_distribution_num()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Since distribution_num column was deleted, this function no longer needs to do anything
  -- Just return NEW to allow the update to proceed normally
  RETURN NEW;
END;
$$;
