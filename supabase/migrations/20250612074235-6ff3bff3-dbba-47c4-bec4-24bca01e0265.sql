
-- Fix the get_or_create_schedule_for_group function to properly set groups_id
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
    
    -- If not, create a new schedule with proper groups_id
    INSERT INTO distribution_schedule (groups_id, distribution_date)
    VALUES (group_id, CURRENT_DATE)
    RETURNING schedule_id INTO new_schedule_id;
    
    RETURN new_schedule_id;
END;
$$;

-- Update existing distribution_schedule records that have NULL groups_id
-- This will help fix any orphaned schedules
UPDATE distribution_schedule 
SET groups_id = 1 
WHERE groups_id IS NULL AND schedule_id IS NOT NULL;

-- Make sure the trigger function works correctly
CREATE OR REPLACE FUNCTION auto_fill_groups_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Ensure groups_id is properly set when creating/updating schedules
    IF NEW.groups_id IS NULL AND TG_OP = 'INSERT' THEN
        -- This shouldn't happen with our fixed logic, but just in case
        RAISE EXCEPTION 'groups_id cannot be NULL when creating a schedule';
    END IF;
    
    RETURN NEW;
END;
$$;
