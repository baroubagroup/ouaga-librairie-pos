-- ============================================================================
-- BASE DE DONNÉES CLOUD SUPABASE (POSTGRESQL) - SECRÉTARIAT PUBLIC & LIBRAIRIE POS
-- Projet : BAROUBA GROUP (ylrnxuphtaoazlhlmnsd)
-- Mode : 100% Compatible Hors-ligne avec synchronisation miroir
-- ============================================================================

-- 1. Paramètres de la boutique
CREATE TABLE IF NOT EXISTS public.ouaga_pos_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Articles & Services (Fournitures, Photocopies, Papiers, etc.)
CREATE TABLE IF NOT EXISTS public.ouaga_pos_articles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  is_service BOOLEAN DEFAULT FALSE,
  sale_price NUMERIC DEFAULT 0,
  cost_price NUMERIC DEFAULT 0,
  stock INT DEFAULT 0,
  min_alert_stock INT DEFAULT 5,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Ventes & Encaissements (Cash, Orange Money, Moov Money, Crédit)
CREATE TABLE IF NOT EXISTS public.ouaga_pos_sales (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  total_amount NUMERIC DEFAULT 0,
  payment_method TEXT,
  customer_name TEXT,
  seller_name TEXT,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Suivi des Ventes à Crédit (Carnet des Créances Clients)
CREATE TABLE IF NOT EXISTS public.ouaga_pos_credits (
  id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  total_credit NUMERIC DEFAULT 0,
  paid_amount NUMERIC DEFAULT 0,
  remaining_due NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'en_cours',
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Répertoire des Clients Réguliers
CREATE TABLE IF NOT EXISTS public.ouaga_pos_customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Répertoire des Fournisseurs & Grossistes
CREATE TABLE IF NOT EXISTS public.ouaga_pos_suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  total_purchases NUMERIC DEFAULT 0,
  current_debt NUMERIC DEFAULT 0,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Suivi des Dettes Fournisseurs (Arrivages à crédit)
CREATE TABLE IF NOT EXISTS public.ouaga_pos_supplier_debts (
  id TEXT PRIMARY KEY,
  supplier_name TEXT NOT NULL,
  total_amount NUMERIC DEFAULT 0,
  paid_amount NUMERIC DEFAULT 0,
  remaining_due NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'non_regle',
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Dépenses & Sorties de Caisse
CREATE TABLE IF NOT EXISTS public.ouaga_pos_expenses (
  id TEXT PRIMARY KEY,
  motif TEXT NOT NULL,
  amount NUMERIC DEFAULT 0,
  author TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Factures A4 Pro
CREATE TABLE IF NOT EXISTS public.ouaga_pos_invoices (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL,
  customer_name TEXT,
  total_ttc NUMERIC DEFAULT 0,
  template_id TEXT DEFAULT 'tpl-classic',
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Journal d'Audit Immuable SHA-256
CREATE TABLE IF NOT EXISTS public.ouaga_pos_audit_logs (
  id TEXT PRIMARY KEY,
  sequence INT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  action TEXT NOT NULL,
  author TEXT,
  hash TEXT NOT NULL,
  prev_hash TEXT,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Utilisateurs & Codes PIN
CREATE TABLE IF NOT EXISTS public.ouaga_pos_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'vendeur',
  pin TEXT,
  active BOOLEAN DEFAULT TRUE,
  data JSONB NOT NULL
);

-- Index pour accélérer les requêtes
CREATE INDEX IF NOT EXISTS idx_ouaga_articles_cat ON public.ouaga_pos_articles(category);
CREATE INDEX IF NOT EXISTS idx_ouaga_sales_ts ON public.ouaga_pos_sales(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ouaga_credits_status ON public.ouaga_pos_credits(status);
CREATE INDEX IF NOT EXISTS idx_ouaga_audit_seq ON public.ouaga_pos_audit_logs(sequence);

-- Sécurité RLS (Row Level Security)
ALTER TABLE public.ouaga_pos_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ouaga_pos_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ouaga_pos_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ouaga_pos_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ouaga_pos_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ouaga_pos_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ouaga_pos_supplier_debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ouaga_pos_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ouaga_pos_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ouaga_pos_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ouaga_pos_users ENABLE ROW LEVEL SECURITY;
