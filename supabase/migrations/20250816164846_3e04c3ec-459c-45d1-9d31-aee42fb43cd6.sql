-- Update the existing trigger function to also handle message_alert
CREATE OR REPLACE FUNCTION public.auto_handle_messages_on_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle order completion
  IF TG_TABLE_NAME = 'mainorder' AND NEW.done_mainorder IS NOT NULL AND OLD.done_mainorder IS NULL THEN
    -- Mark related messages as handled
    UPDATE public.messages 
    SET is_handled = true 
    WHERE ordernumber = NEW.ordernumber 
      AND is_handled = false;
    
    -- Set message_alert to false for the completed order
    NEW.message_alert = false;
  END IF;
  
  -- Handle return completion  
  IF TG_TABLE_NAME = 'mainreturns' AND NEW.done_return IS NOT NULL AND OLD.done_return IS NULL THEN
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