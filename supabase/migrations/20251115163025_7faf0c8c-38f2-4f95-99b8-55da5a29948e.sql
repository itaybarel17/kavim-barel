-- Create a function to automatically add new cities to city_agent_visit_schedule for all agents
CREATE OR REPLACE FUNCTION create_city_agent_schedules_for_new_city()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a record for each agent when a new city is added
  INSERT INTO city_agent_visit_schedule (city, agentnumber, customer_count)
  SELECT 
    NEW.city,
    a.agentnumber,
    0
  FROM agents a
  ON CONFLICT (city, agentnumber) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to run this function when new cities are inserted
DROP TRIGGER IF EXISTS trigger_create_city_agent_schedules ON cities;
CREATE TRIGGER trigger_create_city_agent_schedules
  AFTER INSERT ON cities
  FOR EACH ROW
  EXECUTE FUNCTION create_city_agent_schedules_for_new_city();

-- Also create initial records for existing cities that don't have schedules yet
INSERT INTO city_agent_visit_schedule (city, agentnumber, customer_count)
SELECT 
  c.city,
  a.agentnumber,
  0
FROM cities c
CROSS JOIN agents a
WHERE NOT EXISTS (
  SELECT 1 
  FROM city_agent_visit_schedule cas 
  WHERE cas.city = c.city 
  AND cas.agentnumber = a.agentnumber
)
ON CONFLICT (city, agentnumber) DO NOTHING;