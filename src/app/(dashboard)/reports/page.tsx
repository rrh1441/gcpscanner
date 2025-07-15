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
  CheckCircle,
  AlertTriangle,
  Shield
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

  const getReportTypeInfo = (reportType?: string) => {
    switch (reportType) {
      case 'threat_snapshot':
        return { icon: AlertTriangle, label: 'Threat Snapshot', color: 'text-red-600' }
      case 'executive_summary':
        return { icon: Building, label: 'Executive Summary', color: 'text-blue-600' }
      case 'technical_remediation':
        return { icon: Shield, label: 'Technical Guide', color: 'text-green-600' }
      default:
        return { icon: FileText, label: 'Security Report', color: 'text-gray-600' }
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
          domain: scan.domain,
          reportTypes: process.env.NODE_ENV === 'development' 
            ? ['threat_snapshot', 'executive_summary', 'technical_remediation'] // Generate all three for testing
            : ['threat_snapshot'] // Production default: only snapshots
        }),
      })

      if (response.ok) {
        const { reports, primaryReportId } = await response.json()
        // Refresh reports list and navigate to the first generated report
        window.location.href = `/reports/${primaryReportId}`
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
                  <TableHead>Report</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Findings</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => {
                  const reportTypeInfo = getReportTypeInfo(report.report_type)
                  const IconComponent = reportTypeInfo.icon
                  
                  return (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <IconComponent className={`h-4 w-4 ${reportTypeInfo.color}`} />
                          <div>
                            <p className="font-medium">{reportTypeInfo.label}</p>
                            <p className="text-xs text-muted-foreground">ID: {report.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{report.company_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <span>{report.domain}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <Badge variant="outline">
                            {report.findings_count} findings
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(report.status)}>
                          {report.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{new Date(report.created_at).toLocaleDateString()}</div>
                          <div className="text-muted-foreground">
                            {new Date(report.created_at).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
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
                  )
                })}
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