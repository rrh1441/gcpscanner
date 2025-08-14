import { runEndpointDiscovery } from '../modules/endpointDiscovery.js';
import { runTlsScan } from '../modules/tlsScan.js';
import { runSpfDmarc } from '../modules/spfDmarc.js';
import { runConfigExposureScanner } from '../modules/configExposureScanner.js';
import { runBreachDirectoryProbe } from '../modules/breachDirectoryProbe.js';
import { runShodanScan } from '../modules/shodan.js';
import { runDocumentExposure } from '../modules/documentExposure.js';

export interface ScanJob {
  scan_id: string;
  domain: string;
  companyName?: string;
}

export interface ScanResult {
  scan_id: string;
  domain: string;
  results: Record<string, unknown>;
}

export async function executeScan(job: ScanJob): Promise<ScanResult> {
  const { domain, scan_id } = job;
  const companyName = job.companyName || domain.split('.')[0] || 'Unknown';

  // Run all scans in parallel with proper error handling
  const scanPromises = [
    runBreachDirectoryProbe({ domain, scanId: scan_id }).catch(err => ({ error: err.message, module: 'breach' })),
    runShodanScan({ domain, scanId: scan_id }).catch(err => ({ error: err.message, module: 'shodan' })),
    runDocumentExposure({ companyName: companyName, domain, scanId: scan_id }).catch(err => ({ error: err.message, module: 'document' })),
    runEndpointDiscovery({ domain, scanId: scan_id }).catch(err => ({ error: err.message, module: 'endpoint' })),
    runTlsScan({ domain, scanId: scan_id }).catch(err => ({ error: err.message, module: 'tls' })),
    runSpfDmarc({ domain, scanId: scan_id }).catch(err => ({ error: err.message, module: 'spf' })),
    runConfigExposureScanner({ domain, scanId: scan_id }).catch(err => ({ error: err.message, module: 'config' })),
  ];

  const [breach, shodan, doc, endp, tls, spf, cfg] = await Promise.all(scanPromises);

  return {
    scan_id,
    domain,
    results: {
      breach_directory_probe: breach,
      shodan: shodan,
      document_exposure: doc,
      endpoint_discovery: endp,
      tls_scan: tls,
      spf_dmarc: spf,
      config_exposure: cfg,
    },
  };
}