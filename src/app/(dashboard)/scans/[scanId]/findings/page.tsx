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