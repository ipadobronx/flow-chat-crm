-- Add fields for TA functionality and lead ordering
ALTER TABLE public.leads 
ADD COLUMN incluir_ta boolean DEFAULT false,
ADD COLUMN ta_order integer DEFAULT 0;

-- Create index for better performance on TA queries
CREATE INDEX idx_leads_incluir_ta ON public.leads(incluir_ta) WHERE incluir_ta = true;
CREATE INDEX idx_leads_ta_order ON public.leads(ta_order) WHERE incluir_ta = true;