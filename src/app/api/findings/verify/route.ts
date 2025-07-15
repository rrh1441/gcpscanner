import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PATCH(request: NextRequest) {
  try {
    const { findingIds, state: requestedState } = await request.json()
    let state = requestedState

    if (!findingIds || !Array.isArray(findingIds) || !state) {
      return NextResponse.json(
        { error: 'Finding IDs and state are required' },
        { status: 400 }
      )
    }

    // First, let's see what enum values actually exist in the database
    if (state === 'FALSE_POSITIVE') {
      const { data: allFindings } = await supabase
        .from('findings')
        .select('state')
        .limit(100)
      
      if (allFindings) {
        const uniqueStates = [...new Set(allFindings.map(f => f.state))]
        console.log('Existing state values in database:', uniqueStates)
        
        // Try to find a "false positive" equivalent
        const falsePositiveVariations = uniqueStates.filter(s => 
          s.toLowerCase().includes('false') || 
          s.toLowerCase().includes('positive') ||
          s.toLowerCase().includes('reject') ||
          s.toLowerCase().includes('invalid')
        )
        
        console.log('Possible false positive states:', falsePositiveVariations)
        
        if (falsePositiveVariations.length > 0) {
          state = falsePositiveVariations[0]
          console.log('Using state:', state)
        }
      }
    }

    console.log('Attempting to update findings:', { findingIds, state })
    
    const { data, error } = await supabase
      .from('findings')
      .update({ state })
      .in('id', findingIds)
      .select()

    if (error) {
      console.error('Database error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return NextResponse.json(
        { 
          error: 'Failed to update findings',
          details: error.message,
          code: error.code
        },
        { status: 500 }
      )
    }

    console.log('Successfully updated findings:', data)

    return NextResponse.json({ 
      updated: data.length,
      findings: data 
    })
  } catch (error) {
    console.error('Failed to verify findings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}