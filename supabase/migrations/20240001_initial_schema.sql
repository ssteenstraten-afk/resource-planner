-- =============================================
-- TABELLEN
-- =============================================

CREATE TABLE IF NOT EXISTS consultants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  naam text NOT NULL,
  email text NOT NULL UNIQUE,
  functieniveau text NOT NULL,
  contract_uren integer NOT NULL DEFAULT 40,
  actief boolean DEFAULT true,
  rol text NOT NULL DEFAULT 'consultant',
  CONSTRAINT rol_check CHECK (rol IN ('consultant', 'planner'))
);

CREATE TABLE IF NOT EXISTS projecten (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  naam text NOT NULL,
  klant text,
  startdatum date,
  einddatum date,
  status text DEFAULT 'actief',
  is_systeem boolean DEFAULT false,
  CONSTRAINT status_check CHECK (status IN ('actief', 'afgesloten'))
);

CREATE TABLE IF NOT EXISTS bezetting (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id uuid REFERENCES consultants(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projecten(id) ON DELETE CASCADE,
  jaar integer NOT NULL,
  week integer NOT NULL,
  uren numeric(4,1) NOT NULL DEFAULT 0,
  UNIQUE (consultant_id, project_id, jaar, week),
  CONSTRAINT uren_check CHECK (uren >= 0 AND uren <= 60)
);

CREATE TABLE IF NOT EXISTS bezetting_snapshot (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_week integer NOT NULL,
  snapshot_jaar integer NOT NULL,
  consultant_id uuid REFERENCES consultants(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projecten(id) ON DELETE CASCADE,
  jaar integer NOT NULL,
  week integer NOT NULL,
  uren numeric(4,1) NOT NULL,
  gemaakt_op timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bezetting_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bezetting_id uuid REFERENCES bezetting(id) ON DELETE SET NULL,
  oude_uren numeric(4,1),
  nieuwe_uren numeric(4,1),
  gewijzigd_door uuid REFERENCES consultants(id) ON DELETE SET NULL,
  gewijzigd_op timestamptz DEFAULT now()
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_bezetting_consultant_week ON bezetting(consultant_id, jaar, week);
CREATE INDEX IF NOT EXISTS idx_bezetting_project ON bezetting(project_id);
CREATE INDEX IF NOT EXISTS idx_bezetting_snapshot_week ON bezetting_snapshot(snapshot_jaar, snapshot_week);
CREATE INDEX IF NOT EXISTS idx_bezetting_log_bezetting ON bezetting_log(bezetting_id);

-- =============================================
-- TRIGGER: automatische bezetting_log bij UPDATE
-- =============================================

CREATE OR REPLACE FUNCTION log_bezetting_wijziging()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.uren IS DISTINCT FROM NEW.uren THEN
    INSERT INTO bezetting_log (bezetting_id, oude_uren, nieuwe_uren, gewijzigd_door)
    VALUES (NEW.id, OLD.uren, NEW.uren, auth.uid()::uuid);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS bezetting_update_log ON bezetting;
CREATE TRIGGER bezetting_update_log
  AFTER UPDATE ON bezetting
  FOR EACH ROW
  EXECUTE FUNCTION log_bezetting_wijziging();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE consultants ENABLE ROW LEVEL SECURITY;
ALTER TABLE projecten ENABLE ROW LEVEL SECURITY;
ALTER TABLE bezetting ENABLE ROW LEVEL SECURITY;
ALTER TABLE bezetting_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE bezetting_log ENABLE ROW LEVEL SECURITY;

-- Helper functie: haal rol op van huidige gebruiker
CREATE OR REPLACE FUNCTION get_mijn_rol()
RETURNS text AS $$
  SELECT rol FROM consultants WHERE id = auth.uid()::uuid;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper functie: haal consultant_id op van huidige gebruiker
CREATE OR REPLACE FUNCTION get_mijn_consultant_id()
RETURNS uuid AS $$
  SELECT id FROM consultants WHERE id = auth.uid()::uuid;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ---- consultants ----
-- Planner: alles
CREATE POLICY "planner_alles_consultants" ON consultants
  FOR ALL TO authenticated
  USING (get_mijn_rol() = 'planner')
  WITH CHECK (get_mijn_rol() = 'planner');

-- Consultant: alleen eigen rij lezen
CREATE POLICY "consultant_eigen_lezen" ON consultants
  FOR SELECT TO authenticated
  USING (id = auth.uid()::uuid);

-- ---- projecten ----
-- Planner: alles
CREATE POLICY "planner_alles_projecten" ON projecten
  FOR ALL TO authenticated
  USING (get_mijn_rol() = 'planner')
  WITH CHECK (get_mijn_rol() = 'planner');

-- Consultant: alle projecten lezen (nodig voor weekoverzicht)
CREATE POLICY "consultant_projecten_lezen" ON projecten
  FOR SELECT TO authenticated
  USING (get_mijn_rol() = 'consultant');

-- ---- bezetting ----
-- Planner: alles
CREATE POLICY "planner_alles_bezetting" ON bezetting
  FOR ALL TO authenticated
  USING (get_mijn_rol() = 'planner')
  WITH CHECK (get_mijn_rol() = 'planner');

-- Consultant: alleen eigen bezetting lezen en schrijven
CREATE POLICY "consultant_eigen_bezetting_lezen" ON bezetting
  FOR SELECT TO authenticated
  USING (consultant_id = auth.uid()::uuid AND get_mijn_rol() = 'consultant');

CREATE POLICY "consultant_eigen_bezetting_schrijven" ON bezetting
  FOR INSERT TO authenticated
  WITH CHECK (consultant_id = auth.uid()::uuid AND get_mijn_rol() = 'consultant');

CREATE POLICY "consultant_eigen_bezetting_updaten" ON bezetting
  FOR UPDATE TO authenticated
  USING (consultant_id = auth.uid()::uuid AND get_mijn_rol() = 'consultant')
  WITH CHECK (consultant_id = auth.uid()::uuid AND get_mijn_rol() = 'consultant');

-- ---- bezetting_snapshot ----
-- Planner: alles lezen
CREATE POLICY "planner_snapshot_lezen" ON bezetting_snapshot
  FOR SELECT TO authenticated
  USING (get_mijn_rol() = 'planner');

-- ---- bezetting_log ----
-- Planner: alles lezen
CREATE POLICY "planner_log_lezen" ON bezetting_log
  FOR SELECT TO authenticated
  USING (get_mijn_rol() = 'planner');

-- Consultant: eigen log lezen
CREATE POLICY "consultant_eigen_log_lezen" ON bezetting_log
  FOR SELECT TO authenticated
  USING (
    get_mijn_rol() = 'consultant' AND
    bezetting_id IN (
      SELECT id FROM bezetting WHERE consultant_id = auth.uid()::uuid
    )
  );

-- =============================================
-- SEED DATA: systeemprojecten
-- =============================================

INSERT INTO projecten (naam, klant, status, is_systeem) VALUES
  ('Verlof', NULL, 'actief', true),
  ('Bench', NULL, 'actief', true)
ON CONFLICT DO NOTHING;
