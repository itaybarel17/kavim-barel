
-- Fix the trigger to not set distribution_num when there's no distribution_date
CREATE OR REPLACE FUNCTION set_distribution_num()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only set distribution_num if BOTH distribution_date is provided AND distribution_num is null
  -- AND we're actually setting a distribution_date (not just creating the schedule)
  IF NEW.distribution_date IS NOT NULL AND OLD.distribution_date IS NULL AND NEW.distribution_num IS NULL THEN
    NEW.distribution_num := get_next_distribution_num(NEW.distribution_date);
  END IF;
  RETURN NEW;
END;
$$;
