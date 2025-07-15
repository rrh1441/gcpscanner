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