-- Step 1: Drop the existing trigger
DROP TRIGGER IF EXISTS trigger_create_city_agent_schedules ON cities;

-- Step 2: Drop the existing function
DROP FUNCTION IF EXISTS create_city_agent_schedules_for_new_city();

-- Step 3: Clean the table - remove all records without matching customers
DELETE FROM city_agent_visit_schedule
WHERE NOT EXISTS (
  SELECT 1 FROM customerlist
  WHERE customerlist.city = city_agent_visit_schedule.city
  AND customerlist.agentnumber = city_agent_visit_schedule.agentnumber
);

-- Step 4: Update customer_count for remaining records and insert missing ones
INSERT INTO city_agent_visit_schedule (city, agentnumber, customer_count)
SELECT 
  c.city,
  c.agentnumber,
  COUNT(*) as customer_count
FROM customerlist c
WHERE c.city IS NOT NULL 
  AND c.agentnumber IS NOT NULL
GROUP BY c.city, c.agentnumber
ON CONFLICT (city, agentnumber) 
DO UPDATE SET customer_count = EXCLUDED.customer_count;

-- Step 5: Create new function that only creates records for agents with customers
CREATE OR REPLACE FUNCTION create_city_agent_schedules_for_new_city()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only insert records for agents that have customers in this city
  INSERT INTO city_agent_visit_schedule (city, agentnumber, customer_count)
  SELECT 
    NEW.city,
    c.agentnumber,
    COUNT(*) as customer_count
  FROM customerlist c
  WHERE c.city = NEW.city
    AND c.agentnumber IS NOT NULL
  GROUP BY c.agentnumber
  ON CONFLICT (city, agentnumber) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create the trigger
CREATE TRIGGER trigger_create_city_agent_schedules
  AFTER INSERT ON cities
  FOR EACH ROW
  EXECUTE FUNCTION create_city_agent_schedules_for_new_city();