-- Drop the existing trigger
DROP TRIGGER IF EXISTS trg_update_totalsupplyspots ON cities;

-- Update the function to handle row-level operations with proper WHERE clauses
CREATE OR REPLACE FUNCTION public.update_totalsupplyspots()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Handle different trigger operations
  IF TG_OP = 'DELETE' THEN
    -- Update the area that the deleted city belonged to
    UPDATE distribution_groups 
    SET totalsupplyspots = (
      SELECT COALESCE(SUM(c.averagesupplyweek), 0)
      FROM cities c
      WHERE c.area = OLD.area
    )
    WHERE separation = OLD.area;
    
    RETURN OLD;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- If area changed, update both old and new areas
    IF OLD.area IS DISTINCT FROM NEW.area THEN
      -- Update old area
      IF OLD.area IS NOT NULL THEN
        UPDATE distribution_groups 
        SET totalsupplyspots = (
          SELECT COALESCE(SUM(c.averagesupplyweek), 0)
          FROM cities c
          WHERE c.area = OLD.area
        )
        WHERE separation = OLD.area;
      END IF;
      
      -- Update new area
      IF NEW.area IS NOT NULL THEN
        UPDATE distribution_groups 
        SET totalsupplyspots = (
          SELECT COALESCE(SUM(c.averagesupplyweek), 0)
          FROM cities c
          WHERE c.area = NEW.area
        )
        WHERE separation = NEW.area;
      END IF;
    ELSE
      -- Only averagesupplyweek changed, update the current area
      IF NEW.area IS NOT NULL THEN
        UPDATE distribution_groups 
        SET totalsupplyspots = (
          SELECT COALESCE(SUM(c.averagesupplyweek), 0)
          FROM cities c
          WHERE c.area = NEW.area
        )
        WHERE separation = NEW.area;
      END IF;
    END IF;
    
    RETURN NEW;
    
  ELSIF TG_OP = 'INSERT' THEN
    -- Update the area that the new city belongs to
    IF NEW.area IS NOT NULL THEN
      UPDATE distribution_groups 
      SET totalsupplyspots = (
        SELECT COALESCE(SUM(c.averagesupplyweek), 0)
        FROM cities c
        WHERE c.area = NEW.area
      )
      WHERE separation = NEW.area;
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$function$;

-- Create the new trigger with FOR EACH ROW
CREATE TRIGGER trg_update_totalsupplyspots
AFTER INSERT OR UPDATE OF area, averagesupplyweek OR DELETE
ON cities
FOR EACH ROW
EXECUTE FUNCTION update_totalsupplyspots();