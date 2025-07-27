/**
 * Enhanced Expected Annual Loss (EAL) Calculator
 * Deterministic cost attribution for security findings
 */

export interface CostFactors {
  baseCost: number;          // Base annual loss estimate
  severityMultiplier: number; // Multiplier based on severity
  industryMultiplier: number; // Industry-specific risk factor
  exposureMultiplier: number; // Public vs internal exposure
  confidenceLevel: number;   // Confidence in the estimate (0.1-1.0)
}

export interface EALResult {
  eal_low: number;      // Conservative estimate (10th percentile)
  eal_ml: number;       // Most likely estimate (50th percentile) 
  eal_high: number;     // Worst case estimate (90th percentile)
  eal_daily: number;    // Daily operational loss
  confidence: number;   // Confidence level in estimate
  methodology: string;  // Calculation approach used
}

// Industry risk multipliers based on regulatory environment and attack surface
const INDUSTRY_MULTIPLIERS = {
  'healthcare': 2.1,      // HIPAA compliance, patient data
  'financial': 2.5,       // PCI DSS, SOX compliance
  'government': 1.8,      // Security clearance, public trust
  'education': 1.4,       // FERPA, limited budgets
  'retail': 1.7,          // PCI DSS, customer data
  'technology': 1.9,      // High-value IP, frequent targets
  'manufacturing': 1.3,   // Industrial systems, supply chain
  'energy': 2.0,          // Critical infrastructure
  'default': 1.5          // Generic business
};

// Base cost estimates by finding type (annual impact in USD)
const FINDING_COST_MAP = {
  // Critical Infrastructure Vulnerabilities
  'sql_injection': { base: 125000, confidence: 0.85 },
  'remote_code_execution': { base: 200000, confidence: 0.90 },
  'authentication_bypass': { base: 150000, confidence: 0.80 },
  'privilege_escalation': { base: 100000, confidence: 0.75 },
  
  // Data Exposure Risks
  'exposed_database': { base: 180000, confidence: 0.85 },
  'exposed_api_key': { base: 75000, confidence: 0.70 },
  'exposed_credentials': { base: 90000, confidence: 0.75 },
  'directory_listing': { base: 25000, confidence: 0.60 },
  'exposed_backup': { base: 120000, confidence: 0.80 },
  
  // Web Application Vulnerabilities  
  'xss_vulnerability': { base: 45000, confidence: 0.65 },
  'csrf_vulnerability': { base: 35000, confidence: 0.60 },
  'path_traversal': { base: 60000, confidence: 0.70 },
  'file_inclusion': { base: 80000, confidence: 0.75 },
  
  // Infrastructure Weaknesses
  'weak_ssl_config': { base: 15000, confidence: 0.50 },
  'open_port': { base: 20000, confidence: 0.45 },
  'outdated_software': { base: 40000, confidence: 0.55 },
  'default_credentials': { base: 85000, confidence: 0.80 },
  
  // Email & Communication Security
  'spf_record_missing': { base: 50000, confidence: 0.60 },
  'dmarc_policy_weak': { base: 65000, confidence: 0.65 },
  'email_spoofing_risk': { base: 95000, confidence: 0.75 },
  
  // Compliance & Accessibility
  'accessibility_violation': { base: 30000, confidence: 0.70 },
  'gdpr_compliance_issue': { base: 85000, confidence: 0.80 },
  'pci_compliance_gap': { base: 120000, confidence: 0.85 },
  
  // Operational Security
  'subdomain_takeover': { base: 110000, confidence: 0.80 },
  'dns_poisoning_risk': { base: 75000, confidence: 0.70 },
  'rate_limit_bypass': { base: 25000, confidence: 0.55 },
  
  // Default for unknown finding types
  'default': { base: 35000, confidence: 0.50 }
};

// Severity multipliers for impact scaling
const SEVERITY_MULTIPLIERS = {
  'CRITICAL': 2.5,
  'HIGH': 1.8,
  'MEDIUM': 1.0,
  'LOW': 0.4,
  'INFO': 0.1
};

// Exposure multipliers based on public accessibility
const EXPOSURE_MULTIPLIERS = {
  'public': 1.5,        // Publicly accessible
  'authenticated': 1.2,  // Requires authentication
  'internal': 0.8,      // Internal network only
  'unknown': 1.0        // Exposure level unknown
};

/**
 * Calculate industry multiplier based on domain
 */
function getIndustryMultiplier(domain: string): number {
  // Simple heuristic based on domain patterns
  if (domain.includes('health') || domain.includes('medical')) return INDUSTRY_MULTIPLIERS.healthcare;
  if (domain.includes('bank') || domain.includes('finance')) return INDUSTRY_MULTIPLIERS.financial;
  if (domain.includes('.gov') || domain.includes('government')) return INDUSTRY_MULTIPLIERS.government;
  if (domain.includes('.edu') || domain.includes('university')) return INDUSTRY_MULTIPLIERS.education;
  if (domain.includes('shop') || domain.includes('store')) return INDUSTRY_MULTIPLIERS.retail;
  if (domain.includes('tech') || domain.includes('software')) return INDUSTRY_MULTIPLIERS.technology;
  
  return INDUSTRY_MULTIPLIERS.default;
}

/**
 * Determine exposure level from finding context
 */
function getExposureLevel(srcUrl?: string, metadata?: any): keyof typeof EXPOSURE_MULTIPLIERS {
  if (metadata?.requires_auth === false) return 'public';
  if (metadata?.authenticated_endpoint === true) return 'authenticated';
  if (srcUrl?.includes('internal') || srcUrl?.includes('localhost')) return 'internal';
  
  return 'unknown';
}

/**
 * Calculate Expected Annual Loss with confidence intervals
 */
export function calculateEAL(params: {
  findingType: string;
  severity: string;
  domain: string;
  srcUrl?: string;
  metadata?: any;
}): EALResult {
  const { findingType, severity, domain, srcUrl, metadata } = params;
  
  // Get base cost data
  const costData = FINDING_COST_MAP[findingType] || FINDING_COST_MAP.default;
  const baseCost = costData.base;
  const baseConfidence = costData.confidence;
  
  // Calculate multipliers
  const severityMultiplier = SEVERITY_MULTIPLIERS[severity] || SEVERITY_MULTIPLIERS.MEDIUM;
  const industryMultiplier = getIndustryMultiplier(domain);
  const exposureLevel = getExposureLevel(srcUrl, metadata);
  const exposureMultiplier = EXPOSURE_MULTIPLIERS[exposureLevel];
  
  // Calculate most likely (median) estimate
  const ealMostLikely = Math.round(
    baseCost * severityMultiplier * industryMultiplier * exposureMultiplier
  );
  
  // Calculate confidence intervals using log-normal distribution
  const variabilityFactor = Math.max(0.3, 1.0 - baseConfidence); // Higher variability for lower confidence
  
  const ealLow = Math.round(ealMostLikely * (1 - variabilityFactor));
  const ealHigh = Math.round(ealMostLikely * (1 + variabilityFactor * 2));
  
  // Daily operational loss (for DoW attacks)
  const ealDaily = Math.round(ealMostLikely / 365);
  
  // Composite confidence score
  const compositeConfidence = Math.min(1.0, 
    baseConfidence * 
    (severity === 'CRITICAL' || severity === 'HIGH' ? 1.1 : 0.9) *
    (exposureLevel === 'public' ? 1.1 : 0.95)
  );
  
  return {
    eal_low: Math.max(1000, ealLow),      // Minimum $1K impact
    eal_ml: Math.max(2000, ealMostLikely), // Minimum $2K impact  
    eal_high: Math.max(5000, ealHigh),    // Minimum $5K impact
    eal_daily: Math.max(10, ealDaily),    // Minimum $10/day
    confidence: Math.round(compositeConfidence * 100) / 100,
    methodology: `base:${baseCost} × sev:${severityMultiplier} × ind:${industryMultiplier} × exp:${exposureMultiplier}`
  };
}

/**
 * Aggregate EAL values across multiple findings
 */
export function aggregateEAL(ealResults: EALResult[]): {
  total_low: number;
  total_ml: number;
  total_high: number;
  total_daily: number;
  weighted_confidence: number;
  finding_count: number;
} {
  if (ealResults.length === 0) {
    return {
      total_low: 0,
      total_ml: 0, 
      total_high: 0,
      total_daily: 0,
      weighted_confidence: 0,
      finding_count: 0
    };
  }
  
  const totals = ealResults.reduce((acc, eal) => ({
    total_low: acc.total_low + eal.eal_low,
    total_ml: acc.total_ml + eal.eal_ml,
    total_high: acc.total_high + eal.eal_high,
    total_daily: acc.total_daily + eal.eal_daily,
    confidence_sum: acc.confidence_sum + (eal.confidence * eal.eal_ml), // Weight by impact
    ml_sum: acc.ml_sum + eal.eal_ml
  }), {
    total_low: 0,
    total_ml: 0,
    total_high: 0,
    total_daily: 0,
    confidence_sum: 0,
    ml_sum: 0
  });
  
  return {
    ...totals,
    weighted_confidence: totals.ml_sum > 0 ? 
      Math.round((totals.confidence_sum / totals.ml_sum) * 100) / 100 : 0,
    finding_count: ealResults.length
  };
}

/**
 * Map finding types to attack categories for reporting
 */
export function mapToAttackCategory(findingType: string): string {
  const categoryMap = {
    // Site Hack category
    'sql_injection': 'SITE_HACK',
    'xss_vulnerability': 'SITE_HACK',
    'remote_code_execution': 'SITE_HACK',
    'authentication_bypass': 'SITE_HACK',
    'privilege_escalation': 'SITE_HACK',
    'path_traversal': 'SITE_HACK',
    'file_inclusion': 'SITE_HACK',
    'csrf_vulnerability': 'SITE_HACK',
    'exposed_database': 'SITE_HACK',
    'exposed_api_key': 'SITE_HACK',
    'exposed_credentials': 'SITE_HACK',
    'exposed_backup': 'SITE_HACK',
    'subdomain_takeover': 'SITE_HACK',
    'default_credentials': 'SITE_HACK',
    
    // Phishing/BEC category  
    'email_spoofing_risk': 'PHISHING_BEC',
    'spf_record_missing': 'PHISHING_BEC',
    'dmarc_policy_weak': 'PHISHING_BEC',
    'dns_poisoning_risk': 'PHISHING_BEC',
    
    // Malware category
    'malware_detected': 'MALWARE',
    'trojan_detected': 'MALWARE',
    'virus_signature': 'MALWARE',
    
    // ADA Compliance
    'accessibility_violation': 'ADA_COMPLIANCE',
    'wcag_violation': 'ADA_COMPLIANCE',
    
    // Denial of Wallet (DoW)
    'ddos_vulnerability': 'DENIAL_OF_WALLET',
    'rate_limit_bypass': 'DENIAL_OF_WALLET',
    'resource_exhaustion': 'DENIAL_OF_WALLET'
  };
  
  return categoryMap[findingType] || 'SITE_HACK';
}

export default {
  calculateEAL,
  aggregateEAL,
  mapToAttackCategory,
  FINDING_COST_MAP,
  INDUSTRY_MULTIPLIERS
};