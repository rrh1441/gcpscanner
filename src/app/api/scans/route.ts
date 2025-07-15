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