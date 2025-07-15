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