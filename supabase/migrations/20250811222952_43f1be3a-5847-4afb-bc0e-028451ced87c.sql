-- Add performance indexes for order and return queries
-- These indexes will speed up the complex filtering logic significantly

-- Index for mainorder table with all relevant columns for Calendar filtering
CREATE INDEX IF NOT EXISTS idx_mainorder_calendar_filter 
ON public.mainorder (orderdate, ordercancel, schedule_id, done_mainorder);

-- Index for mainreturns table with all relevant columns for Calendar filtering  
CREATE INDEX IF NOT EXISTS idx_mainreturns_calendar_filter
ON public.mainreturns (returndate, returncancel, schedule_id, done_return);

-- Index for ProductionSummary queries by schedule_id
CREATE INDEX IF NOT EXISTS idx_mainorder_schedule_lookup
ON public.mainorder (schedule_id) WHERE schedule_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_mainreturns_schedule_lookup  
ON public.mainreturns (schedule_id) WHERE schedule_id IS NOT NULL;

-- Index for customer lookup optimization
CREATE INDEX IF NOT EXISTS idx_customerlist_customernumber
ON public.customerlist (customernumber);