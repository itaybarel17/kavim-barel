-- Drop the old problematic triggers that are causing the "done_return" field error
DROP TRIGGER IF EXISTS auto_handle_messages_on_order_completion ON public.mainorder;
DROP TRIGGER IF EXISTS auto_handle_messages_on_return_completion ON public.mainreturns;

-- Drop the old problematic function
DROP FUNCTION IF EXISTS public.auto_handle_messages_on_completion();