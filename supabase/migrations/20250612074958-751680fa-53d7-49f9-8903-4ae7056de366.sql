
-- Remove triggers that reference the non-existent 'idd' column
DROP TRIGGER IF EXISTS assign_orders_trigger ON distribution_schedule;
DROP TRIGGER IF EXISTS date_change_trigger ON distribution_schedule;
DROP TRIGGER IF EXISTS deletion_trigger ON distribution_schedule;
DROP TRIGGER IF EXISTS driver_assignment_trigger ON distribution_schedule;
DROP TRIGGER IF EXISTS schedule_completion_trigger ON distribution_schedule;

-- Drop the problematic functions that reference 'idd'
DROP FUNCTION IF EXISTS assign_orders_to_new_schedule();
DROP FUNCTION IF EXISTS handle_date_change();
DROP FUNCTION IF EXISTS handle_schedule_deletion();
DROP FUNCTION IF EXISTS handle_driver_assignment();
DROP FUNCTION IF EXISTS handle_schedule_completion();

-- Keep only the necessary triggers for our current setup
-- The auto_fill_groups_id_trigger and set_distribution_num_trigger should remain
-- as they work with the current schema
