'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Download,
  Share2,
  FileText,
  Building,
  Globe,
  Calendar,
  CheckCircle,
  Loader2,
  Check,
  AlertTriangle,
  Shield
} from 'lucide-react'
import { Report } from '@/lib/types/database'

export default function ReportDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [copiedToClipboard, setCopiedToClipboard] = useState(false)

  const { data: report, isLoading, error } = useQuery<Report>({
    queryKey: ['report', params.id],
    queryFn: async () => {
      const response = await fetch(`/api/reports/${params.id}`)
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Report not found')
        }
        throw new Error('Failed to fetch report')
      }
      return response.json()
    }
  })

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default'
      case 'pending': return 'secondary'
      default: return 'outline'
    }
  }

  const getReportTypeInfo = (reportType?: string) => {
    switch (reportType) {
      case 'threat_snapshot':
        return { icon: AlertTriangle, label: 'Threat Snapshot', color: 'text-red-600', description: 'Executive dashboard overview' }
      case 'executive_summary':
        return { icon: Building, label: 'Executive Summary', color: 'text-blue-600', description: 'Strategic briefing for leadership' }
      case 'technical_remediation':
        return { icon: Shield, label: 'Technical Guide', color: 'text-green-600', description: 'Detailed remediation instructions' }
      default:
        return { icon: FileText, label: 'Security Report', color: 'text-gray-600', description: 'Security assessment report' }
    }
  }

  const exportReport = async () => {
    if (!report) return
    
    try {
      const fileName = `${report.company_name.replace(/[^a-z0-9]/gi, '_')}_Security_Report_${new Date(report.created_at).toISOString().split('T')[0]}.md`
      
      const exportContent = `# Security Assessment Report
**Company:** ${report.company_name}  
**Domain:** ${report.domain}  
**Generated:** ${new Date(report.created_at).toLocaleDateString()}  
**Findings Count:** ${report.findings_count}  

---

${report.content}`

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

  const shareReport = async () => {
    const url = window.location.href
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Security Report - ${report?.company_name}`,
          text: `Security assessment report for ${report?.company_name}`,
          url: url,
        })
      } catch {
        // Fallback to clipboard
        copyToClipboard(url)
      }
    } else {
      // Fallback to clipboard
      copyToClipboard(url)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedToClipboard(true)
      setTimeout(() => setCopiedToClipboard(false), 2000)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading report...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Report Not Found</h3>
              <p className="text-muted-foreground mb-4">
                The requested report could not be found or may have been deleted.
              </p>
              <Button onClick={() => router.push('/reports')}>
                Back to Reports
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!report) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Security Report</h1>
            <p className="text-muted-foreground">
              Detailed security assessment for {report.company_name}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={shareReport}>
            {copiedToClipboard ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </>
            )}
          </Button>
          <Button variant="outline" onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Report Metadata */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {(() => {
                const reportTypeInfo = getReportTypeInfo(report.report_type)
                const IconComponent = reportTypeInfo.icon
                return (
                  <>
                    <IconComponent className={`h-5 w-5 ${reportTypeInfo.color}`} />
                    {reportTypeInfo.label}
                  </>
                )
              })()}
            </CardTitle>
            <Badge variant={getStatusVariant(report.status)}>
              {report.status}
            </Badge>
          </div>
          <CardDescription>
            {getReportTypeInfo(report.report_type).description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Company</p>
                <p className="font-medium">{report.company_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Domain</p>
                <p className="font-medium">{report.domain}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Findings</p>
                <p className="font-medium">{report.findings_count} verified</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Generated</p>
                <p className="font-medium">{new Date(report.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      <Card>
        <CardHeader>
          <CardTitle>Report Content</CardTitle>
          <CardDescription>
            AI-generated security assessment based on verified findings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                // Custom styling for tables
                table: ({ children }) => (
                  <div className="overflow-x-auto my-6">
                    <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 bg-gray-50 dark:bg-gray-800 text-left font-semibold">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                    {children}
                  </td>
                ),
                // Custom styling for code blocks
                code: ({ className, children }) => {
                  const isInline = !className
                  if (isInline) {
                    return (
                      <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm">
                        {children}
                      </code>
                    )
                  }
                  return (
                    <code className="block bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm">
                      {children}
                    </code>
                  )
                },
                // Custom styling for headings
                h1: ({ children }) => (
                  <h1 className="text-2xl font-bold mt-8 mb-4 first:mt-0">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xl font-bold mt-6 mb-3">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-lg font-semibold mt-4 mb-2">
                    {children}
                  </h3>
                ),
                // Custom styling for paragraphs
                p: ({ children }) => (
                  <p className="mb-4 leading-relaxed">
                    {children}
                  </p>
                ),
                // Custom styling for lists
                ul: ({ children }) => (
                  <ul className="list-disc list-inside mb-4 space-y-1">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside mb-4 space-y-1">
                    {children}
                  </ol>
                ),
              }}
            >
              {report.content}
            </ReactMarkdown>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}