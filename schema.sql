-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.account (
  id text NOT NULL,
  accountId text NOT NULL,
  providerId text NOT NULL,
  userId text NOT NULL,
  accessToken text,
  refreshToken text,
  idToken text,
  accessTokenExpiresAt timestamp without time zone,
  refreshTokenExpiresAt timestamp without time zone,
  scope text,
  password text,
  createdAt timestamp without time zone NOT NULL DEFAULT now(),
  updatedAt timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT account_pkey PRIMARY KEY (id),
  CONSTRAINT account_userId_fkey FOREIGN KEY (userId) REFERENCES public.user(id)
);
CREATE TABLE public.artifacts (
  id integer NOT NULL DEFAULT nextval('artifacts_id_seq'::regclass),
  type character varying NOT NULL,
  val_text text NOT NULL,
  severity character varying DEFAULT 'INFO'::character varying,
  src_url text,
  sha256 character varying,
  mime character varying,
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT artifacts_pkey PRIMARY KEY (id)
);
CREATE TABLE public.attack_meta (
  attack_type_code text NOT NULL,
  prevalence numeric,
  raw_weight numeric,
  CONSTRAINT attack_meta_pkey PRIMARY KEY (attack_type_code)
);
CREATE TABLE public.attack_type (
  code text NOT NULL,
  prevalence numeric,
  cost_weight numeric,
  CONSTRAINT attack_type_pkey PRIMARY KEY (code)
);
CREATE TABLE public.compromised_credentials (
  id integer NOT NULL DEFAULT nextval('compromised_credentials_id_seq'::regclass),
  scan_id character varying NOT NULL,
  company_domain character varying NOT NULL,
  username character varying,
  email character varying,
  breach_source character varying NOT NULL,
  breach_date date,
  has_password boolean DEFAULT false,
  has_cookies boolean DEFAULT false,
  has_autofill boolean DEFAULT false,
  has_browser_data boolean DEFAULT false,
  field_count integer DEFAULT 0,
  risk_level character varying NOT NULL,
  email_type character varying,
  first_name character varying,
  last_name character varying,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT compromised_credentials_pkey PRIMARY KEY (id)
);
CREATE TABLE public.correlation_adjustment (
  instance_number integer NOT NULL,
  correlation_factor numeric NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT correlation_adjustment_pkey PRIMARY KEY (instance_number)
);
CREATE TABLE public.dow_cost_constants (
  id integer NOT NULL DEFAULT nextval('dow_cost_constants_id_seq'::regclass),
  finding_type character varying NOT NULL DEFAULT 'DENIAL_OF_WALLET'::character varying,
  tokens_per_request_default integer NOT NULL DEFAULT 750,
  tokens_per_request_openai integer NOT NULL DEFAULT 800,
  tokens_per_request_anthropic integer NOT NULL DEFAULT 650,
  tokens_per_request_cohere integer NOT NULL DEFAULT 500,
  memory_mb_aws_lambda integer NOT NULL DEFAULT 256,
  memory_mb_gcp_functions integer NOT NULL DEFAULT 128,
  memory_mb_azure_functions integer NOT NULL DEFAULT 128,
  memory_mb_default integer NOT NULL DEFAULT 128,
  window_trivial_bypass integer NOT NULL DEFAULT 86400,
  window_high_bypass integer NOT NULL DEFAULT 21600,
  window_medium_bypass integer NOT NULL DEFAULT 7200,
  window_low_bypass integer NOT NULL DEFAULT 1800,
  auth_bypass_threshold_trivial numeric NOT NULL DEFAULT 0.90,
  auth_bypass_threshold_high numeric NOT NULL DEFAULT 0.50,
  auth_bypass_threshold_medium numeric NOT NULL DEFAULT 0.20,
  complexity_multiplier_trivial numeric NOT NULL DEFAULT 3.00,
  complexity_multiplier_low numeric NOT NULL DEFAULT 2.00,
  complexity_multiplier_medium numeric NOT NULL DEFAULT 1.00,
  complexity_multiplier_high numeric NOT NULL DEFAULT 0.30,
  rps_threshold_high integer NOT NULL DEFAULT 50,
  rps_threshold_medium integer NOT NULL DEFAULT 10,
  rps_multiplier_high numeric NOT NULL DEFAULT 1.50,
  rps_multiplier_medium numeric NOT NULL DEFAULT 1.20,
  rps_multiplier_low numeric NOT NULL DEFAULT 1.00,
  discovery_likelihood_api numeric NOT NULL DEFAULT 0.80,
  discovery_likelihood_other numeric NOT NULL DEFAULT 0.40,
  daily_to_weekly_factor numeric NOT NULL DEFAULT 5.0,
  daily_to_monthly_factor numeric NOT NULL DEFAULT 20.0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT dow_cost_constants_pkey PRIMARY KEY (id)
);
CREATE TABLE public.finding (
  id integer NOT NULL DEFAULT nextval('finding_id_seq'::regclass),
  scan_id uuid,
  asset text,
  category text,
  attack_type text,
  severity text,
  rationale jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT finding_pkey PRIMARY KEY (id),
  CONSTRAINT finding_severity_fkey FOREIGN KEY (severity) REFERENCES public.severity_weight(severity),
  CONSTRAINT finding_attack_type_fkey FOREIGN KEY (attack_type) REFERENCES public.attack_type(code)
);
CREATE TABLE public.finding_probability_modifiers (
  finding_type text NOT NULL,
  probability_modifier numeric NOT NULL DEFAULT 1.0,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT finding_probability_modifiers_pkey PRIMARY KEY (finding_type)
);
CREATE TABLE public.findings (
  id bigint NOT NULL DEFAULT nextval('findings_id_seq'::regclass),
  artifact_id bigint NOT NULL,
  finding_type character varying NOT NULL,
  recommendation text NOT NULL,
  description text NOT NULL,
  repro_command text,
  remediation jsonb,
  created_at timestamp with time zone DEFAULT now(),
  scan_id character varying,
  type character varying DEFAULT finding_type,
  severity character varying,
  attack_type_code text,
  state character varying DEFAULT 'active'::character varying,
  eal_low bigint,
  eal_ml integer,
  eal_high bigint,
  eal_daily integer,
  CONSTRAINT findings_pkey PRIMARY KEY (id),
  CONSTRAINT findings_artifact_id_fkey FOREIGN KEY (artifact_id) REFERENCES public.artifacts(id)
);
CREATE TABLE public.findings_archive (
  id integer NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  description text,
  scan_id character varying,
  type character varying,
  recommendation text,
  severity character varying,
  attack_type_code text,
  state USER-DEFINED NOT NULL DEFAULT 'AUTOMATED'::finding_state,
  eal_low bigint,
  eal_ml integer,
  eal_high bigint,
  eal_daily integer,
  CONSTRAINT findings_archive_pkey PRIMARY KEY (id)
);
CREATE TABLE public.findings_sev_backup (
  id integer,
  severity_level text
);
CREATE TABLE public.legal_contingent_liabilities (
  id integer NOT NULL DEFAULT nextval('legal_contingent_liabilities_id_seq'::regclass),
  scan_id character varying NOT NULL,
  finding_id integer,
  liability_type character varying NOT NULL DEFAULT 'ADA_COMPLIANCE'::character varying,
  one_time_exposure_low integer,
  one_time_exposure_ml integer,
  one_time_exposure_high integer,
  remediation_cost integer DEFAULT 5000,
  status character varying DEFAULT 'OPEN'::character varying,
  temporal_modifier numeric DEFAULT 1.0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT legal_contingent_liabilities_pkey PRIMARY KEY (id)
);
CREATE TABLE public.report_jobs (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  scan_id text,
  report_type text NOT NULL CHECK (report_type = ANY (ARRAY['threat_snapshot'::text, 'executive_summary'::text, 'technical_remediation'::text])),
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text, 'cancelled'::text])),
  tokens_input integer DEFAULT 0,
  tokens_output integer DEFAULT 0,
  cost_usd numeric DEFAULT 0,
  markdown_content text,
  html_content text,
  storage_path text,
  created_at timestamp with time zone DEFAULT now(),
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  error_message text,
  requested_by text,
  auto_generated boolean DEFAULT false,
  CONSTRAINT report_jobs_pkey PRIMARY KEY (id),
  CONSTRAINT report_jobs_scan_id_fkey FOREIGN KEY (scan_id) REFERENCES public.scan_status(scan_id)
);
CREATE TABLE public.report_templates (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  report_type text NOT NULL UNIQUE CHECK (report_type = ANY (ARRAY['threat_snapshot'::text, 'executive_summary'::text, 'technical_remediation'::text])),
  system_prompt text NOT NULL,
  user_prompt_template text NOT NULL,
  max_output_tokens integer DEFAULT 8000,
  estimated_cost_usd numeric DEFAULT 0.02,
  version integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT report_templates_pkey PRIMARY KEY (id)
);
CREATE TABLE public.reports (
  id character varying NOT NULL,
  user_id uuid,
  json_url text,
  pdf_url text,
  created_at timestamp without time zone DEFAULT now(),
  company_name text,
  domain text,
  scan_id text,
  content text,
  findings_count integer DEFAULT 0,
  status text DEFAULT 'pending'::text,
  CONSTRAINT reports_pkey PRIMARY KEY (id),
  CONSTRAINT fk_reports_scan_id FOREIGN KEY (scan_id) REFERENCES public.scan_status(scan_id)
);
CREATE TABLE public.reports_archive (
  id character varying NOT NULL,
  user_id uuid,
  json_url text,
  pdf_url text,
  created_at timestamp without time zone DEFAULT now(),
  company_name text,
  domain text,
  scan_id text,
  content text,
  findings_count integer DEFAULT 0,
  status text DEFAULT 'pending'::text,
  CONSTRAINT reports_archive_pkey PRIMARY KEY (id),
  CONSTRAINT reports_archive_scan_id_fkey FOREIGN KEY (scan_id) REFERENCES public.scan_status(scan_id)
);
CREATE TABLE public.risk_constants (
  key text NOT NULL,
  value numeric,
  CONSTRAINT risk_constants_pkey PRIMARY KEY (key)
);
CREATE TABLE public.scan_financials_cache (
  scan_id text NOT NULL,
  finding_id bigint NOT NULL,
  asset text,
  category text,
  severity text,
  eal_low numeric,
  eal_ml numeric,
  eal_high numeric,
  CONSTRAINT scan_financials_cache_pkey PRIMARY KEY (finding_id)
);
CREATE TABLE public.scan_status (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  scan_id text NOT NULL UNIQUE,
  company_name text NOT NULL,
  domain text NOT NULL,
  status text NOT NULL,
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  current_module text,
  total_modules integer DEFAULT 10,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  last_updated timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  total_artifacts_count integer DEFAULT 0,
  max_severity character varying,
  total_findings_count integer DEFAULT 0,
  CONSTRAINT scan_status_pkey PRIMARY KEY (id)
);
CREATE TABLE public.scan_status_archive (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  scan_id text NOT NULL UNIQUE,
  company_name text NOT NULL,
  domain text NOT NULL,
  status text NOT NULL,
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  current_module text,
  total_modules integer DEFAULT 10,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  last_updated timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  total_artifacts_count integer DEFAULT 0,
  max_severity character varying,
  total_findings_count integer DEFAULT 0,
  CONSTRAINT scan_status_archive_pkey PRIMARY KEY (id)
);
CREATE TABLE public.scan_totals_automated (
  id integer NOT NULL DEFAULT nextval('scan_totals_automated_id_seq'::regclass),
  scan_id character varying NOT NULL UNIQUE,
  company_domain character varying NOT NULL,
  phishing_bec_low numeric DEFAULT 0,
  phishing_bec_ml numeric DEFAULT 0,
  phishing_bec_high numeric DEFAULT 0,
  site_hack_low numeric DEFAULT 0,
  site_hack_ml numeric DEFAULT 0,
  site_hack_high numeric DEFAULT 0,
  malware_low numeric DEFAULT 0,
  malware_ml numeric DEFAULT 0,
  malware_high numeric DEFAULT 0,
  cyber_total_low numeric DEFAULT 0,
  cyber_total_ml numeric DEFAULT 0,
  cyber_total_high numeric DEFAULT 0,
  ada_compliance_low numeric DEFAULT 0,
  ada_compliance_ml numeric DEFAULT 0,
  ada_compliance_high numeric DEFAULT 0,
  dow_daily_low numeric DEFAULT 0,
  dow_daily_ml numeric DEFAULT 0,
  dow_daily_high numeric DEFAULT 0,
  total_findings integer DEFAULT 0,
  verified_findings integer DEFAULT 0,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT scan_totals_automated_pkey PRIMARY KEY (id)
);
CREATE TABLE public.scan_totals_verified (
  id integer NOT NULL DEFAULT nextval('scan_totals_verified_id_seq'::regclass),
  scan_id character varying NOT NULL UNIQUE,
  company_domain character varying NOT NULL,
  phishing_bec_low numeric DEFAULT 0,
  phishing_bec_ml numeric DEFAULT 0,
  phishing_bec_high numeric DEFAULT 0,
  site_hack_low numeric DEFAULT 0,
  site_hack_ml numeric DEFAULT 0,
  site_hack_high numeric DEFAULT 0,
  malware_low numeric DEFAULT 0,
  malware_ml numeric DEFAULT 0,
  malware_high numeric DEFAULT 0,
  cyber_total_low numeric DEFAULT 0,
  cyber_total_ml numeric DEFAULT 0,
  cyber_total_high numeric DEFAULT 0,
  ada_compliance_low numeric DEFAULT 0,
  ada_compliance_ml numeric DEFAULT 0,
  ada_compliance_high numeric DEFAULT 0,
  dow_daily_low numeric DEFAULT 0,
  dow_daily_ml numeric DEFAULT 0,
  dow_daily_high numeric DEFAULT 0,
  total_findings integer DEFAULT 0,
  verified_findings integer DEFAULT 0,
  verified_at timestamp without time zone,
  verified_by character varying,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  automated_id integer,
  CONSTRAINT scan_totals_verified_pkey PRIMARY KEY (id),
  CONSTRAINT scan_totals_verified_automated_id_fkey FOREIGN KEY (automated_id) REFERENCES public.scan_totals_automated(id)
);
CREATE TABLE public.search_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  organization text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT search_events_pkey PRIMARY KEY (id)
);
CREATE TABLE public.security_reports (
  id integer NOT NULL DEFAULT nextval('security_reports_id_seq'::regclass),
  scan_id character varying NOT NULL UNIQUE,
  company_name character varying NOT NULL,
  report_content text NOT NULL,
  executive_summary text,
  generated_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  report_url text,
  CONSTRAINT security_reports_pkey PRIMARY KEY (id)
);
CREATE TABLE public.session (
  id text NOT NULL,
  expiresAt timestamp without time zone NOT NULL,
  token text NOT NULL UNIQUE,
  createdAt timestamp without time zone NOT NULL DEFAULT now(),
  updatedAt timestamp without time zone NOT NULL DEFAULT now(),
  ipAddress text,
  userAgent text,
  userId text NOT NULL,
  CONSTRAINT session_pkey PRIMARY KEY (id),
  CONSTRAINT session_userId_fkey FOREIGN KEY (userId) REFERENCES public.user(id)
);
CREATE TABLE public.severity_weight (
  severity text NOT NULL,
  multiplier numeric,
  CONSTRAINT severity_weight_pkey PRIMARY KEY (severity)
);
CREATE TABLE public.subscription (
  id text NOT NULL,
  plan text NOT NULL,
  referenceId text NOT NULL,
  stripeCustomerId text,
  stripeSubscriptionId text,
  status text NOT NULL,
  periodStart timestamp without time zone,
  periodEnd timestamp without time zone,
  cancelAtPeriodEnd boolean,
  seats integer,
  trialStart timestamp without time zone,
  trialEnd timestamp without time zone,
  createdAt timestamp without time zone NOT NULL DEFAULT now(),
  updatedAt timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT subscription_pkey PRIMARY KEY (id)
);
CREATE TABLE public.temporal_decay_config (
  id integer NOT NULL DEFAULT nextval('temporal_decay_config_id_seq'::regclass),
  days_min integer NOT NULL,
  days_max integer,
  decay_factor numeric NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT temporal_decay_config_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user (
  id text NOT NULL,
  email text NOT NULL UNIQUE,
  emailVerified boolean NOT NULL DEFAULT false,
  name text,
  image text,
  createdAt timestamp without time zone NOT NULL DEFAULT now(),
  updatedAt timestamp without time zone NOT NULL DEFAULT now(),
  stripeCustomerId text,
  CONSTRAINT user_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_brief_counts (
  user_id text NOT NULL,
  current_month_count integer NOT NULL DEFAULT 0,
  current_month_start date NOT NULL DEFAULT (date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone))::date,
  total_count integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_brief_counts_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_brief_counts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user(id)
);
CREATE TABLE public.user_briefs (
  id integer NOT NULL DEFAULT nextval('user_briefs_id_seq'::regclass),
  user_id text NOT NULL,
  name text NOT NULL,
  organization text NOT NULL,
  brief_content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_briefs_pkey PRIMARY KEY (id),
  CONSTRAINT user_briefs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user(id)
);
CREATE TABLE public.verification (
  id text NOT NULL,
  identifier text NOT NULL,
  value text NOT NULL,
  expiresAt timestamp without time zone NOT NULL,
  createdAt timestamp without time zone NOT NULL DEFAULT now(),
  updatedAt timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT verification_pkey PRIMARY KEY (id)
);