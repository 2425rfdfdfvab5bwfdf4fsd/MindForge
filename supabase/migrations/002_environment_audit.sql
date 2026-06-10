-- Environment audit items table
CREATE TABLE IF NOT EXISTS public.environment_audit_items (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  item        TEXT        NOT NULL,
  category    TEXT        NOT NULL DEFAULT '',
  done        BOOLEAN     NOT NULL DEFAULT FALSE,
  done_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.environment_audit_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own audit items"
  ON public.environment_audit_items
  FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX environment_audit_items_user_id_idx
  ON public.environment_audit_items (user_id);
