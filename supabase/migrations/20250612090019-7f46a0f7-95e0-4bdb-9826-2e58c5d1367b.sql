
-- Update the function to always create a new schedule instead of reusing existing ones
CREATE OR REPLACE FUNCTION get_or_create_schedule_for_group(group_id integer)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    new_schedule_id integer;
BEGIN
    -- Always create a new schedule with only groups_id and create_at_schedule
    -- Don't reuse existing schedules, each zone should get its own unique schedule_id
    INSERT INTO distribution_schedule (groups_id, create_at_schedule)
    VALUES (group_id, NOW())
    RETURNING schedule_id INTO new_schedule_id;
    
    RETURN new_schedule_id;
END;
$$;
