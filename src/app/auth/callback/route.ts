import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/dashboard';

  if (code) {
    // This is handled by Supabase client-side
    // Just redirect to the next page
    return NextResponse.redirect(new URL(next, request.url));
  }

  return NextResponse.redirect(new URL('/auth/login', request.url));
}