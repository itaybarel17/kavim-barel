
-- Remove the INSERT trigger that automatically sets distribution_num
DROP TRIGGER IF EXISTS set_distribution_num_trigger ON distribution_schedule;

-- Create a new trigger that only runs on UPDATE when distribution_date is being set
CREATE TRIGGER set_distribution_num_trigger
    BEFORE UPDATE ON distribution_schedule
    FOR EACH ROW
    EXECUTE FUNCTION set_distribution_num();
