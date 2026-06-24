import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

/**
 * GET /api/get-users
 * Fetch all users for admin recommendation panel
 */
export async function GET() {
  try {
    const supabase = getSupabaseAdmin()

    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, name')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('[API] Error fetching users:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to fetch users' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      users: users || [],
      count: users?.length || 0,
    })
  } catch (error: any) {
    console.error('[API] Unhandled error fetching users:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
