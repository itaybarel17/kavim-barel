-- Drop the existing trigger from both tables
DROP TRIGGER IF EXISTS auto_handle_messages_trigger ON public.mainorder;
DROP TRIGGER IF EXISTS auto_handle_messages_trigger ON public.mainreturns;

-- Create separate trigger functions for each table
CREATE OR REPLACE FUNCTION public.auto_handle_mainorder_completion()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.auto_handle_mainreturns_completion()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create separate triggers for each table
CREATE TRIGGER auto_handle_mainorder_completion_trigger
  BEFORE UPDATE ON public.mainorder
  FOR EACH ROW
  EXECUTE FUNCTION auto_handle_mainorder_completion();

CREATE TRIGGER auto_handle_mainreturns_completion_trigger
  BEFORE UPDATE ON public.mainreturns
  FOR EACH ROW
  EXECUTE FUNCTION auto_handle_mainreturns_completion();