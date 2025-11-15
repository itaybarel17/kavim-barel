-- פונקציה לחישוב ועדכון averagesupply עבור כל לקוחות סוכן 99
CREATE OR REPLACE FUNCTION public.update_candy_customer_averagesupply()
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  global_start_date DATE;
  global_end_date DATE;
  span_months NUMERIC;
BEGIN
  -- 1. מצא את תאריך ההזמנה הראשון של סוכן 99
  SELECT MIN(orderdate) INTO global_start_date
  FROM public.mainorder
  WHERE agentnumber = '99'
    AND orderdate IS NOT NULL
    AND ordercancel IS NULL;
  
  -- אם אין הזמנות כלל, אין מה לעדכן
  IF global_start_date IS NULL THEN
    RETURN;
  END IF;
  
  global_end_date := CURRENT_DATE;
  
  -- 2. חישוב מספר החודשים (עם שבר עשרוני)
  span_months := (
    EXTRACT(YEAR FROM age(global_end_date, global_start_date)) * 12
    + EXTRACT(MONTH FROM age(global_end_date, global_start_date))
    + EXTRACT(DAY FROM age(global_end_date, global_start_date)) / 30.0
  )::numeric;
  
  -- אם span_months הוא 0, נמנע חלוקה באפס
  IF span_months = 0 THEN
    span_months := 0.01;
  END IF;
  
  -- 3. עדכון כל הלקוחות של סוכן 99 בטבלה candycustomerlist
  WITH orders AS (
    SELECT 
      m.customernumber,
      COUNT(*) AS total_orders
    FROM public.mainorder m
    WHERE m.agentnumber = '99'
      AND m.orderdate IS NOT NULL
      AND m.ordercancel IS NULL
    GROUP BY m.customernumber
  ),
  calc AS (
    SELECT
      o.customernumber,
      ROUND(
        (o.total_orders::numeric / span_months) / 4.345::numeric,
        3
      ) AS avg_weekly_orders
    FROM orders o
  )
  UPDATE public.candycustomerlist c
  SET averagesupply = calc.avg_weekly_orders
  FROM calc
  WHERE c.customernumber = calc.customernumber;
  
END;
$function$;

-- פונקציית טריגר שמופעלת על שינויים ב-mainorder
CREATE OR REPLACE FUNCTION public.trigger_update_candy_averagesupply()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  -- בדיקה אם הטריגר רלוונטי לסוכן 99
  IF TG_OP = 'INSERT' THEN
    IF NEW.agentnumber = '99' THEN
      PERFORM public.update_candy_customer_averagesupply();
    END IF;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- אם שינו את agentnumber מ-99 או ל-99, או שינו ordercancel/orderdate
    IF (OLD.agentnumber = '99' OR NEW.agentnumber = '99') AND
       (OLD.agentnumber IS DISTINCT FROM NEW.agentnumber OR
        OLD.ordercancel IS DISTINCT FROM NEW.ordercancel OR
        OLD.orderdate IS DISTINCT FROM NEW.orderdate) THEN
      PERFORM public.update_candy_customer_averagesupply();
    END IF;
    
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.agentnumber = '99' THEN
      PERFORM public.update_candy_customer_averagesupply();
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- יצירת הטריגר על טבלת mainorder
DROP TRIGGER IF EXISTS trigger_candy_averagesupply_on_mainorder ON public.mainorder;

CREATE TRIGGER trigger_candy_averagesupply_on_mainorder
  AFTER INSERT OR UPDATE OR DELETE ON public.mainorder
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_candy_averagesupply();