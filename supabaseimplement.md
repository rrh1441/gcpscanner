# SUPABASE SQL COMMANDS - COPY PASTE THESE INTO SQL EDITOR

## 1. Create Tables
```sql
create table if not exists report_jobs (
  id bigint generated always as identity primary key,
  scan_id text references scan_status(scan_id) on delete cascade,
  report_type text not null check (report_type in ('threat_snapshot', 'executive_summary', 'technical_remediation')),
  status text default 'pending' check (status in ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  tokens_input integer default 0,
  tokens_output integer default 0,
  cost_usd numeric(10,6) default 0,
  markdown_content text,
  html_content text,
  storage_path text,
  created_at timestamptz default now(),
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  requested_by text,
  auto_generated boolean default false
);

create index if not exists idx_report_jobs_scan_id on report_jobs(scan_id);
create index if not exists idx_report_jobs_status on report_jobs(status);
create index if not exists idx_report_jobs_type on report_jobs(report_type);
create index if not exists idx_report_jobs_created_at on report_jobs(created_at);

create table if not exists report_templates (
  id bigint generated always as identity primary key,
  report_type text not null unique check (report_type in ('threat_snapshot', 'executive_summary', 'technical_remediation')),
  system_prompt text not null,
  user_prompt_template text not null,
  max_output_tokens integer default 8000,
  estimated_cost_usd numeric(8,6) default 0.02,
  version integer default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## 2. Insert Prompts
```sql
insert into report_templates (report_type, system_prompt, user_prompt_template, max_output_tokens, estimated_cost_usd) 
values 
(
  'threat_snapshot',
  'You are DealBrief-AI, a senior cybersecurity analyst. Return ONLY GitHub-flavoured Markdown containing: 1. A YAML front-matter block with the exact fields: company, domain, scan_date, eal_low, eal_ml, eal_high, legal_liability_total, daily_cost_amplification, overall_risk_score 2. A body ≤650 words (≈2 printed pages), no external links. All numeric outputs MUST be formatted as e.g. $123,456 or 12 %. Never invent data; derive from the user message only. If a value is 0 or absent, omit the corresponding bullet / table column.',
  'INPUT: {scan_data} {risk_totals} company_name: {company_name} domain: {domain} scan_date: {scan_date} TASK: Generate an executive-ready Threat Snapshot: EXECUTIVE DASHBOARD - Header: {company_name} — Cybersecurity Threat Snapshot ({scan_date}) - Financial Impact Summary: bullets for Annual Cyber Loss Exposure, Legal/Compliance Exposure (one-time), Cloud Cost Abuse Risk (per-day). - Overall Risk Score: X / 100 (brief 1-sentence methodology). - Threat Landscape Table with columns Critical / High / Medium / Low / Primary Concern for each category (External, Infrastructure, Legal, Cloud). KEY FINDINGS & NEXT STEPS If critical or high findings exist: - List top 3 critical and top 5 high actions with 1-line impact each. Else: - Provide 3 preventive recommendations. STYLE Plain-English, board-level tone. Avoid jargon; explain technical terms in parentheses. Highlight financial impact and business continuity.',
  2000,
  0.02
),
(
  'executive_summary', 
  'You are DealBrief-AI, a principal cybersecurity consultant. Return ONLY Markdown with: 1. YAML front-matter: company, domain, scan_date, overall_posture, eal_total, eal_range, benchmarks_used 2. Body ≤2 500 words (≤6 pages). Use < 6 H2 headings. Strictly follow any conditional instructions; omit headings that have no content.',
  'INPUT: scan_data: {scan_data} risk_calculations: {risk_calculations} company_profile: {company_profile} threat_landscape: {threat_landscape} historical_data: {historical_data} TASK: Create an Executive Security Briefing with these sections: 1 Executive Summary - Overall security posture (Excellent / Good / Needs Improvement / Critical). - Top 3 business risks (1-line each). - Annual loss exposure with 90 % confidence range. - 3-line strategic recommendation block. 2 Threat Landscape Analysis Merge external-actor intel with client-specific findings; highlight trends. 3 Business Impact Assessment For each major category present likelihood × impact scenarios (max 150 words per category). 4 Strategic Recommendations Group into Immediate (0-30 d), Short-Term (30-90 d), Long-Term (>90 d). Include rough cost ranges and ROI deltas. STYLE CEO-friendly, forward-looking, quantify everything. Use real-world breach analogies sparingly (≤2). CONDITIONALS - Include a Historical Progress subsection only if {historical_data} exists. - Skip ADA or Legal subsections if no related findings.',
  4500,
  0.044
),
(
  'technical_remediation',
  'You are DealBrief-AI, a senior penetration tester. Return ONLY Markdown with: 1. YAML front-matter: company, domain, scan_date, findings_total, critical_ct, high_ct, medium_ct, low_ct 2. Body ≤4 500 words (≤12 pages). Code fences for all commands/configs. 3. Use call-out blocks (> Risk:) to emphasise danger points. Be concise; no filler text.',
  'INPUT: detailed_findings: {detailed_findings} scan_artifacts: {scan_artifacts} system_configurations: {system_configurations} threat_intelligence: {threat_intelligence} remediation_templates: {remediation_templates} TASK: Produce a Technical Analysis & Remediation Guide: 1 Methodology Snapshot (~½ page) Tools, coverage, validation steps, confidence levels. 2 Key Technical Findings (table) Columns: ID, Severity, Asset, CVE/OWASP, Proof of Concept link. 3 Detailed Vulnerability Analysis For each finding: - Description (plain English) - Risk Assessment (likelihood, impact, attacker effort) - Reproduction (commands, screenshots path) - Remediation (step-by-step; link templates) Include only critical, high, and medium findings. Summarise low severity in a single table. 4 Domain & Infrastructure Security TLS, DNS, email auth, cloud IAM. 5 Comprehensive Remediation Roadmap Split: Fix Immediately / 30-Day / 90-Day; list owner + effort hrs. 6 Compliance Mapping SOC 2, ISO 27001, PCI DSS—only controls impacted by findings. STYLE Precise, practitioner-level detail. Use code fences for bash and json. Link to standards (NIST, CIS) in footnotes format [NIST SP 800-53]. CONDITIONALS - Generate a Cloud Cost Amplification subsection only if cost > 0. - Omit ADA section if no accessibility violations.',
  6000,
  0.058
)
on conflict (report_type) do update set
  system_prompt = excluded.system_prompt,
  user_prompt_template = excluded.user_prompt_template,
  max_output_tokens = excluded.max_output_tokens,
  estimated_cost_usd = excluded.estimated_cost_usd,
  updated_at = now();
```

## 3. Create View
```sql
create or replace view report_scan_data as
select 
  ss.scan_id, ss.company_name, ss.domain,
  ss.created_at as scan_date, ss.status as scan_status,
  ss.total_findings_count, ss.max_severity,
  count(case when f.severity = 'CRITICAL' then 1 end) as critical_count,
  count(case when f.severity = 'HIGH' then 1 end) as high_count,
  count(case when f.severity = 'MEDIUM' then 1 end) as medium_count,
  count(case when f.severity = 'LOW' then 1 end) as low_count,
  count(case when f.severity = 'INFO' then 1 end) as info_count,
  coalesce(sum(f.eal_low), 0) as eal_low_total,
  coalesce(sum(f.eal_ml), 0) as eal_ml_total, 
  coalesce(sum(f.eal_high), 0) as eal_high_total,
  coalesce(sum(f.eal_daily), 0) as eal_daily_total,
  json_agg(
    json_build_object(
      'id', f.id, 'type', f.type, 'severity', f.severity,
      'description', f.description, 'recommendation', f.recommendation,
      'eal_low', f.eal_low, 'eal_ml', f.eal_ml, 'eal_high', f.eal_high, 'eal_daily', f.eal_daily
    ) order by 
      case f.severity 
        when 'CRITICAL' then 1 when 'HIGH' then 2 when 'MEDIUM' then 3
        when 'LOW' then 4 when 'INFO' then 5
      end, f.created_at
  ) as findings_data
from scan_status ss
left join findings f on f.scan_id = ss.scan_id
where ss.status = 'completed'
group by ss.scan_id, ss.company_name, ss.domain, ss.created_at, ss.status, ss.total_findings_count, ss.max_severity;
```

## 4. Create Trigger
```sql
create or replace function enqueue_threat_snapshot()
returns trigger 
language plpgsql 
security definer
as $$
begin
  if new.status = 'completed' and (old.status is null or old.status != 'completed') then
    insert into report_jobs (scan_id, report_type, auto_generated, requested_by)
    values (new.scan_id, 'threat_snapshot', true, 'system');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enqueue_threat_snapshot on scan_status;
create trigger trg_enqueue_threat_snapshot
  after update on scan_status
  for each row 
  execute function enqueue_threat_snapshot();
```

## 5. Deploy Edge Function
The Edge Function code is already in your repo at `supabase/functions/report-generator/index.ts`.

Deploy it with:
```bash
supabase functions deploy report-generator
```

## 6. Archive Existing Data
```sql
-- Move all findings to archive (882 records) - skip if already exists
INSERT INTO findings_archive (
  id, created_at, description, scan_id, type, recommendation, 
  severity, attack_type_code, state, eal_low, eal_ml, eal_high, eal_daily
)
SELECT 
  id, created_at, description, scan_id, type, recommendation, 
  severity, attack_type_code, state, eal_low, eal_ml, eal_high, eal_daily
FROM findings
WHERE scan_id NOT IN (SELECT scan_id FROM findings_archive WHERE scan_id IS NOT NULL)
ON CONFLICT (id) DO NOTHING;

-- Move all reports to archive - skip if already exists
INSERT INTO reports_archive 
SELECT * FROM reports
WHERE scan_id NOT IN (SELECT scan_id FROM reports_archive WHERE scan_id IS NOT NULL)
ON CONFLICT (id) DO NOTHING;

-- DON'T move scan_status to archive yet - keep them for foreign key references
-- Just delete the active tables, leave scan_status for archive references

-- Delete reports first (they reference scan_status)
DELETE FROM reports;

-- Delete legal_contingent_liabilities first (they reference findings)
DELETE FROM legal_contingent_liabilities;

-- Delete findings 
DELETE FROM findings;

-- KEEP scan_status - don't delete them because reports_archive still references them
-- The scan_status records will remain to satisfy foreign key constraints
```

## DONE
That's it. The Edge Function will automatically process report jobs when scans complete.