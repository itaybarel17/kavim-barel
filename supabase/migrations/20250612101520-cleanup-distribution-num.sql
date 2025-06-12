
-- Clean up functions that are no longer needed after removing distribution_num column

-- The get_next_distribution_num function is no longer needed since distribution_num column was deleted
DROP FUNCTION IF EXISTS get_next_distribution_num(date);

-- Update the get_or_create_schedule_for_group function to be simpler and more reliable
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
