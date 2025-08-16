-- Fix search_path for the new trigger functions
CREATE OR REPLACE FUNCTION public.auto_handle_mainorder_completion()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path TO ''
AS $$
BEGIN
  -- Only handle completion (when done_mainorder changes from NULL to non-NULL)
  IF NEW.done_mainorder IS NOT NULL AND OLD.done_mainorder IS NULL THEN
    -- Mark related messages as handled
    UPDATE public.messages 
    SET is_handled = true 
    WHERE ordernumber = NEW.ordernumber 
      AND is_handled = false;
    
    -- Set message_alert to false for the completed order
    NEW.message_alert = false;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_handle_mainreturns_completion()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path TO ''
AS $$
BEGIN
  -- Only handle completion (when done_return changes from NULL to non-NULL)
  IF NEW.done_return IS NOT NULL AND OLD.done_return IS NULL THEN
    -- Mark related messages as handled
    UPDATE public.messages 
    SET is_handled = true 
    WHERE returnnumber = NEW.returnnumber 
      AND is_handled = false;
    
    -- Set message_alert to false for the completed return
    NEW.message_alert = false;
  END IF;
  
  RETURN NEW;
END;
$$;