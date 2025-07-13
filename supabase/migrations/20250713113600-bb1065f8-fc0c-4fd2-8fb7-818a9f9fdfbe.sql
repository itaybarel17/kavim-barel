-- Update the subject_message enum to remove 'קו הפצה' and change 'לקוח אחר' to 'הזמנה על לקוח אחר'
ALTER TYPE public.subject_message RENAME TO subject_message_old;

CREATE TYPE public.subject_message AS ENUM (
  'לבטל הזמנה',
  'לדחות', 
  'שינוי מוצרים',
  'הנחות',
  'אספקה',
  'הזמנה על לקוח אחר',
  'מחסן'
);

-- Update the messages table to use the new enum
ALTER TABLE public.messages ALTER COLUMN subject TYPE public.subject_message USING subject::text::public.subject_message;

-- Drop the old enum
DROP TYPE public.subject_message_old;