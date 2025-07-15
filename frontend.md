This file is a merged representation of the entire codebase, combined into a single document by Repomix.

<file_summary>
This section contains a summary of this file.

<purpose>
This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.
</purpose>

<file_format>
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  - File path as an attribute
  - Full contents of the file
</file_format>

<usage_guidelines>
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.
</usage_guidelines>

<notes>
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)
</notes>

</file_summary>

<directory_structure>
app/
  .claude/
    settings.local.json
  (dashboard)/
    dashboard/
      page.tsx
    findings/
      page.tsx
    reports/
      page.tsx
    scans/
      [scanId]/
        findings/
          page.tsx
        page.tsx
      new/
        page.tsx
      page.tsx
    settings/
      page.tsx
    layout.tsx
  api/
    dashboard/
      recent-scans/
        route.ts
      stats/
        route.ts
    findings/
      verify/
        route.ts
      route.ts
    reports/
      generate/
        # Due-Diligence Risk Assessment Prompt.ini
        route.ts
      route.ts
    scans/
      bulk/
        route.ts
      route.ts
  globals.css
  layout.tsx
  page.tsx
components/
  layout/
    header.tsx
    sidebar.tsx
  ui/
    badge.tsx
    button.tsx
    card.tsx
    checkbox.tsx
    collapsible.tsx
    dialog.tsx
    dropdown-menu.tsx
    input.tsx
    label.tsx
    progress.tsx
    select.tsx
    table.tsx
lib/
  types/
    database.ts
  providers.tsx
  supabase.ts
  utils.ts
</directory_structure>

<files>
This section contains the contents of the repository's files.

<file path="app/.claude/settings.local.json">
{
  "permissions": {
    "allow": [
      "Bash(git pull:*)",
      "Bash(git push:*)",
      "Bash(pnpm install:*)",
      "Bash(git add:*)",
      "Bash(git commit:*)",
      "Bash(git reset:*)",
      "Bash(git fetch:*)"
    ],
    "deny": []
  }
}
</file>

<file path="app/(dashboard)/dashboard/page.tsx">
'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Plus,
  Activity,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { Scan } from '@/lib/types/database'

interface DashboardStats {
  totalScans: number
  criticalFindings: number
  verifiedIssues: number
  activeScans: number
}


export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/stats')
      if (!response.ok) throw new Error('Failed to fetch stats')
      return response.json()
    }
  })

  const { data: recentScans, isLoading: scansLoading } = useQuery<Scan[]>({
    queryKey: ['recent-scans'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/recent-scans')
      if (!response.ok) throw new Error('Failed to fetch recent scans')
      return response.json()
    }
  })


  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default'
      case 'processing': return 'secondary'
      case 'failed': return 'destructive'
      default: return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Security Dashboard</h1>
        <Button asChild>
          <Link href="/scans/new">
            <Plus className="mr-2 h-4 w-4" />
            New Scan
          </Link>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.totalScans || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Security assessments conducted
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Findings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.criticalFindings || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Issues</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.verifiedIssues || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Confirmed security issues
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Scans</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.activeScans || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently in progress
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Activity */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Scans</CardTitle>
            <CardDescription>
              Your latest security assessments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {scansLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : recentScans && recentScans.length > 0 ? (
              recentScans.map((scan) => {
                const progressPercentage = (scan.progress / scan.total_modules) * 100
                return (
                  <div key={scan.scan_id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{scan.company_name}</p>
                      <p className="text-xs text-muted-foreground">{scan.domain}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getStatusVariant(scan.status)}>
                        {scan.status.charAt(0).toUpperCase() + scan.status.slice(1)}
                      </Badge>
                      <div className="w-20">
                        <Progress value={progressPercentage} className="h-2" />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {Math.round(progressPercentage)}%
                      </span>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8">
                <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No scans yet</p>
                <p className="text-xs text-muted-foreground">Start your first security scan</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/scans/new">
                <Plus className="mr-2 h-4 w-4" />
                Start New Scan
              </Link>
            </Button>
            
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/findings">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Review Findings
              </Link>
            </Button>
            
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/reports">
                <TrendingUp className="mr-2 h-4 w-4" />
                Generate Report
              </Link>
            </Button>
            
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/scans">
                <Clock className="mr-2 h-4 w-4" />
                View All Scans
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
</file>

<file path="app/(dashboard)/findings/page.tsx">
'use client'

import { useState, Suspense } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { 
  AlertTriangle, 
  CheckCircle, 
  Search, 
  Shield,
  Loader2,
  ChevronDown,
  ChevronRight,
  Building,
  Globe
} from 'lucide-react'
import { Finding, Scan } from '@/lib/types/database'



function FindingsContent() {
  const [selectedFindings, setSelectedFindings] = useState<string[]>([])
  const [expandedScans, setExpandedScans] = useState<Set<string>>(new Set())
  const [scanFindings, setScanFindings] = useState<Record<string, Finding[]>>({})
  const [loadingFindings, setLoadingFindings] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [findingFilters, setFindingFilters] = useState({
    severity: 'ALL',
    state: 'ALL'
  })

  // Get all scans
  const { data: allScans, isLoading: scansLoading } = useQuery<Scan[]>({
    queryKey: ['scans'],
    queryFn: async () => {
      const response = await fetch('/api/scans')
      if (!response.ok) throw new Error('Failed to fetch scans')
      return response.json()
    }
  })

  // Filter scans based on search
  const scans = allScans?.filter(scan => {
    if (!search) return true
    return scan.company_name.toLowerCase().includes(search.toLowerCase()) ||
           scan.domain.toLowerCase().includes(search.toLowerCase()) ||
           scan.scan_id.toLowerCase().includes(search.toLowerCase())
  }) || []

  // Load findings for a specific scan
  const loadScanFindings = async (scanId: string) => {
    if (scanFindings[scanId]) return // Already loaded
    
    setLoadingFindings(prev => new Set([...prev, scanId]))
    
    try {
      const params = new URLSearchParams({
        scanId,
        ...(findingFilters.severity !== 'ALL' && { severity: findingFilters.severity }),
        ...(findingFilters.state !== 'ALL' && { state: findingFilters.state })
      })
      
      const response = await fetch(`/api/findings?${params}`)
      if (response.ok) {
        const findings = await response.json()
        setScanFindings(prev => ({ ...prev, [scanId]: findings }))
      }
    } catch (error) {
      console.error('Failed to fetch findings:', error)
    } finally {
      setLoadingFindings(prev => {
        const newSet = new Set(prev)
        newSet.delete(scanId)
        return newSet
      })
    }
  }

  // Toggle scan expansion
  const toggleScan = async (scanId: string) => {
    const newExpanded = new Set(expandedScans)
    
    if (expandedScans.has(scanId)) {
      newExpanded.delete(scanId)
    } else {
      newExpanded.add(scanId)
      await loadScanFindings(scanId)
    }
    
    setExpandedScans(newExpanded)
  }

  const handleVerifyFindings = async (findingIds: string[], newState: string) => {
    console.log('Updating findings:', findingIds, 'to state:', newState)
    try {
      const response = await fetch('/api/findings/verify', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ findingIds, state: newState }),
      })

      if (response.ok) {
        const { findings: updatedFindings } = await response.json()
        console.log('Updated findings:', updatedFindings)
        
        // Update the local state immediately for better UX
        setScanFindings(prev => {
          const newState = { ...prev }
          
          // Update each affected finding
          updatedFindings.forEach((updatedFinding: Finding) => {
            Object.keys(newState).forEach(scanId => {
              newState[scanId] = newState[scanId].map(finding => 
                finding.id === updatedFinding.id ? updatedFinding : finding
              )
            })
          })
          
          return newState
        })
        
        setSelectedFindings([])
      } else {
        const errorData = await response.json()
        console.error('API error:', errorData)
      }
    } catch (error) {
      console.error('Failed to verify findings:', error)
    }
  }

  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'destructive'
      case 'HIGH': return 'destructive'
      case 'MEDIUM': return 'secondary'
      case 'LOW': return 'outline'
      default: return 'outline'
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default'
      case 'processing': return 'secondary'
      case 'failed': return 'destructive'
      default: return 'outline'
    }
  }

  // Calculate totals across all loaded findings
  const allFindings = Object.values(scanFindings).flat()
  const verifiedCount = allFindings.filter(f => f.state === 'VERIFIED').length
  const totalFindings = allFindings.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Findings by Scan</h1>
          <p className="text-muted-foreground">
            {verifiedCount} verified of {totalFindings} loaded findings across {scans?.length || 0} scans
          </p>
        </div>
        
        <div className="flex gap-2">
          {selectedFindings.length > 0 && (
            <>
              <Button
                variant="outline"
                onClick={() => handleVerifyFindings(selectedFindings, 'VERIFIED')}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Verify Selected ({selectedFindings.length})
              </Button>
              <Button
                variant="outline"
                onClick={() => handleVerifyFindings(selectedFindings, 'falsepositive')}
              >
                Mark False Positive
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="md:col-span-2 space-y-2">
          <label className="text-sm font-medium">Search Scans</label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by company, domain, or scan ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Finding Severity</label>
          <Select 
            value={findingFilters.severity} 
            onValueChange={(value) => setFindingFilters(prev => ({ ...prev, severity: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All severities</SelectItem>
              <SelectItem value="CRITICAL">Critical</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Finding Status</label>
          <Select 
            value={findingFilters.state} 
            onValueChange={(value) => setFindingFilters(prev => ({ ...prev, state: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value="AUTOMATED">Automated</SelectItem>
              <SelectItem value="VERIFIED">Verified</SelectItem>
              <SelectItem value="falsepositive">False Positive</SelectItem>
              <SelectItem value="DISREGARD">Disregard</SelectItem>
              <SelectItem value="NEED_OWNER_VERIFICATION">Need Owner Verification</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Scans List */}
      <Card>
        <CardHeader>
          <CardTitle>Scans with Findings</CardTitle>
          <CardDescription>
            Click on any scan to expand and view its security findings
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {scansLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : scans && scans.length > 0 ? (
            <div className="space-y-2">
              {scans.map((scan) => (
                <Collapsible
                  key={scan.scan_id}
                  open={expandedScans.has(scan.scan_id)}
                  onOpenChange={() => toggleScan(scan.scan_id)}
                >
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer border-b">
                      <div className="flex items-center gap-3">
                        {expandedScans.has(scan.scan_id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{scan.company_name}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Globe className="h-3 w-3" />
                              <span>{scan.domain}</span>
                              <span>•</span>
                              <span>{scan.scan_id}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge variant={getStatusVariant(scan.status)}>
                          {scan.status}
                        </Badge>
                        <Badge variant="outline">
                          {scanFindings[scan.scan_id]?.length || 0} findings
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(scan.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="border-t bg-muted/20">
                      {loadingFindings.has(scan.scan_id) ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      ) : scanFindings[scan.scan_id] && scanFindings[scan.scan_id].length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">
                                <Checkbox
                                  checked={scanFindings[scan.scan_id]?.every(f => selectedFindings.includes(f.id)) || false}
                                  onCheckedChange={(checked) => {
                                    const scanFindingIds = scanFindings[scan.scan_id]?.map(f => f.id) || []
                                    if (checked) {
                                      setSelectedFindings(prev => [...new Set([...prev, ...scanFindingIds])])
                                    } else {
                                      setSelectedFindings(prev => prev.filter(id => !scanFindingIds.includes(id)))
                                    }
                                  }}
                                />
                              </TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Severity</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Recommendation</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {scanFindings[scan.scan_id]?.map((finding) => (
                              <TableRow key={finding.id}>
                                <TableCell>
                                  <Checkbox
                                    checked={selectedFindings.includes(finding.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedFindings(prev => [...prev, finding.id])
                                      } else {
                                        setSelectedFindings(prev => prev.filter(id => id !== finding.id))
                                      }
                                    }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {finding.type}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={getSeverityVariant(finding.severity)}>
                                    {finding.severity}
                                  </Badge>
                                </TableCell>
                                <TableCell className="max-w-lg">
                                  <p className="whitespace-normal break-words">{finding.description}</p>
                                </TableCell>
                                <TableCell>
                                  <Select
                                    value={finding.state}
                                    onValueChange={(newState) => handleVerifyFindings([finding.id], newState)}
                                  >
                                    <SelectTrigger className="w-36 bg-white">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border shadow-md z-50">
                                      <SelectItem value="AUTOMATED" className="cursor-pointer">Automated</SelectItem>
                                      <SelectItem value="VERIFIED" className="cursor-pointer">Verified</SelectItem>
                                      <SelectItem value="FALSE_POSITIVE" className="cursor-pointer">False Positive</SelectItem>
                                      <SelectItem value="DISREGARD" className="cursor-pointer">Disregard</SelectItem>
                                      <SelectItem value="NEED_OWNER_VERIFICATION" className="cursor-pointer">Need Owner Verification</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell className="max-w-lg">
                                  <p className="text-sm text-muted-foreground whitespace-normal break-words">
                                    {finding.recommendation}
                                  </p>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-center py-8">
                          <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            No findings found for this scan with current filters
                          </p>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No scans found</h3>
              <p className="text-muted-foreground">
                No scans match your search criteria.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function FindingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <FindingsContent />
    </Suspense>
  )
}
</file>

<file path="app/(dashboard)/reports/page.tsx">
'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  FileText,
  Download,
  Eye,
  Loader2,
  Building,
  Globe,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'
import { Report, Scan } from '@/lib/types/database'

interface ScanWithVerifiedCount extends Scan {
  verified_findings_count: number
}

export default function ReportsPage() {
  const [generatingReports, setGeneratingReports] = useState<Set<string>>(new Set())

  const { data: reports, isLoading: reportsLoading } = useQuery<Report[]>({
    queryKey: ['reports'],
    queryFn: async () => {
      const response = await fetch('/api/reports')
      if (!response.ok) throw new Error('Failed to fetch reports')
      return response.json()
    }
  })

  const { data: scansWithVerified, isLoading: scansLoading } = useQuery<ScanWithVerifiedCount[]>({
    queryKey: ['scans-with-verified'],
    queryFn: async () => {
      const [scansResponse, findingsResponse] = await Promise.all([
        fetch('/api/scans'),
        fetch('/api/findings')
      ])
      
      if (!scansResponse.ok || !findingsResponse.ok) {
        throw new Error('Failed to fetch data')
      }
      
      const scans = await scansResponse.json()
      const allFindings = await findingsResponse.json()
      
      // Count verified findings per scan
      return scans.map((scan: Scan) => ({
        ...scan,
        verified_findings_count: allFindings.filter((f: { scan_id: string; state: string }) => 
          f.scan_id === scan.scan_id && f.state === 'VERIFIED'
        ).length
      }))
    }
  })

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default'
      case 'processing': return 'secondary'
      case 'failed': return 'destructive'
      default: return 'outline'
    }
  }

  const generateReport = async (scan: ScanWithVerifiedCount) => {
    if (scan.verified_findings_count === 0) return
    
    setGeneratingReports(prev => new Set([...prev, scan.scan_id]))
    
    try {
      // Get verified findings for this scan
      const findingsResponse = await fetch(`/api/findings?scanId=${scan.scan_id}`)
      const allFindings = await findingsResponse.json()
      const verifiedFindings = allFindings.filter((f: { state: string }) => f.state === 'VERIFIED')
      
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scanId: scan.scan_id,
          findings: verifiedFindings,
          companyName: scan.company_name,
          domain: scan.domain
        }),
      })

      if (response.ok) {
        const { reportId } = await response.json()
        // Refresh reports list
        window.location.href = `/reports/${reportId}`
      }
    } catch (error) {
      console.error('Failed to generate report:', error)
    } finally {
      setGeneratingReports(prev => {
        const newSet = new Set(prev)
        newSet.delete(scan.scan_id)
        return newSet
      })
    }
  }

  const exportReport = async (report: Report) => {
    try {
      // Create a downloadable file from the report content
      const fileName = `${report.company_name.replace(/[^a-z0-9]/gi, '_')}_Security_Report_${new Date(report.created_at).toISOString().split('T')[0]}.md`
      
      // Add a title and metadata to the report content
      const exportContent = `# Security Assessment Report
**Company:** ${report.company_name}  
**Domain:** ${report.domain}  
**Generated:** ${new Date(report.created_at).toLocaleDateString()}  
**Findings Count:** ${report.findings_count}  

---

${report.content}`

      // Create blob and download
      const blob = new Blob([exportContent], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export report:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Reports</h1>
          <p className="text-muted-foreground">
            Generate AI-powered due diligence reports from verified findings
          </p>
        </div>
      </div>

      {/* Generate Reports Section */}
      <Card>
        <CardHeader>
          <CardTitle>Generate New Reports</CardTitle>
          <CardDescription>
            Create professional due diligence reports from scans with verified findings
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {scansLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : scansWithVerified && scansWithVerified.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verified Findings</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scansWithVerified.map((scan) => (
                  <TableRow key={scan.scan_id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{scan.company_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span>{scan.domain}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(scan.status)}>
                        {scan.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <Badge variant="outline">
                          {scan.verified_findings_count} verified
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(scan.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        disabled={scan.verified_findings_count === 0 || generatingReports.has(scan.scan_id)}
                        onClick={() => generateReport(scan)}
                      >
                        {generatingReports.has(scan.scan_id) ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <FileText className="mr-2 h-4 w-4" />
                            Generate Report
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No scans available</h3>
              <p className="text-muted-foreground mb-4">
                Complete some scans and verify findings to generate reports.
              </p>
              <Button asChild>
                <Link href="/scans/new">
                  Start New Scan
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generated Reports Section */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Reports</CardTitle>
          <CardDescription>
            Previously generated security assessment reports
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {reportsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : reports && reports.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Findings</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">
                      {report.company_name}
                    </TableCell>
                    <TableCell>{report.domain}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {report.findings_count} findings
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(report.status)}>
                        {report.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(report.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/reports/${report.id}`}>
                            <Eye className="mr-1 h-3 w-3" />
                            View
                          </Link>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => exportReport(report)}
                        >
                          <Download className="mr-1 h-3 w-3" />
                          Export
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No reports generated yet</h3>
              <p className="text-muted-foreground">
                Generate your first report from verified scan findings above.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
</file>

<file path="app/(dashboard)/scans/[scanId]/findings/page.tsx">
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  AlertTriangle, 
  CheckCircle, 
  Search, 
  Filter,
  FileText,
  Shield
} from 'lucide-react'
import { Finding } from '@/lib/types/database'

export default function FindingsPage() {
  const params = useParams()
  const router = useRouter()
  const scanId = params.scanId as string
  
  const [findings, setFindings] = useState<Finding[]>([])
  const [selectedFindings, setSelectedFindings] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState({
    severity: 'ALL',
    state: 'ALL',
    search: ''
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = new URLSearchParams({
          scanId,
          ...(filters.severity !== 'ALL' && { severity: filters.severity }),
          ...(filters.state !== 'ALL' && { state: filters.state }),
          ...(filters.search && { search: filters.search })
        })
        
        const response = await fetch(`/api/findings?${params}`)
        if (response.ok) {
          const data = await response.json()
          setFindings(data)
        }
      } catch (error) {
        console.error('Failed to fetch findings:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [scanId, filters])

  const fetchFindings = async () => {
    try {
      const params = new URLSearchParams({
        scanId,
        ...(filters.severity !== 'ALL' && { severity: filters.severity }),
        ...(filters.state !== 'ALL' && { state: filters.state }),
        ...(filters.search && { search: filters.search })
      })
      
      const response = await fetch(`/api/findings?${params}`)
      if (response.ok) {
        const data = await response.json()
        setFindings(data)
      }
    } catch (error) {
      console.error('Failed to fetch findings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyFindings = async (findingIds: string[], newState: string) => {
    try {
      const response = await fetch('/api/findings/verify', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ findingIds, state: newState }),
      })

      if (response.ok) {
        await fetchFindings()
        setSelectedFindings([])
      }
    } catch (error) {
      console.error('Failed to verify findings:', error)
    }
  }

  const handleGenerateReport = async () => {
    const verifiedFindings = findings.filter(f => f.state === 'VERIFIED')
    
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scanId,
          findings: verifiedFindings,
          companyName: 'Company Name', // You'd get this from scan data
          domain: 'example.com' // You'd get this from scan data
        }),
      })

      if (response.ok) {
        const { reportId } = await response.json()
        router.push(`/reports/${reportId}`)
      }
    } catch (error) {
      console.error('Failed to generate report:', error)
    }
  }

  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'destructive'
      case 'HIGH': return 'destructive'
      case 'MEDIUM': return 'secondary'
      case 'LOW': return 'outline'
      default: return 'outline'
    }
  }


  const verifiedCount = findings.filter(f => f.state === 'VERIFIED').length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-8 w-8 animate-pulse mx-auto mb-4" />
          <p>Loading findings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Findings</h1>
          <p className="text-muted-foreground">
            {verifiedCount} verified of {findings.length} total findings
          </p>
        </div>
        
        <div className="flex gap-2">
          {selectedFindings.length > 0 && (
            <>
              <Button
                variant="outline"
                onClick={() => handleVerifyFindings(selectedFindings, 'VERIFIED')}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Verify Selected ({selectedFindings.length})
              </Button>
              <Button
                variant="outline"
                onClick={() => handleVerifyFindings(selectedFindings, 'FALSE_POSITIVE')}
              >
                Mark False Positive
              </Button>
            </>
          )}
          
          <Button 
            onClick={handleGenerateReport} 
            disabled={verifiedCount === 0}
          >
            <FileText className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search findings..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Severity</label>
              <Select 
                value={filters.severity} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, severity: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All severities</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select 
                value={filters.state} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, state: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All statuses</SelectItem>
                  <SelectItem value="AUTOMATED">Automated</SelectItem>
                  <SelectItem value="VERIFIED">Verified</SelectItem>
                  <SelectItem value="FALSE_POSITIVE">False Positive</SelectItem>
                  <SelectItem value="DISREGARD">Disregard</SelectItem>
                  <SelectItem value="NEED_OWNER_VERIFICATION">Need Owner Verification</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Findings Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedFindings.length === findings.length && findings.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedFindings(findings.map(f => f.id))
                      } else {
                        setSelectedFindings([])
                      }
                    }}
                  />
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Recommendation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {findings.map((finding) => (
                <TableRow key={finding.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedFindings.includes(finding.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedFindings(prev => [...prev, finding.id])
                        } else {
                          setSelectedFindings(prev => prev.filter(id => id !== finding.id))
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {finding.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getSeverityVariant(finding.severity)}>
                      {finding.severity}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <p className="truncate">{finding.description}</p>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={finding.state}
                      onValueChange={(newState) => handleVerifyFindings([finding.id], newState)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AUTOMATED">Automated</SelectItem>
                        <SelectItem value="VERIFIED">Verified</SelectItem>
                        <SelectItem value="FALSE_POSITIVE">False Positive</SelectItem>
                        <SelectItem value="DISREGARD">Disregard</SelectItem>
                        <SelectItem value="NEED_OWNER_VERIFICATION">Need Owner Verification</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <p className="text-sm text-muted-foreground truncate">
                      {finding.recommendation}
                    </p>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {findings.length === 0 && (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No findings found</h3>
              <p className="text-muted-foreground">
                No security findings match your current filters.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
</file>

<file path="app/(dashboard)/scans/[scanId]/page.tsx">
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Activity,
  FileText
} from 'lucide-react'
import { Scan } from '@/lib/types/database'

export default function ScanProgressPage() {
  const params = useParams()
  const router = useRouter()
  const scanId = params.scanId as string
  
  const [scan, setScan] = useState<Scan | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchScan = async () => {
      try {
        const response = await fetch(`/api/scans/${scanId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch scan')
        }
        const scanData = await response.json()
        setScan(scanData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    fetchScan()

    // Poll for updates every 2 seconds if scan is in progress
    const interval = setInterval(() => {
      if (scan?.status === 'processing' || scan?.status === 'pending') {
        fetchScan()
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [scanId, scan?.status])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading scan details...</p>
        </div>
      </div>
    )
  }

  if (error || !scan) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Scan Not Found</h2>
        <p className="text-muted-foreground mb-4">
          {error || 'The requested scan could not be found.'}
        </p>
        <Button onClick={() => router.push('/dashboard')}>
          Return to Dashboard
        </Button>
      </div>
    )
  }

  const progressPercentage = (scan.progress / scan.total_modules) * 100

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default'
      case 'processing': return 'secondary'
      case 'failed': return 'destructive'
      default: return 'outline'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'processing': return <Activity className="h-4 w-4 animate-spin" />
      case 'failed': return <AlertTriangle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{scan.company_name}</h1>
          <p className="text-muted-foreground">{scan.domain}</p>
        </div>
        <Badge variant={getStatusVariant(scan.status)} className="gap-1">
          {getStatusIcon(scan.status)}
          {scan.status.charAt(0).toUpperCase() + scan.status.slice(1)}
        </Badge>
      </div>

      {/* Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle>Scan Progress</CardTitle>
          <CardDescription>
            Security assessment progress across all modules
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Modules Completed</span>
              <span>{scan.progress}/{scan.total_modules}</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{Math.round(progressPercentage)}% complete</span>
              <span>
                {scan.status === 'completed' 
                  ? 'Scan completed' 
                  : scan.status === 'processing'
                  ? 'Scanning in progress...'
                  : 'Waiting to start...'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Module Status Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Security Modules</CardTitle>
          <CardDescription>
            Individual module completion status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: scan.total_modules }, (_, i) => {
              const moduleNumber = i + 1
              const isCompleted = moduleNumber <= scan.progress
              const isCurrent = moduleNumber === scan.progress + 1 && scan.status === 'processing'
              
              return (
                <div
                  key={moduleNumber}
                  className={`
                    flex items-center gap-2 p-3 rounded-lg border
                    ${isCompleted 
                      ? 'bg-green-50 border-green-200 text-green-800' 
                      : isCurrent
                      ? 'bg-blue-50 border-blue-200 text-blue-800'
                      : 'bg-muted/50 border-border text-muted-foreground'
                    }
                  `}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : isCurrent ? (
                    <Activity className="h-4 w-4 animate-spin" />
                  ) : (
                    <Clock className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium">
                    Module {moduleNumber}
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Scan Details */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Scan Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Started:</span>
              <span>{new Date(scan.created_at).toLocaleString()}</span>
            </div>
            {scan.completed_at && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completed:</span>
                <span>{new Date(scan.completed_at).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Modules:</span>
              <span>{scan.total_modules}</span>
            </div>
            {scan.tags && scan.tags.length > 0 && (
              <div className="space-y-2">
                <span className="text-muted-foreground">Tags:</span>
                <div className="flex flex-wrap gap-1">
                  {scan.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {scan.status === 'completed' ? (
              <>
                <p className="text-sm text-muted-foreground mb-3">
                  Your security scan has completed successfully. You can now review findings and generate reports.
                </p>
                <Button 
                  className="w-full" 
                  onClick={() => router.push(`/scans/${scanId}/findings`)}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Review Findings
                </Button>
              </>
            ) : scan.status === 'processing' ? (
              <>
                <p className="text-sm text-muted-foreground mb-3">
                  Your scan is currently in progress. You&apos;ll be able to review findings once it completes.
                </p>
                <Button variant="outline" className="w-full" disabled>
                  <Activity className="mr-2 h-4 w-4 animate-spin" />
                  Scan in Progress...
                </Button>
              </>
            ) : scan.status === 'failed' ? (
              <>
                <p className="text-sm text-destructive mb-3">
                  Your scan has failed. Please try starting a new scan or contact support.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push('/scans/new')}
                >
                  Start New Scan
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-3">
                  Your scan is queued and will begin shortly.
                </p>
                <Button variant="outline" className="w-full" disabled>
                  <Clock className="mr-2 h-4 w-4" />
                  Waiting to Start...
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
</file>

<file path="app/(dashboard)/scans/new/page.tsx">
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { X, Plus, Upload, FileSpreadsheet } from 'lucide-react'

interface CsvScanData {
  companyName: string
  domain: string
  tags: string[]
}

export default function NewScanPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    companyName: '',
    domain: '',
    tags: [] as string[]
  })
  const [newTag, setNewTag] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<CsvScanData[]>([])
  const [showCsvPreview, setShowCsvPreview] = useState(false)
  const [uploadMode, setUploadMode] = useState<'single' | 'bulk'>('single')

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setShowConfirmDialog(true)
  }

  const startScan = async () => {
    setIsLoading(true)
    setShowConfirmDialog(false)

    try {
      if (uploadMode === 'bulk' && csvData.length > 0) {
        const response = await fetch('/api/scans/bulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ scans: csvData }),
        })

        if (!response.ok) {
          throw new Error('Failed to start bulk scans')
        }
      } else {
        const response = await fetch('/api/scans', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            companyName: formData.companyName,
            domain: formData.domain,
            tags: formData.tags
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to start scan')
        }
      }

      router.push('/scans')
    } catch (error) {
      console.error('Error starting scan:', error)
      // Here you would typically show an error toast/notification
    } finally {
      setIsLoading(false)
    }
  }

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'text/csv') {
      setCsvFile(file)
      parseCsvFile(file)
    }
  }

  const parseCsvFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n').filter(line => line.trim())
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim())
        const row: Partial<CsvScanData> = {}
        
        headers.forEach((header, index) => {
          if (header === 'company' || header === 'company_name' || header === 'companyname') {
            row.companyName = values[index]
          } else if (header === 'domain') {
            row.domain = values[index]
          } else if (header === 'tags') {
            row.tags = values[index] ? values[index].split(';').map(t => t.trim()).filter(t => t) : []
          }
        })
        
        return row
      }).filter((row): row is CsvScanData => 
        Boolean(row.companyName && row.domain)
      )
      
      setCsvData(data)
      setShowCsvPreview(true)
    }
    reader.readAsText(file)
  }

  const isFormValid = formData.companyName.trim() && formData.domain.trim()

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Start New Security Scan</h1>
        <p className="text-muted-foreground">
          Initiate a comprehensive security assessment for your target organization
        </p>
      </div>

      {/* Mode Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Scan Type</CardTitle>
          <CardDescription>
            Choose between single scan or bulk upload
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              type="button"
              variant={uploadMode === 'single' ? 'default' : 'outline'}
              onClick={() => setUploadMode('single')}
              className="flex-1"
            >
              Single Scan
            </Button>
            <Button
              type="button"
              variant={uploadMode === 'bulk' ? 'default' : 'outline'}
              onClick={() => setUploadMode('bulk')}
              className="flex-1"
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Bulk Upload (CSV)
            </Button>
          </div>
        </CardContent>
      </Card>

      {uploadMode === 'single' ? (
        <Card>
          <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Scan Configuration</CardTitle>
            <CardDescription>
              Provide the target details for your security assessment
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                placeholder="Acme Corporation"
                value={formData.companyName}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  companyName: e.target.value
                }))}
                autoCorrect="off"
                required
              />
              <p className="text-sm text-muted-foreground">
                The organization name for identification and reporting
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="domain">Target Domain</Label>
              <Input
                id="domain"
                placeholder="example.com"
                value={formData.domain}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  domain: e.target.value
                }))}
                autoCorrect="off"
                required
              />
              <p className="text-sm text-muted-foreground">
                Primary domain to scan (without https://)
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  placeholder="Add tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                  autoCorrect="off"
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:bg-muted rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              
              <p className="text-sm text-muted-foreground">
                Optional tags for categorization and filtering
              </p>
            </div>
          </CardContent>
          
          <CardFooter className="bg-muted/50 flex justify-between">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? 'Starting Scan...' : 'Start Security Scan'}
            </Button>
          </CardFooter>
        </form>
      </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Bulk Scan Upload</CardTitle>
            <CardDescription>
              Upload a CSV file with columns: company, domain, tags (optional)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="csv-upload">CSV File</Label>
              <div className="flex items-center gap-4">
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleCsvUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('csv-upload')?.click()}
                  className="w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {csvFile ? csvFile.name : 'Choose CSV File'}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                CSV should have headers: company, domain, tags (tags separated by semicolons)
              </p>
            </div>

            {showCsvPreview && csvData.length > 0 && (
              <div className="space-y-2">
                <Label>Preview ({csvData.length} scans)</Label>
                <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                  <div className="space-y-2">
                    {csvData.slice(0, 5).map((scan, index) => (
                      <div key={index} className="text-sm border-b pb-2">
                        <div><strong>Company:</strong> {scan.companyName}</div>
                        <div><strong>Domain:</strong> {scan.domain}</div>
                        {scan.tags && scan.tags.length > 0 && (
                          <div><strong>Tags:</strong> {scan.tags.join(', ')}</div>
                        )}
                      </div>
                    ))}
                    {csvData.length > 5 && (
                      <div className="text-xs text-muted-foreground">
                        ... and {csvData.length - 5} more
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="bg-muted/50 flex justify-between">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              disabled={!csvFile || csvData.length === 0 || isLoading}
              onClick={() => setShowConfirmDialog(true)}
            >
              {isLoading ? 'Starting Scans...' : `Start ${csvData.length} Scans`}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Scan Information */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>What happens next?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium">Comprehensive Assessment</h4>
              <p className="text-sm text-muted-foreground">
                Our 16-module scanner will analyze the target for vulnerabilities, 
                misconfigurations, and security weaknesses.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Real-time Progress</h4>
              <p className="text-sm text-muted-foreground">
                Monitor scan progress in real-time with live updates as each 
                security module completes its assessment.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Finding Verification</h4>
              <p className="text-sm text-muted-foreground">
                Review and verify discovered issues, filtering out false 
                positives to focus on real security concerns.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">AI-Powered Reports</h4>
              <p className="text-sm text-muted-foreground">
                Generate professional security reports with executive summaries 
                and technical recommendations using AI analysis.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="bg-white border shadow-lg">
          <DialogHeader>
            <DialogTitle>Confirm Security Scan</DialogTitle>
            <DialogDescription>
              Are you sure you want to start a security scan for this target?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {uploadMode === 'single' ? (
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div>
                  <span className="font-medium">Company:</span> {formData.companyName}
                </div>
                <div>
                  <span className="font-medium">Domain:</span> {formData.domain}
                </div>
                {formData.tags.length > 0 && (
                  <div>
                    <span className="font-medium">Tags:</span> {formData.tags.join(', ')}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div>
                  <span className="font-medium">Scans to create:</span> {csvData.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Companies: {csvData.map(s => s.companyName).join(', ')}
                </div>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. The scan{uploadMode === 'bulk' ? 's' : ''} will begin immediately and may take some time to complete.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={startScan} disabled={isLoading}>
              {isLoading ? 'Starting Scan...' : 'Start Scan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
</file>

<file path="app/(dashboard)/scans/page.tsx">
'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Plus,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { Scan } from '@/lib/types/database'

export default function ScansPage() {
  const { data: scans, isLoading } = useQuery<Scan[]>({
    queryKey: ['all-scans'],
    queryFn: async () => {
      const response = await fetch('/api/scans')
      if (!response.ok) throw new Error('Failed to fetch scans')
      return response.json()
    }
  })

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default'
      case 'processing': return 'secondary'
      case 'failed': return 'destructive'
      default: return 'outline'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'processing': return <Activity className="h-4 w-4 animate-spin" />
      case 'failed': return <AlertTriangle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const activeScans = scans?.filter(s => s.status === 'processing' || s.status === 'pending') || []
  const completedScans = scans?.filter(s => s.status === 'completed') || []
  const failedScans = scans?.filter(s => s.status === 'failed') || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Scans</h1>
          <p className="text-muted-foreground">
            Manage and monitor all security assessments
          </p>
        </div>
        
        <Button asChild>
          <Link href="/scans/new">
            <Plus className="mr-2 h-4 w-4" />
            New Scan
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scans?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeScans.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedScans.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedScans.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Scans Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Scans</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scans?.map((scan) => {
                  const progressPercentage = (scan.progress / scan.total_modules) * 100
                  return (
                    <TableRow key={scan.scan_id}>
                      <TableCell className="font-medium">
                        {scan.company_name}
                      </TableCell>
                      <TableCell>{scan.domain}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(scan.status)} className="gap-1">
                          {getStatusIcon(scan.status)}
                          {scan.status.charAt(0).toUpperCase() + scan.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Progress value={progressPercentage} className="w-16 h-2" />
                          <span className="text-xs text-muted-foreground w-8">
                            {Math.round(progressPercentage)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(scan.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {scan.tags && scan.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {scan.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {scan.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{scan.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/scans/${scan.scan_id}`}>
                              View
                            </Link>
                          </Button>
                          {scan.status === 'completed' && (
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/scans/${scan.scan_id}/findings`}>
                                Findings
                              </Link>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
          
          {!isLoading && (!scans || scans.length === 0) && (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No scans yet</h3>
              <p className="text-muted-foreground mb-4">
                Start your first security scan to see results here.
              </p>
              <Button asChild>
                <Link href="/scans/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Start First Scan
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
</file>

<file path="app/(dashboard)/settings/page.tsx">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  User,
  Shield,
  Bell,
  Database
} from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and application preferences
        </p>
      </div>

      <div className="grid gap-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Settings
            </CardTitle>
            <CardDescription>
              Update your personal information and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" placeholder="John" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" placeholder="Doe" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="john@example.com" />
            </div>
            
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Settings
            </CardTitle>
            <CardDescription>
              Manage your security preferences and API keys
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input id="currentPassword" type="password" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input id="confirmPassword" type="password" />
            </div>
            
            <Button>Update Password</Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Settings
            </CardTitle>
            <CardDescription>
              Configure how you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Scan Completion</p>
                <p className="text-sm text-muted-foreground">
                  Get notified when scans finish
                </p>
              </div>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Critical Findings</p>
                <p className="text-sm text-muted-foreground">
                  Immediate alerts for critical security issues
                </p>
              </div>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Integration Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Integration Settings
            </CardTitle>
            <CardDescription>
              Manage external service integrations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="supabaseUrl">Supabase URL</Label>
              <Input 
                id="supabaseUrl" 
                placeholder="https://your-project.supabase.co"
                disabled
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="openaiKey">OpenAI API Key</Label>
              <Input 
                id="openaiKey" 
                type="password" 
                placeholder="sk-..."
                disabled
              />
            </div>
            
            <p className="text-sm text-muted-foreground">
              API keys are configured via environment variables for security.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
</file>

<file path="app/(dashboard)/layout.tsx">
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-background">
      <div className="border-r bg-muted/40">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
</file>

<file path="app/api/dashboard/recent-scans/route.ts">
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: recentScans, error } = await supabase
      .from('scan_status')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch recent scans' },
        { status: 500 }
      )
    }

    return NextResponse.json(recentScans)
  } catch (error) {
    console.error('Failed to fetch recent scans:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
</file>

<file path="app/api/dashboard/stats/route.ts">
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Get total scans
    const { count: totalScans } = await supabase
      .from('scan_status')
      .select('*', { count: 'exact', head: true })

    // Get critical findings count
    const { count: criticalFindings } = await supabase
      .from('findings')
      .select('*', { count: 'exact', head: true })
      .eq('severity', 'CRITICAL')

    // Get verified issues count
    const { count: verifiedIssues } = await supabase
      .from('findings')
      .select('*', { count: 'exact', head: true })
      .eq('state', 'VERIFIED')

    // Get active scans count
    const { count: activeScans } = await supabase
      .from('scan_status')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'processing'])

    return NextResponse.json({
      totalScans: totalScans || 0,
      criticalFindings: criticalFindings || 0,
      verifiedIssues: verifiedIssues || 0,
      activeScans: activeScans || 0
    })
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
</file>

<file path="app/api/findings/verify/route.ts">
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PATCH(request: NextRequest) {
  try {
    const { findingIds, state: requestedState } = await request.json()
    let state = requestedState

    if (!findingIds || !Array.isArray(findingIds) || !state) {
      return NextResponse.json(
        { error: 'Finding IDs and state are required' },
        { status: 400 }
      )
    }

    // First, let's see what enum values actually exist in the database
    if (state === 'FALSE_POSITIVE') {
      const { data: allFindings } = await supabase
        .from('findings')
        .select('state')
        .limit(100)
      
      if (allFindings) {
        const uniqueStates = [...new Set(allFindings.map(f => f.state))]
        console.log('Existing state values in database:', uniqueStates)
        
        // Try to find a "false positive" equivalent
        const falsePositiveVariations = uniqueStates.filter(s => 
          s.toLowerCase().includes('false') || 
          s.toLowerCase().includes('positive') ||
          s.toLowerCase().includes('reject') ||
          s.toLowerCase().includes('invalid')
        )
        
        console.log('Possible false positive states:', falsePositiveVariations)
        
        if (falsePositiveVariations.length > 0) {
          state = falsePositiveVariations[0]
          console.log('Using state:', state)
        }
      }
    }

    console.log('Attempting to update findings:', { findingIds, state })
    
    const { data, error } = await supabase
      .from('findings')
      .update({ state })
      .in('id', findingIds)
      .select()

    if (error) {
      console.error('Database error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return NextResponse.json(
        { 
          error: 'Failed to update findings',
          details: error.message,
          code: error.code
        },
        { status: 500 }
      )
    }

    console.log('Successfully updated findings:', data)

    return NextResponse.json({ 
      updated: data.length,
      findings: data 
    })
  } catch (error) {
    console.error('Failed to verify findings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
</file>

<file path="app/api/findings/route.ts">
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const scanId = searchParams.get('scanId')
    const severity = searchParams.get('severity')
    const state = searchParams.get('state')
    const type = searchParams.get('type')
    const search = searchParams.get('search')

    let query = supabase.from('findings').select('*')

    if (scanId) {
      query = query.eq('scan_id', scanId)
    }

    if (severity) {
      const severities = severity.split(',')
      query = query.in('severity', severities)
    }

    if (state) {
      const states = state.split(',')
      query = query.in('state', states)
    }

    if (type) {
      const types = type.split(',')
      query = query.in('type', types)
    }

    if (search) {
      query = query.or(`description.ilike.%${search}%,recommendation.ilike.%${search}%`)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch findings' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Failed to fetch findings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
</file>

<file path="app/api/reports/generate/# Due-Diligence Risk Assessment Prompt.ini">
# Due-Diligence Risk Assessment Prompt

**SYSTEM**
You are DealBrief-GPT, a senior U.S. cybersecurity analyst specializing in investor-grade due diligence reports. You write for private equity firms, investment banks, and corporate development teams evaluating acquisition targets. Always use American English, maintain a serious professional tone, and express financial impacts as concrete dollar values rounded to the nearest $1,000.

────────────────────────────────────────
## INPUT SPECIFICATIONS
Data from Supabase findings table in one of these formats:
• **SQL INSERT statements**: Extract VALUES clause and parse tuples
• **CSV with headers**: id, created_at, description, scan_id, type, recommendation, severity, attack_type_code, state, eal_low, eal_ml, eal_high

**Required fields per finding:**
- `id` (unique identifier)
- `description` (technical finding details)  
- `type` (risk category)
- `severity` (HIGH/MEDIUM/LOW)
- `attack_type_code` (threat vector)
- `eal_low`, `eal_ml`, `eal_high` (estimated annual loss integers)
- `recommendation` (remediation guidance)
- `created_at` (discovery timestamp)

────────────────────────────────────────
## ANALYSIS TASKS

### 1. Data Parsing & Validation
- Parse input format (SQL or CSV) without hallucinating missing fields
- Deduplicate identical findings (same type + description)
- Group all findings by scan_id for unified reporting

### 2. Portfolio Risk Calculation
- **Total EAL**: 
  • Primary estimate = sum of all eal_ml values
  • Confidence range = sum of all eal_low to sum of all eal_high
  • Format: ${sum_eal_ml} (range ${sum_eal_low}–${sum_eal_high})
- **Category Analysis**: Group by `type`, count findings, calculate category-level EAL using same logic
- **Timeline Analysis**: Note findings discovered in last 30 days vs. older issues

### 3. Priority Finding Selection
Apply this logic in order:
1. **Critical Path**: All HIGH severity findings
2. **Material Medium**: MEDIUM findings where individual eal_ml ≥ 75th percentile of all individual eal_ml values
3. **Recent Escalation**: Any findings discovered in last 7 days regardless of severity
4. **Cap at 15 findings maximum** to maintain report focus
5. **Sort final list**: eal_ml descending, then by severity (HIGH > MEDIUM > LOW)

### 4. Report Generation
- Use the exact template structure below
- Currency format: $XXX,000 (thousands, no decimals)
- Technical details verbatim in "Technical Description"
- Plain English (no jargon) in Executive Summary and Practical Explanations
- Include scan_id and generation timestamp

────────────────────────────────────────
## REPORT TEMPLATE

```markdown
# Cybersecurity Due Diligence Report
**Scan ID**: {scan_id} | **Generated**: {current_date}

## Executive Summary
{2-3 paragraph narrative ≤ 200 words covering:}
• **Total Estimated Annual Loss**: ${sum_eal_ml} (range ${sum_eal_low}–${sum_eal_high})
• **Critical exposures** in plain business language (avoid "CVE", "DMARC", etc.)
• **Overall security posture** relative to industry standards
• **Immediate actions required** to reduce material risk

## Risk Landscape
| Risk Category | Findings | Highest Severity | Est. Annual Loss |
|---------------|----------|------------------|------------------|
| {type} | {count} | {max_severity} | ${category_eal_ml} |
{...repeat for each category...}
| **TOTAL** | **{total_count}** | **—** | **${total_eal_ml}** |

## Remediation Guide
*Organized by category and severity for efficient resolution*

### {CATEGORY_NAME}
#### HIGH Severity
- **Finding {id}**: {recommendation}
- **Finding {id}**: {recommendation}

#### MEDIUM Severity  
- **Finding {id}**: {recommendation}

#### LOW Severity
- **Finding {id}**: {recommendation}

{...repeat for each category with findings...}

## Priority Findings
*{count} findings selected based on severity and financial impact*

### Finding {id} – {type} *(Severity: {severity})*
**Technical Description**
> {description}

**Business Impact**  
{1-2 sentences explaining how this specific vulnerability could harm operations, revenue, or reputation in plain English}

**Financial Exposure**  
**${eal_ml} annually** (range ${eal_low}–${eal_high})

**Recommended Action**  
{recommendation}
{Add specific first step if recommendation is generic, e.g., "Start by auditing all admin accounts created in the last 90 days."}

---
{...repeat for each priority finding...}

## Risk Methodology
This assessment uses the Cyber Risk Quantification (CRQ) framework standard in M&A due diligence:

1. **Base Loss Calculation**: Each vulnerability maps to historical incident data for similar attack vectors affecting mid-market U.S. companies
2. **Probability Modeling**: Likelihood estimates derived from NIST, Verizon DBIR, and industry-specific breach frequency data
3. **Severity Adjustments**: Environmental factors (exposure, complexity, existing controls) modify base probabilities
4. **Annual Loss Calculation**: EAL = (Attack Probability × Average Incident Cost); confidence intervals reflect uncertainty in both variables
5. **Portfolio Aggregation**: Simple summation across findings; no correlation adjustments applied

**Limitations**: Estimates assume current threat landscape and typical organizational response capabilities. Actual losses may vary significantly based on incident response maturity and business continuity preparedness.
```

────────────────────────────────────────
## QUALITY STANDARDS

**Accuracy**: Never fabricate data points. If fields are missing or malformed, explicitly note gaps rather than estimating.

**Clarity**: Executive Summary must be readable by non-technical stakeholders. Avoid security acronyms and explain impacts in business terms.

**Completeness**: Every priority finding must include all five subsections. If recommendation is generic, add specific implementation guidance.

**Professional Tone**: Write for sophisticated investors who need actionable intelligence, not security practitioners who need technical depth.

**Consistency**: Use identical formatting, currency presentation, and section structure throughout.
</file>

<file path="app/api/reports/generate/route.ts">
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import OpenAI from 'openai'
import * as fs from 'fs'
import * as path from 'path'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key',
})

export async function POST(request: NextRequest) {
  try {
    const { scanId, findings, companyName, domain } = await request.json()

    if (!scanId || !findings || !companyName || !domain) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Read the prompt from prompt.md
    const promptPath = path.join(process.cwd(), 'prompt.md')
    const promptContent = fs.readFileSync(promptPath, 'utf-8')

    // Prepare findings data in CSV format as specified in prompt.md
    const csvHeader = 'id,created_at,description,scan_id,type,recommendation,severity,attack_type_code,state,eal_low,eal_ml,eal_high,eal_daily'
    const csvRows = findings.map((f: {
      id: string;
      created_at?: string;
      description: string;
      type: string;
      recommendation: string;
      severity: string;
      attack_type_code?: string;
      state: string;
      eal_low?: number | null;
      eal_ml?: number | null;
      eal_high?: number | null;
      eal_daily?: number | null;
    }) => {
      const escapeCsv = (field: string) => field ? `"${field.replace(/"/g, '""')}"` : '""'
      return [
        f.id,
        f.created_at || new Date().toISOString(),
        escapeCsv(f.description),
        scanId,
        f.type,
        escapeCsv(f.recommendation),
        f.severity,
        f.attack_type_code || 'UNKNOWN',
        f.state,
        f.eal_low || '',
        f.eal_ml || '',
        f.eal_high || '',
        f.eal_daily || ''
      ].join(',')
    })
    const csvData = [csvHeader, ...csvRows].join('\n')

    // Generate report using OpenAI with the prompt.md content
    const completion = await openai.chat.completions.create({
      model: 'o3-2025-04-16',
      messages: [
        {
          role: 'system',
          content: promptContent
        },
        {
          role: 'user',
          content: `Generate a due diligence report for ${companyName} (${domain}, scan_id: ${scanId}).

CSV data with verified findings:
${csvData}`
        }
      ],
      max_completion_tokens: 50000
    })

    const reportContent = completion.choices[0].message.content

    if (!reportContent) {
      return NextResponse.json(
        { error: 'Failed to generate report content' },
        { status: 500 }
      )
    }

    // Save report to database
    const { data, error } = await supabase
      .from('reports')
      .insert({
        id: scanId, // Use scan_id as the primary key
        scan_id: scanId,
        company_name: companyName,
        domain,
        content: reportContent,
        findings_count: findings.length,
        status: 'completed'
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to save report' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      reportId: data.id,
      content: reportContent 
    })

  } catch (error) {
    console.error('Failed to generate report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
</file>

<file path="app/api/reports/route.ts">
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: reports, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch reports' },
        { status: 500 }
      )
    }

    return NextResponse.json(reports)
  } catch (error) {
    console.error('Failed to fetch reports:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
</file>

<file path="app/api/scans/bulk/route.ts">
import { NextRequest, NextResponse } from 'next/server'

interface BulkScanRequest {
  companyName: string
  domain: string
  tags?: string[]
}

export async function POST(request: NextRequest) {
  try {
    const { scans } = await request.json() as { scans: BulkScanRequest[] }

    if (!scans || !Array.isArray(scans) || scans.length === 0) {
      return NextResponse.json(
        { error: 'Scans array is required and must not be empty' },
        { status: 400 }
      )
    }

    // Validate each scan entry
    const validScans = scans.filter(scan => 
      scan.companyName && scan.companyName.trim() && 
      scan.domain && scan.domain.trim()
    )

    if (validScans.length === 0) {
      return NextResponse.json(
        { error: 'No valid scans found. Each scan must have companyName and domain' },
        { status: 400 }
      )
    }

    const results = []
    const errors = []

    // Process each scan sequentially to avoid overwhelming the external API
    for (const scan of validScans) {
      try {
        const response = await fetch('https://dealbrief-scanner.fly.dev/scans', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': 'https://lfbi.vercel.app'
          },
          body: JSON.stringify({
            companyName: scan.companyName.trim(),
            domain: scan.domain.trim(),
            tags: scan.tags || []
          })
        })

        if (!response.ok) {
          throw new Error(`Scanner API error for ${scan.companyName}: ${response.statusText}`)
        }

        const result = await response.json()
        results.push({
          companyName: scan.companyName,
          domain: scan.domain,
          status: 'success',
          scanId: result.scanId || result.id
        })

        // Add a small delay between requests to be respectful to the external API
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error) {
        console.error(`Failed to start scan for ${scan.companyName}:`, error)
        errors.push({
          companyName: scan.companyName,
          domain: scan.domain,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: results.length > 0,
      total: validScans.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors
    })

  } catch (error) {
    console.error('Failed to process bulk scans:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
</file>

<file path="app/api/scans/route.ts">
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { companyName, domain, tags } = await request.json()

    if (!companyName || !domain) {
      return NextResponse.json(
        { error: 'Company name and domain are required' },
        { status: 400 }
      )
    }

    // Call the external scanner API (keep working scan functionality)
    const response = await fetch('https://dealbrief-scanner.fly.dev/scans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://lfbi.vercel.app'
      },
      body: JSON.stringify({
        companyName,
        domain,
        tags: tags || []
      })
    })

    if (!response.ok) {
      throw new Error(`Scanner API error: ${response.statusText}`)
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to start scan:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('scan_status')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch scans' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Failed to fetch scans:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
</file>

<file path="app/globals.css">
@import "tailwindcss";

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 84% 4.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 84% 4.9%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 94.1%;
  }
}

@layer base {
  * {
    border-color: hsl(var(--border));
  }
  body {
    background-color: hsl(var(--background));
    color: hsl(var(--foreground));
  }
}
</file>

<file path="app/layout.tsx">
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DealBrief Security Scanner",
  description: "Comprehensive security scanning and vulnerability assessment platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
</file>

<file path="app/page.tsx">
import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/dashboard')
}
</file>

<file path="components/layout/header.tsx">
'use client'

import { Bell, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function Header() {
  return (
    <header className="border-b">
      <div className="flex h-16 items-center px-4 gap-4">
        <div className="ml-auto flex items-center space-x-4">
          <Button variant="ghost" size="icon">
            <Bell className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
</file>

<file path="components/layout/sidebar.tsx">
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { 
  Shield, 
  Activity, 
  Plus, 
  FileText, 
  Settings,
  Search,
  Home
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'New Scan', href: '/scans/new', icon: Plus },
  { name: 'Active Scans', href: '/scans', icon: Activity },
  { name: 'Findings', href: '/findings', icon: Search },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="pb-12 w-64">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-8 h-8 text-primary" />
            <h2 className="text-lg font-semibold tracking-tight">DealBrief</h2>
          </div>
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/dashboard' && pathname.startsWith(item.href))
              
              return (
                <Button
                  key={item.name}
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start',
                    isActive && 'bg-secondary'
                  )}
                  asChild
                >
                  <Link href={item.href}>
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Link>
                </Button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
</file>

<file path="components/ui/badge.tsx">
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
</file>

<file path="components/ui/button.tsx">
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
</file>

<file path="components/ui/card.tsx">
import * as React from "react"

import { cn } from "@/lib/utils"

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
</file>

<file path="components/ui/checkbox.tsx">
"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer border-input dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-none"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
</file>

<file path="components/ui/collapsible.tsx">
"use client"

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"

function Collapsible({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
}

function CollapsibleTrigger({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>) {
  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      data-slot="collapsible-trigger"
      {...props}
    />
  )
}

function CollapsibleContent({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>) {
  return (
    <CollapsiblePrimitive.CollapsibleContent
      data-slot="collapsible-content"
      {...props}
    />
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
</file>

<file path="components/ui/dialog.tsx">
"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
</file>

<file path="components/ui/dropdown-menu.tsx">
"use client"

import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function DropdownMenu({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

function DropdownMenuPortal({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  return (
    <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
  )
}

function DropdownMenuTrigger({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      {...props}
    />
  )
}

function DropdownMenuContent({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md",
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
}

function DropdownMenuGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
  return (
    <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
  )
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean
  variant?: "default" | "destructive"
}) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      checked={checked}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  )
}

function DropdownMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  )
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CircleIcon className="size-2 fill-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  )
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "px-2 py-1.5 text-sm font-medium data-[inset]:pl-8",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("bg-border -mx-1 my-1 h-px", className)}
      {...props}
    />
  )
}

function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "text-muted-foreground ml-auto text-xs tracking-widest",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSub({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[inset]:pl-8",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto size-4" />
    </DropdownMenuPrimitive.SubTrigger>
  )
}

function DropdownMenuSubContent({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  return (
    <DropdownMenuPrimitive.SubContent
      data-slot="dropdown-menu-sub-content"
      className={cn(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-md border p-1 shadow-lg",
        className
      )}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
}
</file>

<file path="components/ui/input.tsx">
import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
</file>

<file path="components/ui/label.tsx">
"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"

import { cn } from "@/lib/utils"

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label }
</file>

<file path="components/ui/progress.tsx">
"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="bg-primary h-full w-full flex-1 transition-all"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
</file>

<file path="components/ui/select.tsx">
"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Select({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectGroup({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default"
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="size-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  position = "popper",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border shadow-md",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "p-1",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1"
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn("text-muted-foreground px-2 py-1.5 text-xs", className)}
      {...props}
    />
  )
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className
      )}
      {...props}
    >
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("bg-border pointer-events-none -mx-1 my-1 h-px", className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className
      )}
      {...props}
    >
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className
      )}
      {...props}
    >
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
</file>

<file path="components/ui/table.tsx">
"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
</file>

<file path="lib/types/database.ts">
export interface Database {
  public: {
    Tables: {
      scan_status: {
        Row: {
          scan_id: string
          company_name: string
          domain: string
          status: 'pending' | 'processing' | 'completed' | 'failed'
          progress: number
          total_modules: number
          created_at: string
          completed_at: string | null
          tags: string[] | null
        }
        Insert: {
          scan_id: string
          company_name: string
          domain: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          progress?: number
          total_modules?: number
          created_at?: string
          completed_at?: string | null
          tags?: string[] | null
        }
        Update: {
          scan_id?: string
          company_name?: string
          domain?: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          progress?: number
          total_modules?: number
          created_at?: string
          completed_at?: string | null
          tags?: string[] | null
        }
      }
      findings: {
        Row: {
          id: string
          created_at: string
          description: string
          scan_id: string
          type: string
          recommendation: string
          severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
          attack_type_code: string
          state: 'AUTOMATED' | 'VERIFIED' | 'FALSE_POSITIVE' | 'DISREGARD' | 'NEED_OWNER_VERIFICATION'
          eal_low: number | null
          eal_ml: number | null
          eal_high: number | null
          eal_daily: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          description: string
          scan_id: string
          type: string
          recommendation: string
          severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
          attack_type_code: string
          state?: 'AUTOMATED' | 'VERIFIED' | 'FALSE_POSITIVE' | 'DISREGARD' | 'NEED_OWNER_VERIFICATION'
          eal_low?: number | null
          eal_ml?: number | null
          eal_high?: number | null
          eal_daily?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          description?: string
          scan_id?: string
          type?: string
          recommendation?: string
          severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
          attack_type_code?: string
          state?: 'AUTOMATED' | 'VERIFIED' | 'FALSE_POSITIVE' | 'DISREGARD' | 'NEED_OWNER_VERIFICATION'
          eal_low?: number | null
          eal_ml?: number | null
          eal_high?: number | null
          eal_daily?: number | null
        }
      }
      reports: {
        Row: {
          id: string
          scan_id: string
          company_name: string
          domain: string
          content: string
          findings_count: number
          status: 'pending' | 'completed'
          created_at: string
        }
        Insert: {
          id?: string
          scan_id: string
          company_name: string
          domain: string
          content: string
          findings_count: number
          status?: 'pending' | 'completed'
          created_at?: string
        }
        Update: {
          id?: string
          scan_id?: string
          company_name?: string
          domain?: string
          content?: string
          findings_count?: number
          status?: 'pending' | 'completed'
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Scan = Database['public']['Tables']['scan_status']['Row']
export type Finding = Database['public']['Tables']['findings']['Row']
export type Report = Database['public']['Tables']['reports']['Row']
</file>

<file path="lib/providers.tsx">
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
</file>

<file path="lib/supabase.ts">
import { createClient } from '@supabase/supabase-js'
import { Database } from './types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
</file>

<file path="lib/utils.ts">
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
</file>

</files>
