-- Create a function to populate city_agent_visit_schedule with existing data
CREATE OR REPLACE FUNCTION public.populate_city_agent_visit_schedule()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.city_agent_visit_schedule (city, agentnumber, visit_day, customer_count)
  SELECT 
    c.city,
    c.agentnumber,
    mode() WITHIN GROUP (ORDER BY c.agent_visit_day) as visit_day,
    COUNT(*) as customer_count
  FROM public.customerlist c
  WHERE c.agent_visit_day IS NOT NULL
    AND COALESCE(c.active, 'פעיל') = 'פעיל'
  GROUP BY c.city, c.agentnumber
  ON CONFLICT (city, agentnumber) 
  DO UPDATE SET 
    visit_day = EXCLUDED.visit_day,
    customer_count = EXCLUDED.customer_count,
    updated_at = now();
END;
$$;

-- Execute the function to populate the table
SELECT public.populate_city_agent_visit_schedule();

-- Drop the function as it's no longer needed
DROP FUNCTION public.populate_city_agent_visit_schedule();