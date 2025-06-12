
-- Update the function to create schedule with minimal data initially
CREATE OR REPLACE FUNCTION get_or_create_schedule_for_group(group_id integer)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    existing_schedule_id integer;
    new_schedule_id integer;
BEGIN
    -- Check if there's already a schedule for this group
    SELECT schedule_id INTO existing_schedule_id
    FROM distribution_schedule
    WHERE groups_id = group_id
    LIMIT 1;
    
    -- If exists, return it
    IF existing_schedule_id IS NOT NULL THEN
        RETURN existing_schedule_id;
    END IF;
    
    -- If not, create a new schedule with only groups_id and create_at_schedule
    -- Don't set distribution_date or distribution_num until later
    INSERT INTO distribution_schedule (groups_id, create_at_schedule)
    VALUES (group_id, NOW())
    RETURNING schedule_id INTO new_schedule_id;
    
    RETURN new_schedule_id;
END;
$$;

-- Update the trigger to only set distribution_num when distribution_date is set
CREATE OR REPLACE FUNCTION set_distribution_num()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only set distribution_num if distribution_date is provided and distribution_num is null
  IF NEW.distribution_date IS NOT NULL AND NEW.distribution_num IS NULL THEN
    NEW.distribution_num := get_next_distribution_num(NEW.distribution_date);
  END IF;
  RETURN NEW;
END;
$$;
