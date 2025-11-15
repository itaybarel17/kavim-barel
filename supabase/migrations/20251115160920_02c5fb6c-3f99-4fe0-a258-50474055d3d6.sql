-- Fix the trigger function by removing updated_at from INSERT columns
-- It will use the default value automatically
CREATE OR REPLACE FUNCTION public.calculate_city_agent_visit_day()
RETURNS trigger
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
  WHERE c.city = COALESCE(NEW.city, OLD.city)
    AND c.agentnumber = COALESCE(NEW.agentnumber, OLD.agentnumber)
    AND c.agent_visit_day IS NOT NULL
    AND COALESCE(c.active, 'פעיל') = 'פעיל'
  GROUP BY c.city, c.agentnumber
  ON CONFLICT (city, agentnumber) 
  DO UPDATE SET 
    visit_day = EXCLUDED.visit_day,
    customer_count = EXCLUDED.customer_count,
    updated_at = now();
  
  RETURN NEW;
END;
$$;