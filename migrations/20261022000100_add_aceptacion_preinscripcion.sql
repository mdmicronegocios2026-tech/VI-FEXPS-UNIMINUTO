-- Keep historical submissions without an attributed acceptance.
ALTER TABLE public.emprendedores
  ADD COLUMN IF NOT EXISTS aceptacion_preinscripcion boolean;
