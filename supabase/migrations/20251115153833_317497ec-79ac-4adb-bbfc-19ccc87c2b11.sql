-- Create city_agent_visit_schedule table
CREATE TABLE IF NOT EXISTS public.city_agent_visit_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL,
  agentnumber text NOT NULL,
  visit_day text,
  customer_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(city, agentnumber)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_city_agent_visit_schedule_agent ON public.city_agent_visit_schedule(agentnumber, visit_day);
CREATE INDEX IF NOT EXISTS idx_city_agent_visit_schedule_city ON public.city_agent_visit_schedule(city);

-- Enable RLS
ALTER TABLE public.city_agent_visit_schedule ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable read access for all users"
  ON public.city_agent_visit_schedule FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for all users"
  ON public.city_agent_visit_schedule FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update for all users"
  ON public.city_agent_visit_schedule FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for all users"
  ON public.city_agent_visit_schedule FOR DELETE
  USING (true);

-- Function to calculate city+agent visit day and customer count
CREATE OR REPLACE FUNCTION public.calculate_city_agent_visit_day()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Update or create record for city+agent
  INSERT INTO public.city_agent_visit_schedule (city, agentnumber, visit_day, customer_count, updated_at)
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
    
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger to auto-calculate when customerlist changes
CREATE TRIGGER update_city_agent_schedule_on_customer_change
AFTER INSERT OR UPDATE OF agent_visit_day, city, agentnumber, active
ON public.customerlist
FOR EACH ROW
EXECUTE FUNCTION public.calculate_city_agent_visit_day();

-- Trigger to also handle deletions
CREATE TRIGGER update_city_agent_schedule_on_customer_delete
AFTER DELETE
ON public.customerlist
FOR EACH ROW
EXECUTE FUNCTION public.calculate_city_agent_visit_day();

-- Function to update all customers when city schedule changes
CREATE OR REPLACE FUNCTION public.update_customers_on_city_schedule_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- When visit_day is manually changed in city_agent_visit_schedule,
  -- update all customers of that city+agent
  
  IF NEW.visit_day IS DISTINCT FROM OLD.visit_day THEN
    UPDATE public.customerlist
    SET agent_visit_day = NEW.visit_day
    WHERE city = NEW.city
      AND agentnumber = NEW.agentnumber
      AND COALESCE(active, 'פעיל') = 'פעיל';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to update customers when city schedule changes
CREATE TRIGGER update_customers_when_city_schedule_changes
AFTER UPDATE OF visit_day
ON public.city_agent_visit_schedule
FOR EACH ROW
WHEN (NEW.visit_day IS DISTINCT FROM OLD.visit_day)
EXECUTE FUNCTION public.update_customers_on_city_schedule_change();