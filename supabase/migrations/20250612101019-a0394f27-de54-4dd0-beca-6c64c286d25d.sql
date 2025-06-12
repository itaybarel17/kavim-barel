
-- Remove all triggers that reference the problematic functions
DROP TRIGGER IF EXISTS maintain_schedule_assignments_trigger ON mainorder;
DROP TRIGGER IF EXISTS maintain_schedule_assignments_trigger ON mainreturns;
DROP TRIGGER IF EXISTS clear_assignments_trigger ON mainorder;
DROP TRIGGER IF EXISTS clear_assignments_trigger ON mainreturns;
DROP TRIGGER IF EXISTS maintain_todo_consistency ON mainorder;

-- Now drop the problematic functions using CASCADE to handle dependencies
DROP FUNCTION IF EXISTS maintain_schedule_assignments() CASCADE;
DROP FUNCTION IF EXISTS clear_assignments_for_todo() CASCADE;
