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