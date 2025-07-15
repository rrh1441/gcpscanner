# DealBrief Security Scanner - Module Reference

This document provides a comprehensive overview of all security scanning modules, their functionality, and execution tiers.

## Scan Tiers

### Tier 1 (Default) - Safe Automated Scanning
- **Purpose**: Non-intrusive intelligence gathering and discovery
- **Target**: Public information and passive reconnaissance
- **Authorization**: No special authorization required
- **Typical Duration**: 3-5 minutes

### Tier 2 - Deep Authorized Scanning  
- **Purpose**: Active probing and comprehensive vulnerability assessment
- **Target**: Detailed security analysis with active testing
- **Authorization**: Requires explicit authorization from target organization
- **Typical Duration**: 10-20 minutes

## Module Inventory

### 🔍 Intelligence Gathering Modules

#### **breach_directory_probe** (Tier 1)
- **Purpose**: Searches BreachDirectory and LeakCheck for compromised credentials
- **What it finds**: Exposed passwords, emails, data breaches
- **Dependencies**: None
- **Execution**: Immediate parallel start

#### **shodan** (Tier 1)
- **Purpose**: Discovers internet-exposed services using Shodan API
- **What it finds**: Open ports, service banners, exposed databases
- **Dependencies**: None  
- **Execution**: Immediate parallel start

#### **dns_twist** (Tier 1)
- **Purpose**: Finds typosquatted domains for phishing detection
- **What it finds**: Malicious lookalike domains, phishing setups
- **Dependencies**: None
- **Execution**: Immediate parallel start

#### **censys** (Tier 2 Only)
- **Purpose**: Certificate transparency and infrastructure discovery via Censys
- **What it finds**: SSL certificates, subdomains, IP ranges
- **Dependencies**: None
- **Execution**: Currently disabled in Tier 1

### 📄 Document & Exposure Modules

#### **document_exposure** (Tier 1)
- **Purpose**: Searches for accidentally exposed documents via Google dorking
- **What it finds**: PDFs, spreadsheets, configuration files
- **Dependencies**: None
- **Execution**: Immediate parallel start

#### **endpoint_discovery** (Tier 1)
- **Purpose**: Discovers web endpoints, APIs, and hidden paths
- **What it finds**: Admin panels, API endpoints, directory listings
- **Dependencies**: None
- **Execution**: Immediate parallel start

### 🔐 Security Analysis Modules

#### **tls_scan** (Tier 1)
- **Purpose**: Analyzes SSL/TLS configuration and certificate health
- **What it finds**: Weak ciphers, certificate issues, TLS misconfigurations
- **Dependencies**: None
- **Execution**: Immediate parallel start

#### **spf_dmarc** (Tier 1)
- **Purpose**: Evaluates email security configuration (SPF, DMARC, DKIM)
- **What it finds**: Email spoofing vulnerabilities, missing protections
- **Dependencies**: None
- **Execution**: Immediate parallel start

#### **nuclei** (Tier 1 & 2)
- **Purpose**: Vulnerability scanning with configurable intensity
- **What it finds**: CVEs, misconfigurations, exposed panels
- **Dependencies**: endpoint_discovery (for better targeting)
- **Execution**: Starts after endpoint discovery
- **Tier Differences**:
  - **Tier 1**: 20s timeout, baseline templates only
  - **Tier 2**: 180s timeout, full template suite + workflows

### 🔍 Technology & Supply Chain

#### **tech_stack_scan** (Tier 1)
- **Purpose**: Identifies technologies and analyzes supply chain risks
- **What it finds**: Software versions, CVE vulnerabilities, SBOM generation
- **Dependencies**: endpoint_discovery
- **Execution**: Starts after endpoint discovery

#### **abuse_intel_scan** (Tier 1)
- **Purpose**: Checks discovered IPs against AbuseIPDB threat intelligence
- **What it finds**: Malicious IPs, botnet indicators, threat scores
- **Dependencies**: Requires IP artifacts from other modules
- **Execution**: Starts after endpoint discovery

### 🕵️ Secret & Code Analysis

#### **trufflehog** (Tier 1)
- **Purpose**: Scans for exposed secrets, API keys, and credentials
- **What it finds**: Hardcoded passwords, API tokens, private keys
- **Dependencies**: None (scans high-value paths)
- **Execution**: Immediate parallel start

### ♿ Compliance & Accessibility

#### **accessibility_scan** (Tier 1)
- **Purpose**: Tests WCAG 2.1 AA compliance for ADA lawsuit risk
- **What it finds**: Accessibility violations, compliance gaps
- **Dependencies**: None (tests standard page patterns)
- **Execution**: Immediate parallel start

### 🚨 Advanced Security Modules (Tier 2 Only)

#### **zap_scan** (Tier 2 Only)
- **Purpose**: OWASP ZAP active web application security testing
- **What it finds**: XSS, SQL injection, authentication bypasses
- **Dependencies**: endpoint_discovery
- **Execution**: Only runs in Tier 2 scans

#### **rate_limit_scan** (Tier 2 Only)
- **Purpose**: Tests API rate limiting and abuse protection
- **What it finds**: Rate limit bypasses, DoS vulnerabilities
- **Dependencies**: endpoint_discovery
- **Execution**: Only runs in Tier 2 scans

#### **db_port_scan** (Tier 2 Only)
- **Purpose**: Scans for exposed database services and misconfigurations  
- **What it finds**: Open databases, weak authentication
- **Dependencies**: None
- **Execution**: Only runs in Tier 2 scans

#### **denial_wallet_scan** (Tier 2 Only)
- **Purpose**: Identifies cost amplification vulnerabilities in cloud services
- **What it finds**: Expensive API abuse, cloud cost bombs
- **Dependencies**: endpoint_discovery
- **Execution**: Only runs in Tier 2 scans

#### **rdp_vpn_templates** (Tier 2 Only)
- **Purpose**: Tests for exposed RDP/VPN services and weak configurations
- **What it finds**: Weak RDP passwords, VPN misconfigurations
- **Dependencies**: None
- **Execution**: Only runs in Tier 2 scans

#### **email_bruteforce_surface** (Tier 2 Only)
- **Purpose**: Analyzes email infrastructure for brute force vulnerabilities
- **What it finds**: Weak email authentication, enumeration risks
- **Dependencies**: None
- **Execution**: Only runs in Tier 2 scans

## Execution Flow

### Tier 1 Execution (Default)
```
IMMEDIATE PARALLEL START (9 modules):
├── breach_directory_probe
├── shodan  
├── dns_twist
├── document_exposure
├── endpoint_discovery
├── tls_scan
├── spf_dmarc
├── trufflehog
└── accessibility_scan

AFTER ENDPOINT DISCOVERY (3 modules):
├── nuclei (baseline mode)
├── tech_stack_scan
└── abuse_intel_scan
```

### Tier 2 Execution (Authorized)
```
All Tier 1 modules PLUS:
├── censys (re-enabled)
├── zap_scan (active web testing)
├── nuclei (full mode with workflows)
├── rate_limit_scan
├── db_port_scan  
├── denial_wallet_scan
├── rdp_vpn_templates
└── email_bruteforce_surface
```

## How to Run Tier 2 Scans

Currently, Tier 2 scanning is **not implemented** in the worker logic. To enable Tier 2 scans, you would need to:

### Option 1: Environment Variable (Recommended)
```bash
# Set environment variable on Fly machine
fly secrets set SCAN_TIER=TIER_2

# Or for specific authorized domains
fly secrets set AUTHORIZED_DOMAINS="client1.com,client2.com,client3.com"
```

### Option 2: API Parameter (Future Enhancement)
```json
POST /api/scans
{
  "companyName": "Example Corp",
  "domain": "example.com", 
  "tier": "TIER_2",
  "authorization": "client_approved_deep_scan"
}
```

### Option 3: Manual Module Enabling
Uncomment Tier 2 modules in `worker.ts`:
```typescript
const TIER_1_MODULES = [
  // ... existing modules
  'censys',           // Uncomment for Tier 2
  'zap_scan',         // Uncomment for Tier 2  
  'rate_limit_scan',  // Uncomment for Tier 2
  // ... etc
];
```

## Performance Characteristics

| Module | Avg Duration | Resource Usage | API Costs |
|--------|-------------|----------------|-----------|
| breach_directory_probe | 2-5s | Low | ~$0.01 |
| shodan | 2-5s | Low | ~$0.005 |
| dns_twist | 30-60s | Medium | Free |
| document_exposure | 15-30s | Medium | ~$0.03 |
| endpoint_discovery | 30-45s | Medium | Free |
| tls_scan | 20-30s | Low | Free |
| spf_dmarc | 1-3s | Low | Free |
| trufflehog | 10-20s | Medium | Free |
| accessibility_scan | 60-90s | High (Browser) | Free |
| nuclei (Tier 1) | 20-40s | Medium | Free |
| nuclei (Tier 2) | 120-300s | High | Free |
| tech_stack_scan | 8-15s | Low | Free |
| abuse_intel_scan | 1-5s | Low | Free |
| zap_scan | 300-600s | Very High | Free |

## Module Status

✅ **Active in Tier 1**: 12 modules  
🔄 **Tier 2 Available**: 8 additional modules  
❌ **Disabled**: censys (removed per user request)  
🚫 **Removed**: spiderfoot (90% redundant)

---

*Last updated: 2025-07-02*  
*Total scan time: ~3 minutes (Tier 1), ~15 minutes (Tier 2)*