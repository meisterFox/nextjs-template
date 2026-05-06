import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasAnon = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return NextResponse.json({
    ok: true,
    name: 'luminescence',
    supabaseConfigured: hasUrl && hasAnon,
    time: new Date().toISOString(),
  })
}
