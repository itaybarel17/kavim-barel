-- Temporarily drop foreign key constraints
ALTER TABLE public.customerlist DROP CONSTRAINT IF EXISTS customerlist_newarea_fkey;
ALTER TABLE public.customerlist DROP CONSTRAINT IF EXISTS customerlist_extraarea_fkey;
ALTER TABLE public.candycustomerlist DROP CONSTRAINT IF EXISTS candycustomerlist_newarea_fkey;
ALTER TABLE public.candycustomerlist DROP CONSTRAINT IF EXISTS candycustomerlist_extraarea_fkey;

-- Update distribution_groups first
UPDATE public.distribution_groups 
SET separation = 'שרון דרום'
WHERE separation = 'שרון';

-- Update all customer references
UPDATE public.customerlist 
SET city_area = 'שרון דרום'
WHERE city_area = 'שרון';

UPDATE public.customerlist 
SET newarea = 'שרון דרום'
WHERE newarea = 'שרון';

UPDATE public.customerlist 
SET extraarea = 'שרון דרום'
WHERE extraarea = 'שרון';

UPDATE public.candycustomerlist 
SET city_area = 'שרון דרום'
WHERE city_area = 'שרון';

UPDATE public.candycustomerlist 
SET newarea = 'שרון דרום'
WHERE newarea = 'שרון';

UPDATE public.candycustomerlist 
SET extraarea = 'שרון דרום'
WHERE extraarea = 'שרון';

-- Re-add foreign key constraints
ALTER TABLE public.customerlist 
ADD CONSTRAINT customerlist_extraarea_fkey 
FOREIGN KEY (extraarea) REFERENCES public.distribution_groups(separation);

ALTER TABLE public.customerlist 
ADD CONSTRAINT customerlist_newarea_fkey 
FOREIGN KEY (newarea) REFERENCES public.distribution_groups(separation);

ALTER TABLE public.candycustomerlist 
ADD CONSTRAINT candycustomerlist_extraarea_fkey 
FOREIGN KEY (extraarea) REFERENCES public.distribution_groups(separation);

ALTER TABLE public.candycustomerlist 
ADD CONSTRAINT candycustomerlist_newarea_fkey 
FOREIGN KEY (newarea) REFERENCES public.distribution_groups(separation);