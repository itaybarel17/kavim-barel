-- Function to update averagesupply for a specific city and agent
CREATE OR REPLACE FUNCTION public.update_city_agent_averagesupply(
  target_city TEXT,
  target_agentnumber TEXT
)
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  total_supply NUMERIC;
BEGIN
  -- Calculate sum of averagesupply for the city and agent
  SELECT COALESCE(SUM(averagesupply), 0) INTO total_supply
  FROM public.customerlist
  WHERE city = target_city
    AND agentnumber = target_agentnumber;
  
  -- Update city_agent_visit_schedule
  UPDATE public.city_agent_visit_schedule
  SET averagesupply = total_supply
  WHERE city = target_city
    AND agentnumber = target_agentnumber;
END;
$$;

-- Trigger function to sync averagesupply on customerlist changes
CREATE OR REPLACE FUNCTION public.trigger_update_city_agent_averagesupply()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- For INSERT or UPDATE
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Update for new city and agent
    IF NEW.city IS NOT NULL AND NEW.agentnumber IS NOT NULL THEN
      PERFORM public.update_city_agent_averagesupply(NEW.city, NEW.agentnumber);
    END IF;
  END IF;
  
  -- For UPDATE - also update old values if they changed
  IF TG_OP = 'UPDATE' THEN
    IF (OLD.city IS DISTINCT FROM NEW.city OR OLD.agentnumber IS DISTINCT FROM NEW.agentnumber) THEN
      IF OLD.city IS NOT NULL AND OLD.agentnumber IS NOT NULL THEN
        PERFORM public.update_city_agent_averagesupply(OLD.city, OLD.agentnumber);
      END IF;
    END IF;
  END IF;
  
  -- For DELETE
  IF TG_OP = 'DELETE' THEN
    IF OLD.city IS NOT NULL AND OLD.agentnumber IS NOT NULL THEN
      PERFORM public.update_city_agent_averagesupply(OLD.city, OLD.agentnumber);
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger on customerlist
DROP TRIGGER IF EXISTS trigger_sync_city_agent_averagesupply ON public.customerlist;
CREATE TRIGGER trigger_sync_city_agent_averagesupply
AFTER INSERT OR UPDATE OR DELETE ON public.customerlist
FOR EACH ROW
EXECUTE FUNCTION public.trigger_update_city_agent_averagesupply();

-- Initial population of all existing data
UPDATE public.city_agent_visit_schedule cas
SET averagesupply = (
  SELECT COALESCE(SUM(c.averagesupply), 0)
  FROM public.customerlist c
  WHERE c.city = cas.city
    AND c.agentnumber = cas.agentnumber
);

-- Optional function for manual full refresh
CREATE OR REPLACE FUNCTION public.refresh_all_city_agent_averagesupply()
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.city_agent_visit_schedule cas
  SET averagesupply = (
    SELECT COALESCE(SUM(c.averagesupply), 0)
    FROM public.customerlist c
    WHERE c.city = cas.city
      AND c.agentnumber = cas.agentnumber
  );
END;
$$;