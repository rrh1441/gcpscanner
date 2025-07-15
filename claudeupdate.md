# Frontend Update Instructions for Scan Management & Report Generation

## Overview
This document provides detailed instructions to update the frontend with enhanced scan management functionality, including individual and bulk scan triggering, findings review, and automated report generation with professional HTML designs based on the snapshot.md template.

## Required Updates

### 1. Enhanced Scan Triggering Interface

#### Update `/src/app/(dashboard)/scans/new/page.tsx`

**Current State**: Basic single/bulk scan creation
**Required Enhancement**: Add auto-report generation options

```typescript
// Add to the form schema
const formSchema = z.object({
  // ... existing fields
  autoGenerateReports: z.boolean().default(true),
  reportTypes: z.array(z.enum(['threat_snapshot', 'executive_summary', 'technical_remediation'])).default(['threat_snapshot', 'executive_summary', 'technical_remediation'])
})

// Add to the form component
<div className="space-y-4">
  <div className="flex items-center space-x-2">
    <Checkbox 
      id="autoGenerateReports" 
      checked={form.watch('autoGenerateReports')}
      onCheckedChange={(checked) => form.setValue('autoGenerateReports', checked)}
    />
    <label htmlFor="autoGenerateReports" className="text-sm font-medium">
      Auto-generate all three reports upon scan completion
    </label>
  </div>
  
  {form.watch('autoGenerateReports') && (
    <div className="ml-6 space-y-2">
      <p className="text-sm text-gray-600">Reports to generate:</p>
      <div className="space-y-2">
        {[
          { id: 'threat_snapshot', label: 'Threat Snapshot (Executive Dashboard)' },
          { id: 'executive_summary', label: 'Executive Summary (Strategic Overview)' },
          { id: 'technical_remediation', label: 'Technical Remediation Guide' }
        ].map((report) => (
          <div key={report.id} className="flex items-center space-x-2">
            <Checkbox 
              id={report.id}
              checked={form.watch('reportTypes').includes(report.id)}
              onCheckedChange={(checked) => {
                const current = form.watch('reportTypes')
                if (checked) {
                  form.setValue('reportTypes', [...current, report.id])
                } else {
                  form.setValue('reportTypes', current.filter(t => t !== report.id))
                }
              }}
            />
            <label htmlFor={report.id} className="text-sm">{report.label}</label>
          </div>
        ))}
      </div>
    </div>
  )}
</div>
```

### 2. Enhanced Scan List with Report Management

#### Update `/src/app/(dashboard)/scans/page.tsx`

**Add Report Status Column**:
```typescript
// Add to the columns definition
{
  accessorKey: "reports",
  header: "Reports",
  cell: ({ row }) => {
    const scan = row.original
    const reportCount = scan.reports?.length || 0
    const pendingReports = scan.reports?.filter(r => r.status === 'pending').length || 0
    
    return (
      <div className="flex items-center gap-2">
        <Badge variant={reportCount > 0 ? "default" : "secondary"}>
          {reportCount} Generated
        </Badge>
        {pendingReports > 0 && (
          <Badge variant="outline">
            {pendingReports} Pending
          </Badge>
        )}
      </div>
    )
  }
}

// Add actions column with report link
{
  id: "actions",
  cell: ({ row }) => {
    const scan = row.original
    const hasReports = scan.reports && scan.reports.length > 0
    
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <Link href={`/scans/${scan.scan_id}`}>View Details</Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link href={`/scans/${scan.scan_id}/findings`}>View Findings</Link>
          </DropdownMenuItem>
          {hasReports && (
            <DropdownMenuItem>
              <Link href={`/scans/${scan.scan_id}/reports`}>View Reports</Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => triggerReportGeneration(scan.scan_id)}
            disabled={scan.status !== 'completed'}
          >
            Generate Reports
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }
}
```

### 3. New Scan Reports Page

#### Create `/src/app/(dashboard)/scans/[scanId]/reports/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Download, Eye, RefreshCw } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

const REPORT_TYPE_CONFIG = {
  threat_snapshot: {
    title: 'Threat Snapshot',
    description: 'Executive dashboard focused on financial impact',
    icon: FileText,
    maxWords: 650
  },
  executive_summary: {
    title: 'Executive Summary', 
    description: 'Strategic overview for leadership',
    icon: FileText,
    maxWords: 2500
  },
  technical_remediation: {
    title: 'Technical Remediation',
    description: 'Detailed technical implementation guide',
    icon: FileText,
    maxWords: 4500
  }
}

export default function ScanReportsPage() {
  const params = useParams()
  const scanId = params.scanId as string
  const [reports, setReports] = useState([])
  const [scanData, setScanData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState(null)

  useEffect(() => {
    loadScanAndReports()
  }, [scanId])

  const loadScanAndReports = async () => {
    try {
      const [scanResponse, reportsResponse] = await Promise.all([
        fetch(`/api/scans/${scanId}`),
        fetch(`/api/reports?scanId=${scanId}`)
      ])
      
      const scan = await scanResponse.json()
      const reportsData = await reportsResponse.json()
      
      setScanData(scan)
      setReports(reportsData)
    } catch (error) {
      console.error('Failed to load scan reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateAllReports = async () => {
    const reportTypes = ['threat_snapshot', 'executive_summary', 'technical_remediation']
    
    for (const reportType of reportTypes) {
      try {
        await fetch('/api/reports/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scanId, reportType })
        })
      } catch (error) {
        console.error(`Failed to generate ${reportType}:`, error)
      }
    }
    
    loadScanAndReports() // Refresh the data
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{scanData?.company_name} Reports</h1>
          <p className="text-gray-600">{scanData?.domain} • Scan ID: {scanId}</p>
        </div>
        <Button onClick={generateAllReports} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Generate All Reports
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(REPORT_TYPE_CONFIG).map(([reportType, config]) => {
          const report = reports.find(r => r.report_type === reportType)
          const IconComponent = config.icon
          
          return (
            <Card key={reportType} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <IconComponent className="h-6 w-6 text-blue-600" />
                  <div>
                    <CardTitle className="text-lg">{config.title}</CardTitle>
                    <CardDescription>{config.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-gray-600">
                    Target length: ≤{config.maxWords.toLocaleString()} words
                  </div>
                  
                  {report ? (
                    <div className="space-y-3">
                      <Badge 
                        variant={report.status === 'completed' ? 'default' : 'secondary'}
                      >
                        {report.status === 'completed' ? 'Ready' : 'Generating...'}
                      </Badge>
                      
                      {report.status === 'completed' && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedReport(report)}
                            className="flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => window.open(`/api/reports/${report.id}/download`, '_blank')}
                            className="flex items-center gap-2"
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                        </div>
                      )}
                      
                      {report.created_at && (
                        <p className="text-xs text-gray-500">
                          Generated: {new Date(report.created_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Badge variant="outline">Not Generated</Badge>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => generateSpecificReport(reportType)}
                        className="w-full"
                      >
                        Generate Report
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Report Viewer Modal/Panel */}
      {selectedReport && (
        <ReportViewer 
          report={selectedReport} 
          onClose={() => setSelectedReport(null)} 
        />
      )}
    </div>
  )
}
```

### 4. Professional Report Viewer Component

#### Create `/src/components/reports/ReportViewer.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, X, Maximize2 } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface ReportViewerProps {
  report: any
  onClose: () => void
}

export function ReportViewer({ report, onClose }: ReportViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const renderThreatSnapshot = (data: any) => {
    return (
      <div className="min-h-screen bg-gray-50 print:bg-white">
        {/* Premium Header */}
        <header className="bg-white border-b border-gray-200 print:border-gray-300">
          <div className="max-w-7xl mx-auto px-8 py-8">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-3xl font-light text-gray-900">Security Risk Assessment</h1>
                </div>
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">{data.company_name}</span>
                    <span className="mx-2">•</span>
                    <span>{data.domain}</span>
                  </div>
                  <div>
                    <span className="mx-2">•</span>
                    <span>{formatDate(data.scan_date)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Executive Summary Section */}
        <section className="max-w-7xl mx-auto px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Risk Score */}
            <div className="lg:row-span-2">
              <RiskScoreVisualization score={data.overall_risk_score} />
            </div>
            
            {/* Financial Impact Grid */}
            <div className="lg:col-span-2 grid grid-cols-2 gap-6">
              <FinancialImpactCard 
                title="Expected Annual Loss"
                value={data.eal_ml_total}
                subtitle="Most likely scenario"
                emphasis={true}
              />
              <FinancialImpactCard 
                title="Daily Risk Exposure"
                value={data.eal_daily_total}
                subtitle="Cost per day if exploited"
              />
              <FinancialImpactCard 
                title="Best Case Estimate"
                value={data.eal_low_total}
                subtitle="Conservative projection"
              />
              <FinancialImpactCard 
                title="Worst Case Scenario"
                value={data.eal_high_total}
                subtitle="Maximum potential impact"
              />
            </div>
          </div>
        </section>

        {/* Findings Analysis */}
        <section className="max-w-7xl mx-auto px-8 py-12">
          <h2 className="text-2xl font-light text-gray-900 mb-8">Security Findings Analysis</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <SeverityDistribution data={data.severity_counts} />
            <CategoryBreakdown data={data.finding_types} />
          </div>
        </section>

        {/* Priority Findings */}
        <section className="max-w-7xl mx-auto px-8 py-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-light text-gray-900">Priority Findings</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Info className="w-4 h-4" />
              <span>Immediate action required</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            {data.critical_findings?.map((finding) => (
              <FindingCard key={finding.id} finding={finding} />
            ))}
          </div>
        </section>
      </div>
    )
  }

  const renderExecutiveSummary = (data: any) => {
    // Similar structure but with executive summary specific styling
    return (
      <div className="prose prose-lg max-w-none">
        <div dangerouslySetInnerHTML={{ __html: data.content }} />
      </div>
    )
  }

  const renderTechnicalRemediation = (data: any) => {
    // Technical report with code blocks and remediation steps
    return (
      <div className="prose prose-lg max-w-none prose-code:text-sm">
        <div dangerouslySetInnerHTML={{ __html: data.content }} />
      </div>
    )
  }

  const renderReport = () => {
    const data = JSON.parse(report.content || '{}')
    
    switch (report.report_type) {
      case 'threat_snapshot':
        return renderThreatSnapshot(data)
      case 'executive_summary':
        return renderExecutiveSummary(data)
      case 'technical_remediation':
        return renderTechnicalRemediation(data)
      default:
        return <div>Unsupported report type</div>
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className={`max-w-7xl ${isFullscreen ? 'h-screen' : 'h-[90vh]'} overflow-hidden`}>
        <DialogHeader className="flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-xl">
              {report.report_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </DialogTitle>
            <div className="flex items-center gap-3 mt-2">
              <Badge variant="outline">{report.status}</Badge>
              <span className="text-sm text-gray-500">
                Generated: {formatDate(report.created_at)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`/api/reports/${report.id}/download`, '_blank')}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto border rounded-lg bg-white">
          {renderReport()}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Supporting components from snapshot.md design
const RiskScoreVisualization = ({ score }) => {
  const getGradient = (score) => {
    if (score <= 30) return 'from-emerald-400 to-teal-500'
    if (score <= 60) return 'from-amber-400 to-orange-500'
    if (score <= 80) return 'from-orange-500 to-red-500'
    return 'from-red-500 to-red-600'
  }
  
  return (
    <div className="relative bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white" />
      <div className="relative p-12">
        <div className="text-center mb-8">
          <h3 className="text-sm font-medium text-gray-500 tracking-wider uppercase">Overall Risk Score</h3>
        </div>
        <div className="relative bg-gray-50/50 rounded-2xl p-8 border border-gray-100">
          <div className={`text-8xl font-thin bg-gradient-to-br ${getGradient(score)} bg-clip-text text-transparent text-center`}>
            {score}
          </div>
          <div className="text-center mt-4">
            <span className="text-gray-600 text-lg">out of 100</span>
          </div>
        </div>
        <div className="mt-10 flex items-center justify-center">
          <div className="flex items-center gap-3 px-6 py-3 bg-red-50 rounded-full">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-900 font-medium">
              {score > 70 ? 'High Risk Environment' : score > 40 ? 'Medium Risk Environment' : 'Low Risk Environment'}
            </span>
          </div>
        </div>
        <div className="mt-8">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${getGradient(score)} transition-all duration-1000 ease-out rounded-full`}
              style={{ width: `${score}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Low Risk</span>
            <span>Critical Risk</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const FinancialImpactCard = ({ title, value, subtitle, emphasis }) => {
  return (
    <div className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-xl ${
      emphasis ? 'border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50' : 'border-gray-200 bg-white'
    }`}>
      <div className={`absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br ${
        emphasis ? 'from-orange-200 to-amber-200' : 'from-gray-100 to-gray-200'
      } rounded-full blur-3xl opacity-50 group-hover:opacity-70 transition-opacity`} />
      
      <div className="relative p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">{title}</p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-end justify-between">
          <div>
            <div className={`text-4xl font-light ${
              emphasis ? 'text-orange-900' : 'text-gray-900'
            }`}>
              {formatCurrency(value)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Additional components for SeverityDistribution, CategoryBreakdown, and FindingCard
// ... (include the remaining components from snapshot.md)
```

### 5. API Routes Enhancement

#### Update `/src/app/api/reports/route.ts`

```typescript
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const scanId = searchParams.get('scanId')
  
  const supabase = createClient()
  
  let query = supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (scanId) {
    query = query.eq('scan_id', scanId)
  }
  
  const { data, error } = await query
  
  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
  
  return Response.json(data)
}
```

#### Create `/src/app/api/reports/[reportId]/download/route.ts`

```typescript
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  const reportId = params.reportId
  const supabase = createClient()
  
  const { data: report, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .single()
  
  if (error || !report) {
    return new Response('Report not found', { status: 404 })
  }
  
  // Generate PDF or formatted HTML for download
  const html = generateReportHTML(report)
  
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
      'Content-Disposition': `attachment; filename="${report.report_type}-${report.scan_id}.html"`
    }
  })
}

function generateReportHTML(report: any): string {
  // Convert report content to standalone HTML with embedded CSS
  const baseCSS = `
    <style>
      /* Include Tailwind CSS styles inline for standalone HTML */
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
      /* Add all necessary styles from snapshot.md design */
    </style>
  `
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${report.report_type} - ${report.scan_id}</title>
      ${baseCSS}
    </head>
    <body>
      <div class="container">
        ${report.content}
      </div>
    </body>
    </html>
  `
}
```

### 6. Automatic Report Generation

#### Update `/src/app/api/scans/route.ts`

Add automatic report generation trigger when scan completes:

```typescript
// In the scan completion handler
if (scanResult.status === 'completed' && scanResult.findings?.length > 0) {
  // Auto-generate reports if enabled
  if (requestData.autoGenerateReports) {
    const reportTypes = requestData.reportTypes || ['threat_snapshot', 'executive_summary', 'technical_remediation']
    
    for (const reportType of reportTypes) {
      // Trigger async report generation
      fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          scanId: scanResult.scan_id, 
          reportType 
        })
      }).catch(console.error) // Fire and forget
    }
  }
}
```

### 7. Navigation Updates

#### Update `/src/components/layout/sidebar.tsx`

Add scan report navigation:

```typescript
const menuItems = [
  // ... existing items
  {
    href: '/scans',
    label: 'Security Scans',
    icon: Shield,
    subItems: [
      { href: '/scans/new', label: 'New Scan' },
      { href: '/scans', label: 'All Scans' },
      { href: '/reports', label: 'All Reports' }
    ]
  },
  // ... rest of items
]
```

## Implementation Steps

1. **Phase 1**: Update scan creation form with auto-report options
2. **Phase 2**: Create the scan reports page and viewer component  
3. **Phase 3**: Implement professional report rendering with snapshot.md styling
4. **Phase 4**: Add report download functionality
5. **Phase 5**: Integrate automatic report generation
6. **Phase 6**: Update navigation and UI consistency

## Key Design Principles

- **Emphasis on Losses**: Financial impact metrics prominently displayed first
- **Risk Score**: Central visual element showing overall security posture  
- **Category-based Organization**: Group findings by threat categories
- **Professional Aesthetics**: Clean, gradient-based design matching snapshot.md
- **Responsive Design**: Works across all device sizes
- **Print-friendly**: Optimized for PDF generation and printing

## Testing Requirements

1. Test single and bulk scan creation with auto-report generation
2. Verify all three report types generate correctly
3. Ensure report viewer displays properly formatted content
4. Test download functionality across different browsers
5. Validate responsive design on mobile devices
6. Confirm print/PDF output quality

This comprehensive update will transform the frontend into a complete security scanning and reporting platform with professional, client-ready reports based on the proven snapshot.md design.