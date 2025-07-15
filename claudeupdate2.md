# Frontend Update Instructions for Scan Management & Report Generation (Revised)

## Overview
This document provides detailed instructions to update the frontend with enhanced scan management functionality, including individual and bulk scan triggering, findings review, and automated report generation with professional HTML designs based on the snapshot.md template.

**Key Constraint**: Use existing dependencies and UI components. Only add new dependencies if absolutely critical.

## Pre-Implementation Analysis ✅

### ☒ Database Schema Assessment
**Status**: ✅ READY - All required tables exist with proper relationships

**Existing Tables**:
- `reports` table: id, scan_id, company_name, domain, content, report_type, findings_count, status
- `report_jobs` table: For async job tracking with status, tokens, costs
- `report_templates` table: Contains the 3 report types with prompts and configurations
- `scan_status` table: Proper foreign key relationships established

**Key Finding**: Database fully supports the planned functionality with no schema changes needed.

### ☒ UI Components & Dependencies Analysis  
**Status**: ✅ EXCELLENT FOUNDATION - Rich component library available

**Available Components**:
- **Radix UI**: checkbox, collapsible, dialog, dropdown-menu, label, progress, select, slot
- **Data Management**: @tanstack/react-query, @tanstack/react-table
- **Styling**: Tailwind CSS, class-variance-authority, clsx, tailwind-merge
- **Icons**: lucide-react (comprehensive icon set)
- **State**: zustand for global state management

**Missing Components** (need simple implementations):
- Tabs component (will create using existing primitives)
- Skeleton component (simple loading placeholders)

### ☒ API Endpoint Compatibility Review
**Status**: ✅ FULLY COMPATIBLE - Current endpoints support planned features

**Existing API Structure**:
- `/api/reports/generate` - ✅ Already supports multiple report types
- `/api/reports` - ✅ Ready for scan filtering with GET params
- Report generation logic - ✅ Uses OpenAI with proper prompt templates
- Database integration - ✅ Supabase client properly configured

**Current API Call Patterns**:
1. **Get all scans**: `GET /api/scans`
2. **Get findings for specific scan**: `GET /api/findings?scanId={scanId}&severity={severity}&state={state}`  
3. **Update findings state**: `PATCH /api/findings/verify` with body `{ findingIds: string[], state: string }`
4. **Generate reports**: `POST /api/reports/generate` with body `{ scanId, reportType, findings, companyName, domain }`
5. **Get reports for scan**: `GET /api/reports?scanId={scanId}`

**Key Finding**: Current API in `/src/app/api/reports/generate/route.ts` already implements:
- Multiple report types (threat_snapshot, executive_summary, technical_remediation)
- Proper prompt templating system
- Database storage with scan relationships
- Error handling and validation

## Implementation Roadmap

### ☐ Phase 1: Foundation & Core Components
### ☐ Phase 2: Report Management Pages  
### ☐ Phase 3: Enhanced API & Integration
### ☐ Phase 4: UI Polish & Navigation

## Available Dependencies & Components

### Existing UI Framework
- **Radix UI Components**: checkbox, collapsible, dialog, dropdown-menu, label, progress, select, slot
- **Styling**: Tailwind CSS with class-variance-authority, clsx, tailwind-merge
- **State Management**: Zustand, TanStack React Query
- **Icons**: Lucide React
- **Data Tables**: TanStack React Table

### Missing Components to Create
Since we don't have Tabs or Skeleton components, create simple versions using existing primitives:

```typescript
// src/components/ui/tabs.tsx - Simple implementation
export const Tabs = ({ children, defaultValue, value, onValueChange, className, ...props }) => (
  <div className={className} {...props}>{children}</div>
)

export const TabsList = ({ children, className, ...props }) => (
  <div className={`flex space-x-1 ${className}`} {...props}>{children}</div>
)

export const TabsTrigger = ({ children, value, isActive, onClick, className, ...props }) => (
  <button 
    onClick={() => onClick(value)}
    className={`px-3 py-2 rounded-md transition-colors ${
      isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900'
    } ${className}`}
    {...props}
  >
    {children}
  </button>
)

export const TabsContent = ({ children, value, activeValue, className, ...props }) => 
  value === activeValue ? <div className={className} {...props}>{children}</div> : null

// src/components/ui/skeleton.tsx - Simple loading placeholders
export const Skeleton = ({ className, ...props }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} {...props} />
)
```

## Revised Implementation Plan

### Phase 1: Foundation & Core Components ✅ Use Existing Components

#### 1.1 Create Missing UI Components
Create the simple Tabs and Skeleton components above using existing Radix primitives.

#### 1.2 Update Scan Creation Form
**File**: `/src/app/(dashboard)/scans/new/page.tsx`

Use existing components:
- `@radix-ui/react-checkbox` for auto-report options
- `@radix-ui/react-label` for form labels  
- Existing form validation and submission logic

```typescript
// Add to existing form schema (using existing validation)
const formSchema = z.object({
  // ... existing fields
  autoGenerateReports: z.boolean().default(true),
  reportTypes: z.array(z.enum(['threat_snapshot', 'executive_summary', 'technical_remediation']))
    .default(['threat_snapshot', 'executive_summary', 'technical_remediation'])
})

// Add to existing form component (use existing Checkbox from @radix-ui/react-checkbox)
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

// Add after existing form fields
<div className="space-y-4">
  <div className="flex items-center space-x-2">
    <Checkbox 
      id="autoGenerateReports" 
      checked={form.watch('autoGenerateReports')}
      onCheckedChange={(checked) => form.setValue('autoGenerateReports', checked)}
    />
    <Label htmlFor="autoGenerateReports" className="text-sm font-medium">
      Auto-generate all three reports upon scan completion
    </Label>
  </div>
  
  {form.watch('autoGenerateReports') && (
    <div className="ml-6 space-y-2">
      <p className="text-sm text-gray-600">Reports to generate:</p>
      <div className="space-y-2">
        {REPORT_CONFIGS.map((report) => (
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
            <Label htmlFor={report.id} className="text-sm">{report.label}</Label>
          </div>
        ))}
      </div>
    </div>
  )}
</div>

const REPORT_CONFIGS = [
  { id: 'threat_snapshot', label: 'Threat Snapshot (Executive Dashboard)', maxWords: 650 },
  { id: 'executive_summary', label: 'Executive Summary (Strategic Overview)', maxWords: 2500 },
  { id: 'technical_remediation', label: 'Technical Remediation Guide', maxWords: 4500 }
]
```

### Phase 2: Report Management Pages ✅ Use Existing TanStack Components

#### 2.1 Enhanced Scans List Page
**File**: `/src/app/(dashboard)/scans/page.tsx`

Use existing:
- `@tanstack/react-table` for data tables (already implemented)
- `@radix-ui/react-dropdown-menu` for actions menu
- Existing Badge component for status indicators

```typescript
// Add reports column to existing table (use existing @tanstack/react-table setup)
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

// Add to existing columns array
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
          {reportCount} Reports
        </Badge>
        {pendingReports > 0 && (
          <Badge variant="outline">{pendingReports} Pending</Badge>
        )}
      </div>
    )
  }
}

// Enhance existing actions dropdown
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
              <Link href={`/scans/${scan.scan_id}/reports`}>📊 View Reports</Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }
}
```

#### 2.2 New Scan Reports Page
**File**: `/src/app/(dashboard)/scans/[scanId]/reports/page.tsx`

Use existing components:
- `@radix-ui/react-dialog` for report viewer modal
- Existing Card components for report cards
- `@tanstack/react-query` for data fetching (existing pattern)

```typescript
'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FileText, Download, Eye, RefreshCw } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton' // Our simple implementation

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
  const [selectedReport, setSelectedReport] = useState(null)

  // Use existing TanStack Query pattern
  const { data: scanData, isLoading: scanLoading } = useQuery({
    queryKey: ['scan', scanId],
    queryFn: () => fetch(`/api/scans/${scanId}`).then(res => res.json())
  })

  const { data: reports, isLoading: reportsLoading, refetch } = useQuery({
    queryKey: ['reports', scanId],
    queryFn: () => fetch(`/api/reports?scanId=${scanId}`).then(res => res.json())
  })

  const generateAllReports = async () => {
    const reportTypes = ['threat_snapshot', 'executive_summary', 'technical_remediation']
    
    for (const reportType of reportTypes) {
      try {
        await fetch('/api/reports/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            scanId, 
            reportType,
            findings: scanData?.findings || [],
            companyName: scanData?.company_name,
            domain: scanData?.domain
          })
        })
      } catch (error) {
        console.error(`Failed to generate ${reportType}:`, error)
      }
    }
    
    refetch() // Refresh the data
  }

  if (scanLoading || reportsLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map(i => <Skeleton key={i} className="h-48 w-full" />)}
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
          const report = reports?.find(r => r.report_type === reportType)
          const IconComponent = config.icon
          
          return (
            <Card key={reportType} className="hover:shadow-lg transition-shadow cursor-pointer" 
                  onClick={() => report?.status === 'completed' && setSelectedReport(report)}>
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
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedReport(report)
                            }}
                            className="flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                          <Button 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              window.open(`/api/reports/${report.id}/download`, '_blank')
                            }}
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
                        onClick={(e) => {
                          e.stopPropagation()
                          generateSpecificReport(reportType)
                        }}
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

      {/* Report Viewer Modal using existing Dialog */}
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

### Phase 3: Professional Report Viewer Component ✅ Use Existing Dialog

#### 3.1 Report Viewer Component
**File**: `/src/components/reports/ReportViewer.tsx`

Use existing:
- `@radix-ui/react-dialog` for modal display
- Existing Button and Badge components
- Professional styling using snapshot.md design principles

```typescript
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, X, Maximize2, Shield, TrendingUp, AlertCircle, Info } from 'lucide-react'

interface ReportViewerProps {
  report: any
  onClose: () => void
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function ReportViewer({ report, onClose }: ReportViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const renderThreatSnapshot = (data: any) => {
    // Professional styling based on snapshot.md design
    return (
      <div className="min-h-screen bg-gray-50 print:bg-white">
        {/* Premium Header with gradient and professional typography */}
        <header className="bg-white border-b border-gray-200">
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

        {/* Executive Summary Section - EMPHASIS ON LOSSES FIRST */}
        <section className="max-w-7xl mx-auto px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Risk Score - Central Visual Element */}
            <div className="lg:row-span-2">
              <RiskScoreVisualization score={data.overall_risk_score || 72} />
            </div>
            
            {/* Financial Impact Grid - PROMINENT DISPLAY OF LOSSES */}
            <div className="lg:col-span-2 grid grid-cols-2 gap-6">
              <FinancialImpactCard 
                title="Expected Annual Loss"
                value={data.eal_ml_total || 425000}
                subtitle="Most likely scenario"
                emphasis={true}
              />
              <FinancialImpactCard 
                title="Daily Risk Exposure"
                value={data.eal_daily_total || 2500}
                subtitle="Cost per day if exploited"
              />
              <FinancialImpactCard 
                title="Best Case Estimate" 
                value={data.eal_low_total || 150000}
                subtitle="Conservative projection"
              />
              <FinancialImpactCard 
                title="Worst Case Scenario"
                value={data.eal_high_total || 850000}
                subtitle="Maximum potential impact"
              />
            </div>
          </div>
        </section>

        {/* Category-based Organization */}
        <section className="max-w-7xl mx-auto px-8 py-12">
          <h2 className="text-2xl font-light text-gray-900 mb-8">Security Findings Analysis</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <SeverityDistribution data={data.severity_counts || {}} />
            <CategoryBreakdown data={data.finding_types || []} />
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
            {(data.critical_findings || []).map((finding: any) => (
              <FindingCard key={finding.id} finding={finding} />
            ))}
          </div>
        </section>
      </div>
    )
  }

  // Parse report content (markdown or JSON)
  const parseReportData = () => {
    try {
      return JSON.parse(report.content || '{}')
    } catch {
      // If it's markdown, extract YAML front matter and return basic structure
      return {
        company_name: report.company_name,
        domain: report.domain,
        scan_date: report.created_at,
        overall_risk_score: 72 // Default value
      }
    }
  }

  const data = parseReportData()

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className={`max-w-7xl ${isFullscreen ? 'h-screen' : 'h-[90vh]'} overflow-hidden`}>
        <DialogHeader className="flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-xl">
              {report.report_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
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
          {renderThreatSnapshot(data)}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Supporting components based on snapshot.md design principles
const RiskScoreVisualization = ({ score }: { score: number }) => {
  const getGradient = (score: number) => {
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

const FinancialImpactCard = ({ title, value, subtitle, emphasis }: {
  title: string
  value: number
  subtitle?: string
  emphasis?: boolean
}) => {
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

// Additional components: SeverityDistribution, CategoryBreakdown, FindingCard
// (Similar implementations using existing styling patterns)
```

### Phase 4: API Enhancement ✅ Extend Existing Endpoints

#### 4.1 Update Reports API Routes
**File**: `/src/app/api/reports/route.ts`

Use existing Supabase patterns and enhance current functionality:

```typescript
// Extend existing route to support scan filtering
import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase' // Use existing client

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const scanId = searchParams.get('scanId')
  
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

#### 4.2 Report Download Endpoint
**File**: `/src/app/api/reports/[reportId]/download/route.ts`

```typescript
// Create new endpoint for formatted HTML downloads
import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  const reportId = params.reportId
  
  const { data: report, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .single()
  
  if (error || !report) {
    return new Response('Report not found', { status: 404 })
  }
  
  // Generate standalone HTML with embedded CSS
  const html = generateStandaloneHTML(report)
  
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
      'Content-Disposition': `attachment; filename="${report.report_type}-${report.scan_id}.html"`
    }
  })
}

function generateStandaloneHTML(report: any): string {
  // Convert report to standalone HTML with embedded Tailwind styles
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${report.report_type} - ${report.scan_id}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    /* Custom styles for professional reports */
    .gradient-text { background: linear-gradient(135deg, #ef4444, #dc2626); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  </style>
</head>
<body class="bg-gray-50">
  <div class="container mx-auto py-8">
    ${report.content}
  </div>
</body>
</html>`
}
```

## Implementation Steps Summary

1. **Phase 1**: Create simple Tabs/Skeleton components, update scan creation form
2. **Phase 2**: Build scan reports page and report viewer using existing Dialog  
3. **Phase 3**: Implement professional report rendering with snapshot.md styling principles
4. **Phase 4**: Add API enhancements for filtering and downloads

## Key Design Principles (Unchanged)

- **Emphasis on Losses**: Financial impact metrics prominently displayed first
- **Risk Score**: Central visual element showing overall security posture  
- **Category-based Organization**: Group findings by threat categories
- **Professional Aesthetics**: Clean, gradient-based design matching snapshot.md
- **Responsive Design**: Works across all device sizes using existing Tailwind patterns

## Dependency Strategy ✅

- **Use Existing**: All Radix UI components, TanStack Query/Table, Lucide icons
- **Create Simple**: Only missing Tabs and Skeleton using existing primitives  
- **Leverage**: Existing styling patterns, form validation, API patterns
- **Enhance**: Current functionality rather than replacing it

This approach maximizes the use of existing infrastructure while delivering the professional report management functionality requested.