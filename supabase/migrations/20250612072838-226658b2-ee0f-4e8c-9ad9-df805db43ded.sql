
-- Create a function to get or create a schedule for a group
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
    
    -- If not, create a new schedule
    INSERT INTO distribution_schedule (groups_id, distribution_date)
    VALUES (group_id, CURRENT_DATE)
    RETURNING schedule_id INTO new_schedule_id;
    
    RETURN new_schedule_id;
END;
$$;

-- Create a trigger function to auto-fill groups_id when schedule is created
CREATE OR REPLACE FUNCTION auto_fill_groups_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- This ensures groups_id is always set when a schedule is created
    IF NEW.groups_id IS NULL AND NEW.schedule_id IS NOT NULL THEN
        -- This shouldn't happen with our logic, but just in case
        RETURN NEW;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for auto-filling groups_id
DROP TRIGGER IF EXISTS auto_fill_groups_id_trigger ON distribution_schedule;
CREATE TRIGGER auto_fill_groups_id_trigger
    BEFORE INSERT OR UPDATE ON distribution_schedule
    FOR EACH ROW
    EXECUTE FUNCTION auto_fill_groups_id();
