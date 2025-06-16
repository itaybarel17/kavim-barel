
-- הפעלת הרחבת pgcrypto להצפנה
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- הוספת עמודה חדשה להצפנת הסיסמאות
ALTER TABLE public.agents 
ADD COLUMN password_hash TEXT;

-- הצפנת כל הסיסמאות הקיימות
UPDATE public.agents 
SET password_hash = crypt(password_onlyview, gen_salt('bf'))
WHERE password_onlyview IS NOT NULL;

-- פונקציה לאימות סיסמה מוצפנת
CREATE OR REPLACE FUNCTION public.verify_agent_password(
  agent_number TEXT,
  input_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stored_hash TEXT;
BEGIN
  SELECT password_hash INTO stored_hash
  FROM public.agents
  WHERE agentnumber::text = agent_number;
  
  IF stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN (stored_hash = crypt(input_password, stored_hash));
END;
$$;

-- פונקציה לעדכון סיסמה (לשימוש עתידי)
CREATE OR REPLACE FUNCTION public.update_agent_password(
  agent_number TEXT,
  new_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.agents
  SET password_hash = crypt(new_password, gen_salt('bf'))
  WHERE agentnumber::text = agent_number;
  
  RETURN FOUND;
END;
$$;
