-- App schema for VI FEXPS (usuarios, emprendedores, config)

CREATE TABLE public.usuarios (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  nombre text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  rol text NOT NULL DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.emprendedores (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actividad text NOT NULL DEFAULT '',
  tipo_participante text NOT NULL DEFAULT '',
  nombres text NOT NULL DEFAULT '',
  documento text NOT NULL DEFAULT '',
  correo text NOT NULL DEFAULT '',
  celular text NOT NULL DEFAULT '',
  nombre_emprendimiento text NOT NULL DEFAULT '',
  linea_negocio text NOT NULL DEFAULT '',
  redes_sociales text NOT NULL DEFAULT '',
  acompanante text NOT NULL DEFAULT '',
  elementos text NOT NULL DEFAULT '',
  productos text NOT NULL DEFAULT '',
  requerimientos text NOT NULL DEFAULT '',
  jornada_preparacion text NOT NULL DEFAULT '',
  autorizacion boolean NOT NULL DEFAULT false,
  estado text NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.config (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.config (key, value)
VALUES ('form_suspended', 'false')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emprendedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios_anon_all" ON public.usuarios
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "emprendedores_anon_all" ON public.emprendedores
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "config_anon_all" ON public.config
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.usuarios TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.emprendedores TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.config TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
