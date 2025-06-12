
-- Update the function to reuse existing schedules instead of always creating new ones
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
    INSERT INTO distribution_schedule (groups_id, create_at_schedule)
    VALUES (group_id, NOW())
    RETURNING schedule_id INTO new_schedule_id;
    
    RETURN new_schedule_id;
END;
$$;
