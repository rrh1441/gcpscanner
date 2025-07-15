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