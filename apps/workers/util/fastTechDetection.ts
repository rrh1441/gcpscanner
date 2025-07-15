/**
 * Fast Technology Detection Utility
 * 
 * Uses WebTech Python tool and HTTP headers for lightning-fast tech detection
 * instead of heavy Nuclei scanning, saving 35+ seconds per scan.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import axios from 'axios';
import { log as rootLog } from '../core/logger.js';

const exec = promisify(execFile);
const log = (...args: unknown[]) => rootLog('[fastTechDetection]', ...args);

export interface FastTechResult {
  name: string;
  slug: string;
  version?: string;
  categories: string[];
  confidence: number;
  icon?: string;
  website?: string;
  cpe?: string;
  description?: string;
}

export interface TechDetectionResult {
  technologies: FastTechResult[];
  duration: number;
  url: string;
  error?: string;
}

/**
 * Detect technologies using WebTech Python tool (much faster than Wappalyzer API)
 */
export async function detectTechnologiesWithWebTech(url: string): Promise<TechDetectionResult> {
  const startTime = Date.now();
  
  try {
    log(`Starting WebTech detection for ${url}`);
    
    // Use webtech with JSON output
    const { stdout } = await exec('python3', ['-m', 'webtech', '-u', url, '--json'], {
      timeout: 5000 // 5 second timeout for speed
    });
    
    const result = JSON.parse(stdout);
    const technologies: FastTechResult[] = [];
    
    if (result.applications) {
      for (const app of result.applications) {
        technologies.push({
          name: app.name,
          slug: app.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          version: app.version || undefined,
          categories: app.categories || ['Unknown'],
          confidence: app.confidence || 100,
          website: app.website,
          description: app.description
        });
      }
    }

    const duration = Date.now() - startTime;
    log(`WebTech detection completed for ${url}: ${technologies.length} techs in ${duration}ms`);

    return {
      technologies,
      duration,
      url,
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = (error as Error).message;
    log(`WebTech detection failed for ${url}: ${errorMsg} (${duration}ms)`);

    // Fallback to header detection if WebTech fails
    const headerTechs = await detectFromHeaders(url);
    
    return {
      technologies: headerTechs,
      duration,
      url,
      error: errorMsg,
    };
  }
}

/**
 * Fast tech detection using WhatWeb (GPL tool with 2000+ plugins)
 */
export async function detectTechnologiesWithWhatWeb(url: string): Promise<TechDetectionResult> {
  const startTime = Date.now();
  
  try {
    log(`Starting WhatWeb detection for ${url}`);
    
    // Use whatweb with JSON output and aggressive level 3 scanning
    const { stdout } = await exec('whatweb', ['--log-json=-', '-a', '3', url], {
      timeout: 3000 // 3 second timeout for speed
    });
    
    const lines = stdout.trim().split('\n');
    const technologies: FastTechResult[] = [];
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      try {
        const result = JSON.parse(line);
        
        if (result.plugins) {
          for (const [pluginName, pluginData] of Object.entries(result.plugins)) {
            const data = pluginData as any;
            
            technologies.push({
              name: pluginName,
              slug: pluginName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
              version: data.version?.[0] || data.string?.[0] || undefined,
              categories: data.category ? [data.category] : ['Unknown'],
              confidence: 90, // WhatWeb is quite accurate
              description: data.string?.[0]
            });
          }
        }
      } catch (parseError) {
        // Skip malformed JSON lines
        continue;
      }
    }

    const duration = Date.now() - startTime;
    log(`WhatWeb detection completed for ${url}: ${technologies.length} techs in ${duration}ms`);

    return {
      technologies,
      duration,
      url,
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = (error as Error).message;
    log(`WhatWeb detection failed for ${url}: ${errorMsg} (${duration}ms)`);

    return {
      technologies: [],
      duration,
      url,
      error: errorMsg,
    };
  }
}

/**
 * Lightning-fast HTTP header-based tech detection (< 100ms)
 */
export async function detectFromHeaders(url: string): Promise<FastTechResult[]> {
  try {
    log(`Checking headers for quick tech detection: ${url}`);
    const response = await axios.head(url, { 
      timeout: 3000,
      validateStatus: () => true, // Accept any status code
      headers: {
        'User-Agent': 'DealBrief-Scanner/1.0 (+https://dealbrief.com)'
      }
    });

    const technologies: FastTechResult[] = [];
    const headers = response.headers;

    // Server header analysis
    if (headers.server) {
      const server = headers.server.toLowerCase();
      if (server.includes('apache')) {
        technologies.push({
          name: 'Apache HTTP Server',
          slug: 'apache',
          version: extractVersion(headers.server, /apache\/([0-9.]+)/i),
          categories: ['Web servers'],
          confidence: 100,
        });
      }
      if (server.includes('nginx')) {
        technologies.push({
          name: 'Nginx',
          slug: 'nginx',
          version: extractVersion(headers.server, /nginx\/([0-9.]+)/i),
          categories: ['Web servers'],
          confidence: 100,
        });
      }
      if (server.includes('iis')) {
        technologies.push({
          name: 'Microsoft IIS',
          slug: 'iis',
          version: extractVersion(headers.server, /iis\/([0-9.]+)/i),
          categories: ['Web servers'],
          confidence: 100,
        });
      }
      if (server.includes('cloudflare')) {
        technologies.push({
          name: 'Cloudflare',
          slug: 'cloudflare',
          categories: ['CDN'],
          confidence: 100,
        });
      }
    }

    // X-Powered-By header analysis
    if (headers['x-powered-by']) {
      const poweredBy = headers['x-powered-by'].toLowerCase();
      if (poweredBy.includes('php')) {
        technologies.push({
          name: 'PHP',
          slug: 'php',
          version: extractVersion(headers['x-powered-by'], /php\/([0-9.]+)/i),
          categories: ['Programming languages'],
          confidence: 100,
        });
      }
      if (poweredBy.includes('asp.net')) {
        technologies.push({
          name: 'ASP.NET',
          slug: 'aspnet',
          version: extractVersion(headers['x-powered-by'], /asp\.net\/([0-9.]+)/i),
          categories: ['Web frameworks'],
          confidence: 100,
        });
      }
      if (poweredBy.includes('express')) {
        technologies.push({
          name: 'Express',
          slug: 'express',
          version: extractVersion(headers['x-powered-by'], /express\/([0-9.]+)/i),
          categories: ['Web frameworks'],
          confidence: 100,
        });
      }
    }

    // Additional header checks with expanded patterns
    if (headers['x-generator']) {
      technologies.push({
        name: headers['x-generator'],
        slug: headers['x-generator'].toLowerCase().replace(/[^a-z0-9]/g, '-'),
        categories: ['CMS'],
        confidence: 90,
      });
    }

    if (headers['cf-ray']) {
      technologies.push({
        name: 'Cloudflare',
        slug: 'cloudflare',
        categories: ['CDN'],
        confidence: 100,
      });
    }

    // Framework and technology specific headers
    if (headers['x-aspnet-version']) {
      technologies.push({
        name: 'ASP.NET',
        slug: 'aspnet',
        version: headers['x-aspnet-version'],
        categories: ['Web frameworks'],
        confidence: 100,
      });
    }

    if (headers['x-drupal-cache']) {
      technologies.push({
        name: 'Drupal',
        slug: 'drupal',
        categories: ['CMS'],
        confidence: 95,
      });
    }

    if (headers['x-pingback']) {
      technologies.push({
        name: 'WordPress',
        slug: 'wordpress',
        categories: ['CMS'],
        confidence: 80,
      });
    }

    if (headers['x-shopify-stage']) {
      technologies.push({
        name: 'Shopify',
        slug: 'shopify',
        categories: ['E-commerce'],
        confidence: 100,
      });
    }

    if (headers['x-magento-tags']) {
      technologies.push({
        name: 'Magento',
        slug: 'magento',
        categories: ['E-commerce'],
        confidence: 95,
      });
    }

    // CDN and hosting detection
    if (headers['x-served-by'] && headers['x-served-by'].includes('fastly')) {
      technologies.push({
        name: 'Fastly',
        slug: 'fastly',
        categories: ['CDN'],
        confidence: 100,
      });
    }

    if (headers['x-amz-cf-id']) {
      technologies.push({
        name: 'Amazon CloudFront',
        slug: 'cloudfront',
        categories: ['CDN'],
        confidence: 100,
      });
    }

    if (headers['x-vercel-cache']) {
      technologies.push({
        name: 'Vercel',
        slug: 'vercel',
        categories: ['Hosting'],
        confidence: 100,
      });
    }

    if (headers['x-netlify-id']) {
      technologies.push({
        name: 'Netlify',
        slug: 'netlify',
        categories: ['Hosting'],
        confidence: 100,
      });
    }

    // Security and monitoring headers
    if (headers['x-content-type-options']) {
      technologies.push({
        name: 'Security Headers',
        slug: 'security-headers',
        categories: ['Security'],
        confidence: 70,
      });
    }

    if (headers['strict-transport-security']) {
      technologies.push({
        name: 'HSTS',
        slug: 'hsts',
        categories: ['Security'],
        confidence: 100,
      });
    }

    if (headers['content-security-policy']) {
      technologies.push({
        name: 'Content Security Policy',
        slug: 'csp',
        categories: ['Security'],
        confidence: 100,
      });
    }

    // Load balancer detection
    if (headers['x-lb-name'] || headers['x-forwarded-for']) {
      technologies.push({
        name: 'Load Balancer',
        slug: 'load-balancer',
        categories: ['Infrastructure'],
        confidence: 80,
      });
    }

    // Application server detection
    if (headers['x-runtime']) {
      const runtime = headers['x-runtime'];
      if (runtime.includes('node')) {
        technologies.push({
          name: 'Node.js',
          slug: 'nodejs',
          categories: ['Programming languages'],
          confidence: 90,
        });
      }
    }

    log(`Header detection found ${technologies.length} technologies for ${url}`);
    return technologies;

  } catch (error) {
    log(`Header detection failed for ${url}: ${(error as Error).message}`);
    return [];
  }
}

/**
 * Main fast tech detection - tries headers first, then WebTech if needed
 */
export async function detectTechnologiesFast(url: string): Promise<TechDetectionResult> {
  // Try header detection first (fastest)
  try {
    const headerTechs = await detectFromHeaders(url);
    if (headerTechs.length > 0) {
      log(`Header detection found ${headerTechs.length} techs, skipping WebTech for ${url}`);
      return {
        url,
        technologies: headerTechs,
        duration: 0 // Instant header detection
      };
    }
  } catch (error) {
    log(`Header detection failed for ${url}: ${(error as Error).message}`);
  }

  // Try WebTech if headers didn't find anything
  try {
    const webTechResult = await detectTechnologiesWithWebTech(url);
    if (webTechResult.technologies.length > 0) {
      return webTechResult;
    }
  } catch (error) {
    log(`WebTech failed for ${url}, trying WhatWeb: ${(error as Error).message}`);
  }

  // Fall back to WhatWeb
  try {
    const whatWebResult = await detectTechnologiesWithWhatWeb(url);
    if (whatWebResult.technologies.length > 0) {
      return whatWebResult;
    }
  } catch (error) {
    log(`WhatWeb failed for ${url}, using header detection: ${(error as Error).message}`);
  }

  // Final fallback to header detection
  const startTime = Date.now();
  const headerTechs = await detectFromHeaders(url);
  
  return {
    technologies: headerTechs,
    duration: Date.now() - startTime,
    url,
  };
}

/**
 * Batch process multiple URLs with fast tech detection
 */
export async function detectMultipleUrlsFast(urls: string[]): Promise<TechDetectionResult[]> {
  log(`Starting batch fast tech detection for ${urls.length} URLs`);
  const startTime = Date.now();

  // Process in parallel but limit concurrency to avoid overwhelming tools
  const results = await Promise.allSettled(
    urls.slice(0, 5).map(url => detectTechnologiesFast(url)) // Limit to 5 URLs for speed
  );

  const techResults = results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        technologies: [],
        duration: 0,
        url: urls[index],
        error: result.reason?.message || 'Unknown error',
      };
    }
  });

  const totalDuration = Date.now() - startTime;
  const totalTechs = techResults.reduce((sum, result) => sum + result.technologies.length, 0);
  
  log(`Batch fast tech detection completed: ${totalTechs} techs across ${urls.length} URLs in ${totalDuration}ms`);

  return techResults;
}

function extractVersion(text: string, regex: RegExp): string | undefined {
  const match = text.match(regex);
  return match ? match[1] : undefined;
}