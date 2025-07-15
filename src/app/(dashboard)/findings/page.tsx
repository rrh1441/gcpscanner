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