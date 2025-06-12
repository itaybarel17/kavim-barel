
-- Update the function to check for existing schedules first
CREATE OR REPLACE FUNCTION get_or_create_schedule_for_group(group_id integer)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    existing_schedule_id integer;
    new_schedule_id integer;
BEGIN
    -- First, check if there's already a schedule for this group
    SELECT schedule_id INTO existing_schedule_id
    FROM distribution_schedule
    WHERE groups_id = group_id
    ORDER BY create_at_schedule DESC
    LIMIT 1;
    
    -- If we found an existing schedule, return it
    IF existing_schedule_id IS NOT NULL THEN
        RETURN existing_schedule_id;
    END IF;
    
    -- If no existing schedule, create a new one
    INSERT INTO distribution_schedule (groups_id, create_at_schedule)
    VALUES (group_id, NOW())
    RETURNING schedule_id INTO new_schedule_id;
    
    RETURN new_schedule_id;
END;
$$;
