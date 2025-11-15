-- Fix the function to have proper search_path
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;