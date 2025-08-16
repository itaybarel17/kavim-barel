-- Create trigger function to automatically mark messages as handled when orders/returns are completed
CREATE OR REPLACE FUNCTION public.auto_handle_messages_on_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle order completion
  IF TG_TABLE_NAME = 'mainorder' AND NEW.done_mainorder IS NOT NULL AND OLD.done_mainorder IS NULL THEN
    UPDATE public.messages 
    SET is_handled = true 
    WHERE ordernumber = NEW.ordernumber 
      AND is_handled = false;
  END IF;
  
  -- Handle return completion  
  IF TG_TABLE_NAME = 'mainreturns' AND NEW.done_return IS NOT NULL AND OLD.done_return IS NULL THEN
    UPDATE public.messages 
    SET is_handled = true 
    WHERE returnnumber = NEW.returnnumber 
      AND is_handled = false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for mainorder table
CREATE TRIGGER auto_handle_messages_on_order_completion
  AFTER UPDATE ON public.mainorder
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_handle_messages_on_completion();

-- Create triggers for mainreturns table  
CREATE TRIGGER auto_handle_messages_on_return_completion
  AFTER UPDATE ON public.mainreturns
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_handle_messages_on_completion();