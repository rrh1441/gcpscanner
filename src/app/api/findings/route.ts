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