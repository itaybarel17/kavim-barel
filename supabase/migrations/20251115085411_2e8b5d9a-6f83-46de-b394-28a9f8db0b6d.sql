-- Function to update supply stats when customerlist changes
CREATE OR REPLACE FUNCTION trigger_update_supply_stats()
RETURNS trigger AS $$
BEGIN
  -- Update totalsupplyspots for the relevant area
  IF NEW.city_area IS NOT NULL THEN
    UPDATE distribution_groups
    SET totalsupplyspots = (
      SELECT COALESCE(SUM(averagesupply), 0)
      FROM customerlist
      WHERE city_area = NEW.city_area
    )
    WHERE separation = NEW.city_area;
  END IF;

  -- Update averagesupplyweek for the relevant city
  IF NEW.city IS NOT NULL THEN
    UPDATE cities
    SET averagesupplyweek = (
      SELECT COALESCE(SUM(averagesupply), 0)
      FROM customerlist
      WHERE city = NEW.city
    )
    WHERE city = NEW.city;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle deletion
CREATE OR REPLACE FUNCTION trigger_delete_supply_stats()
RETURNS trigger AS $$
BEGIN
  -- Update totalsupplyspots for the relevant area
  IF OLD.city_area IS NOT NULL THEN
    UPDATE distribution_groups
    SET totalsupplyspots = (
      SELECT COALESCE(SUM(averagesupply), 0)
      FROM customerlist
      WHERE city_area = OLD.city_area
    )
    WHERE separation = OLD.city_area;
  END IF;

  -- Update averagesupplyweek for the relevant city
  IF OLD.city IS NOT NULL THEN
    UPDATE cities
    SET averagesupplyweek = (
      SELECT COALESCE(SUM(averagesupply), 0)
      FROM customerlist
      WHERE city = OLD.city
    )
    WHERE city = OLD.city;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT/UPDATE
DROP TRIGGER IF EXISTS update_supply_stats_trigger ON customerlist;
CREATE TRIGGER update_supply_stats_trigger
AFTER INSERT OR UPDATE OF averagesupply, city_area, city
ON customerlist
FOR EACH ROW
EXECUTE FUNCTION trigger_update_supply_stats();

-- Create trigger for DELETE
DROP TRIGGER IF EXISTS delete_supply_stats_trigger ON customerlist;
CREATE TRIGGER delete_supply_stats_trigger
AFTER DELETE
ON customerlist
FOR EACH ROW
EXECUTE FUNCTION trigger_delete_supply_stats();

-- Initial update of all existing data
UPDATE distribution_groups dg
SET totalsupplyspots = (
  SELECT COALESCE(SUM(averagesupply), 0)
  FROM customerlist
  WHERE city_area = dg.separation
);

UPDATE cities c
SET averagesupplyweek = (
  SELECT COALESCE(SUM(averagesupply), 0)
  FROM customerlist
  WHERE city = c.city
);